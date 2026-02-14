// Integration test for MongoDB models: User and Note (Mocha + Chai)
import { after, before, describe, it } from 'mocha';
import { expect } from 'chai';

import mongoose from 'mongoose';
import User from '../models/User.js';
import Note from '../models/Note.js';

// Use a test database URI (from env or default local)
const mongoUri =
  process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/note-taking-app-mt-test';

// Connect to the test database before running tests
before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
});

// Clean up: drop the test database and disconnect after tests
after(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe('Mongo models', () => {
  it('can create a User and Note', async () => {
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
    expect(user._id).to.exist;
    expect(note._id).to.exist;

    // Find the note by userId and check its title
    const found = await Note.findOne({ userId: user._id });
    expect(found).to.exist;
    expect(found.title).to.equal('First note');
  });
});
