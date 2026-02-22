// User model and schema
import mongoose from 'mongoose';

// User schema fields 
const userSchema = new mongoose.Schema(
  {
    auth0Id: {
      type: String,
      unique: true,
      sparse: true, // Allow many users without Auth0 IDs while keeping uniqueness when present.
      index: true,
    },
    username: { type: String, required: true, trim: true }, // Display name shown in the app.
    usernameLower: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    email: { type: String, required: true, trim: true }, // Original email as entered by user.
    emailLower: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: { type: String }, // Empty for Auth0-only accounts.
  },
  {
    // Enable only createdAt timestamp (not updatedAt) to record when a user is created.
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const User = mongoose.model('User', userSchema);

export default User;
