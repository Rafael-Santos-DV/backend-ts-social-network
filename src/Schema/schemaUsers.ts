import mongoose from "mongoose";

const { Schema } = mongoose;

const SchemeUsers = new Schema({
  userName: String,
  src: String,
  email: String,
});

export default mongoose.model("Users", SchemeUsers);
