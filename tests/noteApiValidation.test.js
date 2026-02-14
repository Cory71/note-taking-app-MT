// Tests for note validation and ownership (Mocha + Chai)
import { after, before, beforeEach, describe, it } from 'mocha';
import { expect } from 'chai';

import mongoose from 'mongoose';
import Note from '../models/Note.js';
import {
  createNote,
  deleteNote,
  getNoteById,
  updateNote,
} from '../controllers/noteController.js';

// --- Test database setup ---
const mongoUri =
  process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/note-taking-app-mt-test';

before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
});

beforeEach(async () => {
  await Note.deleteMany({});
});

after(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

// --- Test helpers ---
function createUserId() {
  return new mongoose.Types.ObjectId();
}

function buildReq({ userId, body = {}, params = {} }) {
  return {
    user: { _id: userId },
    body,
    params,
  };
}

function createResponseRecorder() {
  const data = {
    statusCode: 200,
    jsonBody: null,
  };

  const res = {
    status(code) {
      data.statusCode = code;
      return this;
    },
    json(body) {
      data.jsonBody = body;
      return this;
    },
  };

  return { res, data };
}

function createNextThrower() {
  return (error) => {
    throw error;
  };
}

// --- Tests ---
describe('Note API validation and ownership', () => {
  it('returns 400 when createNote is missing a title', async () => {
    const userId = createUserId();
    const req = buildReq({ userId, body: { title: '', content: 'Test' } });
    const { res, data } = createResponseRecorder();

    await createNote(req, res, createNextThrower());

    expect(data.statusCode).to.equal(400);
    expect(data.jsonBody.error.message).to.equal('Title is required.');
  });

  it('returns 400 when createNote title is too long', async () => {
    const userId = createUserId();
    const longTitle = 'a'.repeat(201);
    const req = buildReq({ userId, body: { title: longTitle, content: 'Test' } });
    const { res, data } = createResponseRecorder();

    await createNote(req, res, createNextThrower());

    expect(data.statusCode).to.equal(400);
    expect(data.jsonBody.error.message).to.equal(
      'Title must be 200 characters or less.'
    );
  });

  it('returns 400 when createNote content is too long', async () => {
    const userId = createUserId();
    const longContent = 'b'.repeat(5001);
    const req = buildReq({ userId, body: { title: 'Valid', content: longContent } });
    const { res, data } = createResponseRecorder();

    await createNote(req, res, createNextThrower());

    expect(data.statusCode).to.equal(400);
    expect(data.jsonBody.error.message).to.equal(
      'Content must be 5000 characters or less.'
    );
  });

  it('trims title and content when createNote succeeds', async () => {
    const userId = createUserId();
    const req = buildReq({
      userId,
      body: { title: '  Trim Me  ', content: '  Also Trim  ' },
    });
    const { res, data } = createResponseRecorder();

    await createNote(req, res, createNextThrower());

    expect(data.statusCode).to.equal(201);

    const saved = await Note.findOne({ userId });
    expect(saved).to.exist;
    expect(saved.title).to.equal('Trim Me');
    expect(saved.content).to.equal('Also Trim');
  });

  it('returns 403 when getNoteById is called by a non-owner', async () => {
    const ownerId = createUserId();
    const otherUserId = createUserId();
    const note = await Note.create({
      userId: ownerId,
      title: 'Owner note',
      content: 'Secret',
    });

    const req = buildReq({ userId: otherUserId, params: { id: note._id } });
    const { res, data } = createResponseRecorder();

    await getNoteById(req, res, createNextThrower());

    expect(data.statusCode).to.equal(403);
    expect(data.jsonBody.error.message).to.equal(
      'You do not have access to this note.'
    );
  });

  it('returns 403 when updateNote is called by a non-owner', async () => {
    const ownerId = createUserId();
    const otherUserId = createUserId();
    const note = await Note.create({
      userId: ownerId,
      title: 'Owner note',
      content: 'Secret',
    });

    const req = buildReq({
      userId: otherUserId,
      params: { id: note._id },
      body: { title: 'New title', content: 'New content' },
    });
    const { res, data } = createResponseRecorder();

    await updateNote(req, res, createNextThrower());

    expect(data.statusCode).to.equal(403);
    expect(data.jsonBody.error.message).to.equal(
      'You do not have access to this note.'
    );
  });

  it('returns 403 when deleteNote is called by a non-owner', async () => {
    const ownerId = createUserId();
    const otherUserId = createUserId();
    const note = await Note.create({
      userId: ownerId,
      title: 'Owner note',
      content: 'Secret',
    });

    const req = buildReq({ userId: otherUserId, params: { id: note._id } });
    const { res, data } = createResponseRecorder();

    await deleteNote(req, res, createNextThrower());

    expect(data.statusCode).to.equal(403);
    expect(data.jsonBody.error.message).to.equal(
      'You do not have access to this note.'
    );
  });
});
