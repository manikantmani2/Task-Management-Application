# Task Management Application

Scalable MERN task management platform with JWT auth, role-based access control, real-time task updates, and a responsive React dashboard.

## Stack

- MongoDB with Mongoose schemas and indexes
- Express.js REST API
- React.js frontend with Vite
- Node.js runtime
- Socket.IO for live task and notification updates

## Structure

- `server/` - API, auth, business logic, and socket layer
- `client/` - React UI, task board, analytics, and live updates

## Setup

1. Install dependencies in the root and both apps.
2. Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`.
3. Start MongoDB locally or point `MONGODB_URI` to your database.
4. Run `npm run dev` from the repository root.
5. Seed sample data with `npm run seed --prefix server`.

## Tests

- Backend API tests: `npm test --prefix server`
- Frontend component tests: `npm test --prefix client`

## Running locally (no Docker)

The project supports running the frontend and API locally without Docker.

1. Start (or point to) a MongoDB instance and set `MONGODB_URI` to your database. By default the server will attempt to connect to `mongodb://127.0.0.1:27017/task_management`.
2. Copy `server/.env.example` to `server/.env` and update values as needed.
3. From the repository root, install dependencies and run the dev servers:

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`
API: `http://localhost:5000`

## Features

- JWT login and registration
- Admin, Manager, and User roles
- CRUD tasks with validation and filters
- Real-time notifications and task sync
- Drag-and-drop task board
- Dashboard analytics