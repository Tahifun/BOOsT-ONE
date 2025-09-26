import mongoose, { Schema, Document } from "mongoose";

export type Role = "USER" | "SUPERUSER";
export type Tier = "FREE" | "PRO" | "ENTERPRISE";

export interface IUser extends Document {
  email: string;
  password: string;
  username?: string;
  isPro: boolean;
  isVerified: boolean;
  role: Role;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals/helpers
  tier: Tier;
  active: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    username: { type: String, trim: true },
    isPro: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["USER", "SUPERUSER"], default: "USER" },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: tier based on isPro (can be extended later)
UserSchema.virtual("tier").get(function (this: IUser) {
  return this.isPro ? "PRO" : "FREE";
});

// Virtual: active flag (currently same as isPro, can incorporate other logic)
UserSchema.virtual("active").get(function (this: IUser) {
  return this.isPro;
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);


