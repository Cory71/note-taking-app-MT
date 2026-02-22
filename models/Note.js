// Note model and schema
import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Which user owns this note.
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      default: '',
      trim: true,
      maxlength: 5000,
    },
    isPinned: {
      type: Boolean,
      default: false, // Pinned notes show at the top.
    },
    order: {
      type: Number,
      default: Date.now, // Use creation time as initial sort order.
      index: true, // Speed up list sorting by order.
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically.
  }
);

const Note = mongoose.model('Note', noteSchema);

export default Note;
