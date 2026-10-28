import mongoose from 'mongoose';
import { roleOf } from '../access.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    googleId: { type: String, unique: true, sparse: true },
    picture: { type: String, default: '' },
    passwordHash: { type: String }, // legacy: accounts created before Google sign-in
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  return { id: this._id, name: this.name, email: this.email, picture: this.picture, role: roleOf(this.email) };
};

export default mongoose.model('User', userSchema);
