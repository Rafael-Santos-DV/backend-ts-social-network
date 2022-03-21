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
};

interface TypeArray {
  userid: string;
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
}

const app = express();
app.use(express.static(path.resolve(__dirname, "dev")));
const httpServer = createServer(app);
const io = new Server<TypeEventsEmit>(httpServer);

mongoose.connect("mongodb://localhost:27017/chatMe", (error) => {
  if (error) new Error("erro ao conectar!");
  console.log("conexão feita com sucesso!");
});

io.on("connection", async (socket) => {
  socket.on("init", async (data) => {
    const initialTalksUser = await dbRoom.find({ $or: [{ userOne: data.userId }, { userTwo: data.userId }] });
    socket.emit("allTalks", initialTalksUser);
  });

  socket.on("onCreateRoom", (data) => {
    // create hash for room dinamic
    crypto.randomBytes(10, async (err, hash) => {
      if (err) return;

      const formatNameRoom = String(hash.toString("hex")) + data.userOne + data.userTwo;

      await dbRoom.create({
        roomName: formatNameRoom,
        userOne: data.userOne,
        userTwo: data.userTwo,
      } as TypesSchema);

      const initialTalksUser = await dbRoom.find({ $or: [{ userOne: data.userId }, { userTwo: data.userId }] });
      socket.emit("allTalks", initialTalksUser);
    });
  });

  socket.on("onMessageEmit", async (data) => {
    const initialTalksUser = await dbRoom.findOne({ roomName: data.room });
    socket.join(String(data.room));

    const Talks: TypeArray[] = initialTalksUser.talks;
    Talks.push({
      userid: "6238e6cf82fb8c1a9f5d04fd",
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

    io.to(String(data.room)).emit("allTalks", initialTalksUser); // Send update message
  });
});

httpServer.listen(3000, () => console.log("tudo ok"));
