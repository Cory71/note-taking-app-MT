// Note API controller (CRUD for notes)
import Note from '../models/Note.js';

// --- Input helpers ---
function safeTrim(value) {
  if (!value) {
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

// --- Response helpers ---
function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ error: { message } });
}

function getUserId(req) {
  return req.user?._id;
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

    const note = await Note.findOne({ _id: noteId, userId });

    if (!note) {
      return sendError(res, 404, 'Note not found.');
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
    const title = normalizeTitle(req.body.title);
    const content = normalizeContent(req.body.content);

    if (!title) {
      return sendError(res, 400, 'Title is required.');
    }

    const note = await Note.create({
      userId,
      title,
      content,
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
    const title = normalizeTitle(req.body.title);
    const content = normalizeContent(req.body.content);

    if (!title) {
      return sendError(res, 400, 'Title is required.');
    }

    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId },
      { title, content },
      { new: true }
    );

    if (!note) {
      return sendError(res, 404, 'Note not found.');
    }

    return res.json({ note });
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

    const note = await Note.findOneAndDelete({ _id: noteId, userId });

    if (!note) {
      return sendError(res, 404, 'Note not found.');
    }

    return res.json({ message: 'Note deleted.' });
  } catch (error) {
    if (isInvalidIdError(error)) {
      return sendError(res, 404, 'Note not found.');
    }

    return next(error);
  }
}
