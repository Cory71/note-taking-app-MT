// Section: Note API controller
// Section: JSON API endpoints for notes (used by /api/notes routes).
// Section: Return JSON responses instead of rendering EJS pages.

import Note from '../models/Note.js';
import {
  getUserId,
  isInvalidIdError,
  isOwner,
  loadUserNotes,
  normalizeNoteInput,
  normalizeNoteSearchInput,
  sendApiError,
  validateNoteInput,
} from './noteShared.js';

const NOTE_NOT_FOUND_MESSAGE = 'Note not found.';
const NOTE_FORBIDDEN_MESSAGE = 'You do not have access to this note.';

function sendNoteNotFound(res) {
  return sendApiError(res, 404, NOTE_NOT_FOUND_MESSAGE); // Send standard 404 message.
}

function sendForbiddenNote(res) {
  return sendApiError(res, 403, NOTE_FORBIDDEN_MESSAGE); // Send standard access denied message.
}

function handleInvalidNoteIdError(error, res) {
  if (!isInvalidIdError(error)) {
    return false; // Caller should continue normal error flow.
  }

  sendNoteNotFound(res); // Normalize invalid ObjectId to 404 response.
  return true; // Signal that response is already handled.
}

async function findOwnedNoteOrSendError(req, res) {
  const userId = getUserId(req);
  const note = await Note.findById(req.params.id); // Load note by route id.

  if (!note) {
    sendNoteNotFound(res);
    return null;
  }

  if (!isOwner(note, userId)) {
    sendForbiddenNote(res); // Block access to notes owned by someone else.
    return null;
  }

  return note;
}

function assignNoteContent(note, normalizedNote) {
  note.title = normalizedNote.title; // Update title with normalized value.
  note.content = normalizedNote.content; // Update content with normalized value.
}

// Section: Note API controllers
// Section: Return all notes for the logged-in user.
export async function listNotes(req, res, next) {
  try {
    const userId = getUserId(req);
    const search = normalizeNoteSearchInput(req.query); // Support API filtering with the same q/scope contract as the page.
    const notes = await loadUserNotes(userId, search); // Return pinned manual order, then unpinned newest first.
    return res.json({ notes });
  } catch (error) {
    return next(error);
  }
}

// Section: Return one note by id if it belongs to the logged-in user.
export async function getNoteById(req, res, next) {
  try {
    const note = await findOwnedNoteOrSendError(req, res);

    if (!note) {
      return;
    }

    return res.json({ note });
  } catch (error) {
    if (handleInvalidNoteIdError(error, res)) {
      return;
    }

    return next(error);
  }
}

// Section: Create a new note from JSON input.
export async function createNote(req, res, next) {
  try {
    const userId = getUserId(req);
    const normalizedNote = normalizeNoteInput(req.body);
    const validationMessage = validateNoteInput(normalizedNote); // Validate before DB write.

    if (validationMessage) {
      return sendApiError(res, 400, validationMessage);
    }

    const note = await Note.create({
      userId,
      title: normalizedNote.title,
      content: normalizedNote.content,
      order: Date.now(), // Put new note at end of list first.
    });

    return res.status(201).json({ note });
  } catch (error) {
    return next(error);
  }
}

// Section: Update one note from JSON input.
export async function updateNote(req, res, next) {
  try {
    const normalizedNote = normalizeNoteInput(req.body);
    const validationMessage = validateNoteInput(normalizedNote);

    if (validationMessage) {
      return sendApiError(res, 400, validationMessage);
    }

    const note = await findOwnedNoteOrSendError(req, res);

    if (!note) {
      return;
    }

    assignNoteContent(note, normalizedNote);
    await note.save(); // Persist note update after ownership check.

    return res.json({ note });
  } catch (error) {
    if (handleInvalidNoteIdError(error, res)) {
      return;
    }

    return next(error);
  }
}

// Section: Delete one note by id.
export async function deleteNote(req, res, next) {
  try {
    const note = await findOwnedNoteOrSendError(req, res);

    if (!note) {
      return;
    }

    await Note.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Note deleted.' });
  } catch (error) {
    if (handleInvalidNoteIdError(error, res)) {
      return;
    }

    return next(error);
  }
}
