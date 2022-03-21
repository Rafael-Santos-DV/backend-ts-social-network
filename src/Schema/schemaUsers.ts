import mongoose from "mongoose";

const { Schema } = mongoose;

const SchemeUsers = new Schema({
  firstName: String,
  lastName: String,
  url: String,
});

export default mongoose.model("Users", SchemeUsers);
