// Note API routes (JSON)
import express from 'express';

import { ensureAuthApi } from '../middleware/ensureAuth.js';
import {
  createNote,
  deleteNote,
  getNoteById,
  listNotes,
  updateNote,
} from '../controllers/noteController.js';

const router = express.Router();

// --- Protect all note API routes ---
router.use(ensureAuthApi); // Require auth for all /api/notes endpoints.

// --- Notes CRUD endpoints ---
router.get('/', listNotes); // Get all notes for logged-in user.
router.get('/:id', getNoteById); // Get one note by id.
router.post('/', createNote); // Create a new note.
router.put('/:id', updateNote); // Full note update endpoint.
router.delete('/:id', deleteNote); // Delete one note.

export default router;
