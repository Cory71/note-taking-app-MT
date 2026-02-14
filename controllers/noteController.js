// Note API controller (CRUD for notes)
import Note from '../models/Note.js';

// --- Input helpers ---
const NOTE_TITLE_MAX_LENGTH = 200;
const NOTE_CONTENT_MAX_LENGTH = 5000;

function safeTrim(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeTitle(title) {
  return safeTrim(title);
}

function normalizeContent(content) {
  return safeTrim(content);
}

function normalizeNoteInput(input) {
  return {
    title: normalizeTitle(input?.title),
    content: normalizeContent(input?.content),
  };
}

function validateNoteInput(note) {
  if (!note.title) {
    return 'Title is required.';
  }

  if (note.title.length > NOTE_TITLE_MAX_LENGTH) {
    return `Title must be ${NOTE_TITLE_MAX_LENGTH} characters or less.`;
  }

  if (note.content.length > NOTE_CONTENT_MAX_LENGTH) {
    return `Content must be ${NOTE_CONTENT_MAX_LENGTH} characters or less.`;
  }

  return '';
}

// --- Response helpers ---
function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ error: { message } });
}

function getUserId(req) {
  return req.user?._id;
}

function isOwner(note, userId) {
  return note?.userId?.toString() === userId?.toString();
}

function isInvalidIdError(error) {
  return error?.name == 'CastError';
}

// --- Controllers ---
export async function listNotes(req, res, next) {
  try {
    const userId = getUserId(req);
    const notes = await Note.find({ userId }).sort({ updatedAt: -1 });
    return res.json({ notes });
  } catch (error) {
    return next(error);
  }
}

export async function getNoteById(req, res, next) {
  try {
    const userId = getUserId(req);
    const noteId = req.params.id;

    const note = await Note.findById(noteId);

    if (!note) {
      return sendError(res, 404, 'Note not found.');
    }

    if (!isOwner(note, userId)) {
      return sendError(res, 403, 'You do not have access to this note.');
    }

    return res.json({ note });
  } catch (error) {
    if (isInvalidIdError(error)) {
      return sendError(res, 404, 'Note not found.');
    }

    return next(error);
  }
}

export async function createNote(req, res, next) {
  try {
    const userId = getUserId(req);
    const normalizedNote = normalizeNoteInput(req.body);
    const validationMessage = validateNoteInput(normalizedNote);

    if (validationMessage) {
      return sendError(res, 400, validationMessage);
    }

    const note = await Note.create({
      userId,
      title: normalizedNote.title,
      content: normalizedNote.content,
    });

    return res.status(201).json({ note });
  } catch (error) {
    return next(error);
  }
}

export async function updateNote(req, res, next) {
  try {
    const userId = getUserId(req);
    const noteId = req.params.id;
    const normalizedNote = normalizeNoteInput(req.body);
    const validationMessage = validateNoteInput(normalizedNote);

    if (validationMessage) {
      return sendError(res, 400, validationMessage);
    }

    const existingNote = await Note.findById(noteId);

    if (!existingNote) {
      return sendError(res, 404, 'Note not found.');
    }

    if (!isOwner(existingNote, userId)) {
      return sendError(res, 403, 'You do not have access to this note.');
    }

    existingNote.title = normalizedNote.title;
    existingNote.content = normalizedNote.content;
    await existingNote.save();

    return res.json({ note: existingNote });
  } catch (error) {
    if (isInvalidIdError(error)) {
      return sendError(res, 404, 'Note not found.');
    }

    return next(error);
  }
}

export async function deleteNote(req, res, next) {
  try {
    const userId = getUserId(req);
    const noteId = req.params.id;

    const note = await Note.findById(noteId);

    if (!note) {
      return sendError(res, 404, 'Note not found.');
    }

    if (!isOwner(note, userId)) {
      return sendError(res, 403, 'You do not have access to this note.');
    }

    await Note.findByIdAndDelete(noteId);
    return res.json({ message: 'Note deleted.' });
  } catch (error) {
    if (isInvalidIdError(error)) {
      return sendError(res, 404, 'Note not found.');
    }

    return next(error);
  }
}
