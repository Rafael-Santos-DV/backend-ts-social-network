import mongoose from "mongoose";
const { Schema } = mongoose;

const RoomSchema = new Schema({
  roomName: String,
  userOne: String,
  srcOne: String,
  userOneName: String,
  userTwoName: String,
  userTwo: String,
  srcTwo: String,
  talks: [],
});

export default mongoose.model("Rooms", RoomSchema);
