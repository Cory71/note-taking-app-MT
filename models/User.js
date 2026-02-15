// User model and schema
import mongoose from 'mongoose';

// User schema fields 
const userSchema = new mongoose.Schema(
  {
    auth0Id: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    username: { type: String, required: true, trim: true },
    usernameLower: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    email: { type: String, required: true, trim: true },
    emailLower: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: { type: String },
  },
  {
    // Enable only createdAt timestamp (not updatedAt) to record when a user is created.
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const User = mongoose.model('User', userSchema);

export default User;
