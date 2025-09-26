import mongoose from "mongoose";

const VerificationTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  token:  { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("VerificationToken", VerificationTokenSchema);


