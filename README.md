# Cloud-Based Hospital Appointment & Records Management System

## Problem Statement

In many hospitals and clinics, appointment scheduling and patient record management are still handled manually or using disconnected systems. This leads to several real-world problems such as:

- Long waiting times for patients
- Appointment conflicts and double bookings
- Difficulty in maintaining and retrieving patient medical records
- Lack of secure storage for sensitive medical data
- Limited accessibility to patient information for doctors across departments
- Poor scalability as the number of patients increases

## Objective

To develop a cloud-enabled full-stack web application that automates hospital appointment scheduling and securely manages patient medical records with real-time accessibility.

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT

## Features

- Online appointment booking
- Secure patient record management
- Role-based access (Patient, Doctor, Admin)
- Real-time data synchronization
- Responsive design

## Installation

### 1. Create PostgreSQL Database

```bash
createdb hospital_management
```

### 2. Backend Setup

```bash
cd backend
npm install
copy .env.example .env
```

Edit `.env` and confirm values:

```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/hospital_management
JWT_SECRET=replace_with_a_strong_secret
#+ Optional (comma-separated):
#CORS_ORIGIN=http://localhost:3000,https://your-app.vercel.app
# Optional for hosted Postgres that requires SSL:
#DATABASE_SSL=true
```

Run database schema and seed:

```bash
psql -d hospital_management -f db/schema.sql
psql -d hospital_management -f db/seed.sql
```

Start backend server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Deployment

This repo is set up to deploy:

- Frontend (React) on Vercel
- Backend (Express API) on Render

### Backend on Render

- Blueprint file: `render.yaml` (root)
- Render service root directory: `backend`
- Build command: `npm install; npm run build`
- Start command: `npm start`

Required environment variables in Render:

- `DATABASE_URL` (your hosted Postgres connection string)
- `JWT_SECRET` (a strong secret)
- `CORS_ORIGIN` (your Vercel URL, e.g. `https://your-app.vercel.app`)
- `DATABASE_SSL` (set `true` if your Postgres requires SSL)

Important: Render will not automatically create tables. After creating the database, run:

- `backend/db/schema.sql`
- `backend/db/seed.sql` (optional)

Health check endpoint: `GET /api/health`

### Frontend on Vercel

Deploy the React app as a separate Vercel project with:

- Root Directory: `frontend`
- Framework Preset: Create React App (auto-detected)
- Output Directory: `build` (default for CRA)

SPA routing is handled by `frontend/vercel.json`.

`frontend/vercel.json` also rewrites `/api/*` to the Render backend.

Optional (if you want the browser to call Render directly instead of using the Vercel rewrite):

- `REACT_APP_API_BASE_URL` = `https://<your-render-service>.onrender.com/api`

Then deploy as usual.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/dashboard` (auth required)
- `GET /api/appointments` (auth required)
- `POST /api/appointments` (auth required)
- `GET /api/medical-records` (auth required)

## Sample Credentials

After running `db/seed.sql`:

- Admin: `admin@hospital.com`
- Doctor: `doctor@hospital.com`
- Patient: `patient@hospital.com`
- Password (all): `Password@123`

## Project Structure

```
hospital-management-system/
├── backend/
│   ├── db/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    └── src/pages/
```