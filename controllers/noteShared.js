// Section: Shared note helpers
// Section: Small helper functions used by both page controllers and API controllers.
// Section: Shared logic avoids repeating code in multiple files.

import Note from '../models/Note.js';

// Section: Note validation helpers
const NOTE_TITLE_MAX_LENGTH = 200;
const NOTE_CONTENT_MAX_LENGTH = 5000;
const NOTE_SEARCH_QUERY_MAX_LENGTH = 100;
const NOTE_SEARCH_SCOPES = ['all', 'title', 'content'];

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

// Section: Note search helpers
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex chars from user input.
}

export function normalizeNoteSearchInput(input) {
  const query = safeTrim(input?.q).slice(0, NOTE_SEARCH_QUERY_MAX_LENGTH); // Trim and cap query length to avoid oversized regex inputs.
  const scope = NOTE_SEARCH_SCOPES.includes(input?.scope) ? input.scope : 'all'; // Fallback to "all" when scope is missing or invalid.

  return { q: query, scope };
}

function buildSearchConditions(search) {
  if (!search.q) {
    return {}; // No query means no extra filter.
  }

  const queryRegex = new RegExp(escapeRegex(search.q), 'i'); // Case-insensitive partial match.

  if (search.scope === 'title') {
    return { title: queryRegex }; // Match only against note titles.
  }

  if (search.scope === 'content') {
    return { content: queryRegex }; // Match only against note content.
  }

  return {
    $or: [{ title: queryRegex }, { content: queryRegex }],
  };
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

export async function loadUserNotes(userId, search = { q: '', scope: 'all' }) {
  const searchConditions = buildSearchConditions(search); // Reuse same filter logic for page and API endpoints.
  const [pinnedNotes, unpinnedNotes] = await Promise.all([
    Note.find({ userId, isPinned: true, ...searchConditions }).sort({ order: 1, updatedAt: -1 }), // Keep manual order for pinned notes.
    Note.find({ userId, isPinned: false, ...searchConditions }).sort({ createdAt: -1 }), // Keep unpinned notes in creation-date order.
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
