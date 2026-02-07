// Integration test for MongoDB models: User and Note
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';

import mongoose from 'mongoose';
import User from '../models/User.js';
import Note from '../models/Note.js';

// Use a test database URI (from env or default local)
const mongoUri =
  process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/note-taking-app-mt-test';

// Connect to the test database before running tests
before(async () => {
  await mongoose.connect(mongoUri);
});

// Clean up: drop the test database and disconnect after tests
after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// Test: create a User and a Note, then verify
test('Mongo: can create a User and Note', async () => {
  // Create a new user
  const user = await User.create({
    username: 'Cory_123',
    usernameLower: 'cory_123',
    email: 'test@example.com',
    emailLower: 'test@example.com',
    passwordHash: 'not-a-real-hash-yet',
  });

  // Create a note for the user
  const note = await Note.create({
    userId: user._id,
    title: 'First note',
    content: 'Hello world',
  });

  // Check that both user and note were created
  assert.ok(user._id);
  assert.ok(note._id);

  // Find the note by userId and check its title
  const found = await Note.findOne({ userId: user._id });
  assert.equal(found.title, 'First note');
});
