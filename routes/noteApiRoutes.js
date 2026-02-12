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
router.use(ensureAuthApi);

// --- Notes CRUD endpoints ---
router.get('/', listNotes);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
