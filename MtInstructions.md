# Project: Note-Taking App

This project and its submission will be **30%** of your final mark for the Software Development Bootcamp.

## Overview

Build a Note-Taking App using your current tech stack for the **front end**, **back end**, and a polished communication between both sides to create a whole application.

This project aims to assess your understanding of:

- Server-side JavaScript
- API creation
- Integration with a front-end interface

## Requirements (Checklist)

### Project Setup

- [x] Initialize a new Node.js project.
- [x] Set up the project structure with folders for `routes`, `controllers`, `models`, and any other necessary components.

### Server + Routes

- [x] Implement an Express.js server to handle HTTP requests.
- [ ] Create routes for CRUD operations related to notes.

### Database + Models

- [x] Choose and set up a database (e.g., MongoDB) to store note data.
- [x] Connect your Node.js application to the chosen database.
- [x] Implement data models and use them to interact with the database.

### REST API + Error Handling

- [ ] Create RESTful API endpoints for managing notes:
  - `GET`
  - `POST`
  - `PUT`
  - `DELETE`
- [ ] Implement error handling for various scenarios (such as invalid requests or missing data).

### Front End (HTML/EJS + CSS)

- [ ] Design a simple and user-friendly front-end interface for the Note-Taking App using **HTML or EJS** and **CSS**.
- [ ] Integrate the front end with the back end to:
  - display existing notes
  - allow users to add, edit, and delete notes

### Authentication + Authorization

- [x] Implement user authentication so multiple users can have personalized note collections.
- [ ] Ensure each user can only access and modify **their own** notes.

### Validation

- [ ] Implement server-side validation for incoming data.
- [ ] Provide clear error messages to the front end for invalid requests or validation failures.

## Deliverable

- [ ] Create a `README` file with clear instructions on setting up the project locally.
- [ ] Document:
  - the API endpoints
  - expected request/response formats
  - any important details for developers who may use or contribute to your project
