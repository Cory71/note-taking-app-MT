// Section: Note page controller
// Section: Routes that render EJS pages and process form submissions.
// Section: Browser page behavior (not JSON API responses).

import Note from '../models/Note.js';
import {
  getUserId,
  isInvalidIdError,
  isOwner,
  isValidNoteIdList,
  loadUserNotes,
  normalizeNoteInput,
  normalizeNoteSearchInput,
  validateNoteInput,
} from './noteShared.js';

const NOTE_NOT_FOUND_MESSAGE = 'Note not found.';
const NOTE_FORBIDDEN_MESSAGE = 'You do not have access to this note.';
const INVALID_NOTE_ORDER_MESSAGE = 'Invalid note order.';
const INVALID_NOTE_SELECTION_MESSAGE = 'Invalid note selection.';

const notesSuccessMessages = {
  created: 'Note created.',
  updated: 'Note updated.',
  deleted: 'Note deleted.',
  pinned: 'Note pinned.',
  unpinned: 'Note unpinned.',
};

const notesErrorMessages = {
  notfound: NOTE_NOT_FOUND_MESSAGE,
  forbidden: NOTE_FORBIDDEN_MESSAGE,
};

// Section: Notes page message helpers
function getNotesSuccessMessage(query) {
  return notesSuccessMessages[query?.success] || ''; // Map success query key to display text.
}

function getNotesErrorMessage(query) {
  return notesErrorMessages[query?.error] || ''; // Map error query key to display text.
}

// Section: Notes page view helpers
function buildNotesIndexViewModel({
  req,
  notes,
  error = '',
  success = '',
  values = { title: '', content: '' },
  search = { q: '', scope: 'all' },
}) {
  return {
    currentUser: req.user || null,
    notes,
    error,
    success,
    values,
    search,
  };
}

function buildEditViewModel({ req, note, error = '' }) {
  return {
    currentUser: req.user || null,
    note,
    error,
  };
}

function renderNotesIndex(res, statusCode, viewModel) {
  return res.status(statusCode).render('notes/index', viewModel); // Render notes list page.
}

function renderEditPage(res, statusCode, viewModel) {
  return res.status(statusCode).render('notes/edit', viewModel); // Render edit page with status for validation errors.
}

async function renderNotesIndexWithError(req, res, statusCode, errorMessage) {
  const userId = getUserId(req);
  const search = normalizeNoteSearchInput(req.query); // Preserve active search when rendering error states.
  const notes = await loadUserNotes(userId, search); // Keep note list visible when showing error.

  return renderNotesIndex(
    res,
    statusCode,
    buildNotesIndexViewModel({ req, notes, error: errorMessage, search })
  );
}

function assignNoteContent(note, normalizedNote) {
  note.title = normalizedNote.title; // Apply validated title.
  note.content = normalizedNote.content; // Apply validated content.
}

function renderNoteNotFound(req, res) {
  return renderNotesIndexWithError(req, res, 404, NOTE_NOT_FOUND_MESSAGE);
}

function renderForbiddenNote(req, res) {
  return renderNotesIndexWithError(req, res, 403, NOTE_FORBIDDEN_MESSAGE);
}

async function handleInvalidNoteIdError(error, req, res) {
  if (!isInvalidIdError(error)) {
    return false; // Let caller continue normal error handling.
  }

  await renderNoteNotFound(req, res); // Treat bad ObjectId like not-found for users.
  return true; // Signal that error response has already been sent.
}

function sendReorderError(res, statusCode, message) {
  return res.status(statusCode).json({ error: { message } });
}

async function saveReorderedNotes(noteIds, userId) {
  for (let index = 0; index < noteIds.length; index += 1) {
    await Note.updateOne(
      { _id: noteIds[index], userId },
      {
        $set: {
          order: index + 1, // Persist visual drag order as 1-based index.
        },
      }
    );
  }
}

async function findOwnedNoteOrRenderError(req, res) {
  const userId = getUserId(req);
  const note = await Note.findById(req.params.id); // Load note from route id.

  if (!note) {
    await renderNoteNotFound(req, res);
    return null;
  }

  if (!isOwner(note, userId)) {
    await renderForbiddenNote(req, res); // Stop users from editing others' notes.
    return null;
  }

  return note;
}

