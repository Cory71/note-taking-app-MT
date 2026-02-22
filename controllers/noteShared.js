// Section: Shared note helpers
// Section: Small helper functions used by both page controllers and API controllers.
// Section: Shared logic avoids repeating code in multiple files.

import Note from '../models/Note.js';

// Section: Note validation helpers
const NOTE_TITLE_MAX_LENGTH = 200;
const NOTE_CONTENT_MAX_LENGTH = 5000;

function safeTrim(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim(); // Remove surrounding whitespace safely.
}

export function normalizeNoteInput(input) {
  return {
    title: safeTrim(input?.title), // Clear title text from form or API.
    content: safeTrim(input?.content), // Clear content text from form or API.
  };
}

export function validateNoteInput(note) {
  if (!note.title) {
    return 'Title is required.'; // Notes must have a title.
  }

  if (note.title.length > NOTE_TITLE_MAX_LENGTH) {
    return `Title must be ${NOTE_TITLE_MAX_LENGTH} characters or less.`;
  }

  if (note.content.length > NOTE_CONTENT_MAX_LENGTH) {
    return `Content must be ${NOTE_CONTENT_MAX_LENGTH} characters or less.`;
  }

  return '';
}

// Section: Note ownership and query helpers
export function getUserId(req) {
  return req.user?._id; // Read logged-in user's id from Passport.
}

export function isOwner(note, userId) {
  return note?.userId?.toString() === userId?.toString(); // Compare ownership using string ObjectIds.
}

export function isInvalidIdError(error) {
  return error?.name === 'CastError'; // This means the note id is not in the right format.
}

export async function loadUserNotes(userId) {
  const [pinnedNotes, unpinnedNotes] = await Promise.all([
    Note.find({ userId, isPinned: true }).sort({ order: 1, updatedAt: -1 }), // Keep manual order for pinned notes.
    Note.find({ userId, isPinned: false }).sort({ updatedAt: -1, createdAt: -1 }), // Keep timeline order for unpinned notes.
  ]);

  return [...pinnedNotes, ...unpinnedNotes]; // Pinned manual order first, then unpinned by newest.
}

export function isValidNoteIdList(value) {
  return Array.isArray(value) && value.every((id) => typeof id === 'string' && id.trim()); // Require non-empty id strings.
}

// Section: API response helper
export function sendApiError(res, statusCode, message) {
  return res.status(statusCode).json({ error: { message } });
}
