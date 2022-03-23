import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import mongoose from "mongoose";
import path from "path";
import crypto from "crypto";

import dbRoom from "./Schema/schemalRoom";

type ArgsData = {
  userId?: string;
  userOne: string;
  userTwo: string;
};

type ArgsMessage = {
  message: string;
  room: string;
  userId: string;
};

interface TypeArray {
  userId: string;
  message: string;
  dateAt: string;
}

interface TypesSchema {
  roomName: string;
  userOne: string;
  userTwo: string;
  talks?: TypeArray[];
}

interface TypeEventsEmit {
  onCreateRoom: (data: ArgsData) => void;
  init: (data: { userId: string }) => void;
  onMessageEmit: (data: ArgsMessage) => void;
  allTalks: (data: unknown[]) => void;
  messages_one: (data: unknown) => void;
  getMessagesRoom: (room: string) => void;
  refreshAll: (id: string) => void;
}

const app = express();
app.use(express.static(path.resolve(__dirname, "dev")));
const httpServer = createServer(app);

const io = new Server<TypeEventsEmit>(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

mongoose.connect("mongodb://localhost:27017/chatMe", (error) => {
  if (error) new Error("erro ao conectar!");
  console.log("conexão feita com sucesso!");
});

io.on("connection", async (socket) => {
  socket.on("init", async (data) => {
    const initialTalksUser = await dbRoom.find({ $or: [{ userOne: data.userId }, { userTwo: data.userId }] });

    socket.emit("allTalks", initialTalksUser);
  });

  socket.on("onCreateRoom", async (data) => {
    // create hash for room dynamic
    crypto.randomBytes(10, async (err, hash) => {
      if (err) return;

      const verifyExists = await dbRoom.find({
        $and: [
          { $or: [{ userOne: data.userOne }, { userTwo: data.userOne }] },
          { $or: [{ userOne: data.userTwo }, { userTwo: data.userTwo }] },
        ],
      });

      const formatNameRoom = String(hash.toString("hex")) + data.userOne + data.userTwo;

      if (!verifyExists.length) {
        await dbRoom.create({
          roomName: formatNameRoom,
          userOne: data.userOne,
          userTwo: data.userTwo,
        } as TypesSchema);

        const initialTalksUser = await dbRoom.find({ $or: [{ userOne: data.userId }, { userTwo: data.userId }] });

        socket.emit("allTalks", initialTalksUser);
        io.emit("refreshAll", data.userTwo);
      } else {
        return;
      }
    });
  });

  // adiciona o user em uma room e envia as mensagens recentes
  socket.on("getMessagesRoom", async (room) => {
    const messagesRoom = await dbRoom.findOne({ roomName: room });
    socket.join(room);

    io.to(room).emit("messages_one", messagesRoom);
  });

  // recebe novas mensagens e retorna novamente
  socket.on("onMessageEmit", async (data) => {
    const initialTalksUser = await dbRoom.findOne({ roomName: data.room });
    socket.join(String(data.room));

    const Talks: TypeArray[] = initialTalksUser.talks;
    Talks.push({
      userId: data.userId,
      message: data.message,
      dateAt: String(new Date()),
    });

    await dbRoom.updateOne(
      {
        roomName: data.room,
      },
      {
        talks: Talks,
      },
    );
    io.to(String(data.room)).emit("messages_one", initialTalksUser);
  });
});

httpServer.listen(3001, () => console.log("tudo ok"));
