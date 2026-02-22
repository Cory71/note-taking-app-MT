// Note page routes (EJS + form submits)
import express from 'express';

import { ensureAuthPage } from '../middleware/ensureAuth.js';
import {
  createNoteFromForm,
  deleteNoteFromForm,
  reorderNotesFromForm,
  showEditNotePage,
  showNotesPage,
  toggleNotePinFromForm,
  updateNoteFromForm,
} from '../controllers/noteController.js';

const router = express.Router();

// Protect all note page routes
router.use(ensureAuthPage); // Require login for every /notes page route.

// Render notes pages
router.get('/notes', showNotesPage); // Main notes list page.
router.get('/notes/:id/edit', showEditNotePage); // Edit page for one note.

// Handle note form submits
router.post('/notes', createNoteFromForm); // Create one note from form input.
router.post('/notes/reorder', reorderNotesFromForm); // Save drag-and-drop note order.
router.post('/notes/:id', updateNoteFromForm); // Save edits for one note.
router.post('/notes/:id/pin', toggleNotePinFromForm); // Toggle pin/unpin for one note.
router.post('/notes/:id/delete', deleteNoteFromForm); // Delete one note.

export default router;
