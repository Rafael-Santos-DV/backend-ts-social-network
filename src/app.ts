import { config } from "dotenv";
import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import mongoose from "mongoose";
// import path from "path";
import crypto from "crypto";
import cors from "cors";

import dbRoom from "./Schema/schemalRoom";
import dbUsers from "./Schema/schemaUsers";

import routes from "./routes/routes";
import corsOptions from "./middlewares/cors";

type ArgsData = {
  userId?: string;
  userName: string;
  userOne: string;
  srcOne?: string;
  userTwo: string;
  hashSocket: string;
};

type ArgsMessage = {
  message: string;
  room: string;
  userId: string;
  hashSocket: string;
};

interface TypeArray {
  userId: string;
  message: string;
  dateAt: string;
}

interface TypesSchema {
  roomName: string;
  userOne: string;
  srcOne: string;
  userTwo: string;
  srcTwo: string;
  talks?: TypeArray[];
}

interface TypeEventsEmit {
  onCreateRoom: (data: ArgsData) => void;
  init: (data: { userId: string, hashSocket: string }) => void;
  onMessageEmit: (data: ArgsMessage) => void;
  allTalks: (data: unknown[]) => void;
  messages_one: (data: unknown) => void;
  getMessagesRoom: (room: string, hashSocket: string) => void;
  refreshAll: (id: string) => void;
}


// inicializações

config();
const app = express();
app.use(cors(corsOptions));

app.use(express.json());
// app.use(express.static(path.resolve(__dirname, "dev")));
app.use(routes);

const httpServer = createServer(app);

const io = new Server<TypeEventsEmit>(httpServer, {
  cors: {
    origin: process.env.ORIGIN_SOCKET,
    credentials: true,
  },
});

mongoose.connect(String(process.env.URL_MONGODB), (error) => {
  if (error) new Error("erro ao conectar!");
  console.log("conexão feita com sucesso!");
});

io.on("connection", async (socket) => {
  socket.on("init", async (data) => {
    if (data.hashSocket !== process.env.HASH_SOCKETS) return;

    const initialTalksUser = await dbRoom.find({ $or: [{ userOne: data.userId }, { userTwo: data.userId }] });

    socket.emit("allTalks", initialTalksUser);
  });

  socket.on("onCreateRoom", async (data) => {
    if (data.hashSocket !== process.env.HASH_SOCKETS) return;

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
      const dbTwo = await dbUsers.findOne({ ["_id"]: data.userTwo });

      if (!verifyExists.length) {
        await dbRoom.create({
          roomName: formatNameRoom,
          userOne: data.userOne,
          userOneName: data.userName,
          userTwoName: dbTwo.userName,
          srcOne: data.srcOne || "",
          userTwo: data.userTwo,
          srcTwo: dbTwo.src || "",
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
  socket.on("getMessagesRoom", async (room, hashSocket) => {
    if (hashSocket !== process.env.HASH_SOCKETS) return;

    const messagesRoom = await dbRoom.findOne({ roomName: room });
    socket.join(room);

    io.to(room).emit("messages_one", messagesRoom);
  });

  // recebe novas mensagens e retorna novamente
  socket.on("onMessageEmit", async (data) => {

    if (data.hashSocket !== process.env.HASH_SOCKETS) return;

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

httpServer.listen(process.env.PORT || 3002);