// Section: Notes page controllers
// Section: Show the main notes page with create form and note list.
export async function showNotesPage(req, res, next) {
  try {
    const userId = getUserId(req);
    const search = normalizeNoteSearchInput(req.query); // Read q/scope from URL query string.
    const notes = await loadUserNotes(userId, search); // Apply user-scoped search before rendering page.
    const error = getNotesErrorMessage(req.query);
    const success = getNotesSuccessMessage(req.query);

    return renderNotesIndex(
      res,
      200,
      buildNotesIndexViewModel({ req, notes, error, success, search })
    );
  } catch (error) {
    return next(error);
  }
}

// Section: Show the edit page for one existing note.
export async function showEditNotePage(req, res, next) {
  try {
    const note = await findOwnedNoteOrRenderError(req, res);

    if (!note) {
      return;
    }

    return res.render('notes/edit', buildEditViewModel({ req, note }));
  } catch (error) {
    if (await handleInvalidNoteIdError(error, req, res)) {
      return;
    }

    return next(error);
  }
}

// Section: Handle create-note form submit from the notes page.
export async function createNoteFromForm(req, res, next) {
  try {
    const userId = getUserId(req);
    const normalizedNote = normalizeNoteInput(req.body);
    const validationMessage = validateNoteInput(normalizedNote);

    if (validationMessage) {
      const notes = await loadUserNotes(userId);

      return renderNotesIndex(
        res,
        400,
        buildNotesIndexViewModel({
          req,
          notes,
          error: validationMessage,
          values: normalizedNote,
        })
      );
    }

    await Note.create({
      userId,
      title: normalizedNote.title,
      content: normalizedNote.content,
      order: Date.now(), // New notes start at the end by default.
    });

    return res.redirect('/notes?success=created');
  } catch (error) {
    return next(error);
  }
}

// Section: Handle update-note form submit from the edit page.
export async function updateNoteFromForm(req, res, next) {
  try {
    const note = await findOwnedNoteOrRenderError(req, res);

    if (!note) {
      return;
    }

    const normalizedNote = normalizeNoteInput(req.body);
    const validationMessage = validateNoteInput(normalizedNote);

    if (validationMessage) {
      assignNoteContent(note, normalizedNote);
      return renderEditPage(res, 400, buildEditViewModel({ req, note, error: validationMessage }));
    }

    assignNoteContent(note, normalizedNote);
    await note.save();

    return res.redirect('/notes?success=updated');
  } catch (error) {
    if (await handleInvalidNoteIdError(error, req, res)) {
      return;
    }

    return next(error);
  }
}

// Section: Handle delete-note form submit from the notes page.
export async function deleteNoteFromForm(req, res, next) {
  try {
    const note = await findOwnedNoteOrRenderError(req, res);

    if (!note) {
      return;
    }

    await Note.findByIdAndDelete(req.params.id);
    return res.redirect('/notes?success=deleted');
  } catch (error) {
    if (await handleInvalidNoteIdError(error, req, res)) {
      return;
    }

    return next(error);
  }
}

// Section: Toggle pin/unpin state for one note from the notes page.
export async function toggleNotePinFromForm(req, res, next) {
  try {
    const note = await findOwnedNoteOrRenderError(req, res);

    if (!note) {
      return;
    }

    note.isPinned = !note.isPinned;
    await note.save(); // Save new pinned/unpinned state.

    const successParam = note.isPinned ? 'pinned' : 'unpinned'; // Show matching flash message after redirect.
    return res.redirect(`/notes?success=${successParam}`);
  } catch (error) {
    if (await handleInvalidNoteIdError(error, req, res)) {
      return;
    }

    return next(error);
  }
}

// Section: Save drag-and-drop note order for notes in one category.
export async function reorderNotesFromForm(req, res, next) {
  try {
    const userId = getUserId(req);
    const noteIds = req.body?.noteIds; // Ordered pinned ids sent by drag-and-drop.

    if (!isValidNoteIdList(noteIds)) {
      return sendReorderError(res, 400, INVALID_NOTE_ORDER_MESSAGE);
    }

    const notes = await Note.find({ userId, _id: { $in: noteIds }, isPinned: true }); // Validate all ids belong to this user's pinned notes.

    if (notes.length !== noteIds.length) {
      return sendReorderError(res, 403, INVALID_NOTE_SELECTION_MESSAGE); // Block foreign or unpinned ids.
    }

    await saveReorderedNotes(noteIds, userId); // Persist the final pinned order.

    return res.json({ message: 'Notes reordered.' });
  } catch (error) {
    return next(error);
  }
}
