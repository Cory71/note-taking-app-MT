// Section: Note controller barrel file
// Section: Keep route imports simple by re-exporting handlers from smaller controller files.
// Section: This file only exports functions. It does not run logic.
export {
  createNoteFromForm,
  deleteNoteFromForm,
  reorderNotesFromForm,
  showEditNotePage,
  showNotesPage,
  toggleNotePinFromForm,
  updateNoteFromForm, // Page/form handlers.
} from './notePageController.js';

export { createNote, deleteNote, getNoteById, listNotes, updateNote } from './noteApiController.js'; // JSON API handlers.
