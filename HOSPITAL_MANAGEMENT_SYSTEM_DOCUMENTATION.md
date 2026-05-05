 add the list
 # Hospital Management System Documentation

## Project Overview

This repository contains a cloud-ready hospital management system focused on two core operations:

1. Booking and managing patient appointments.
2. Storing and viewing medical records with role-based access.

The app is built as a full-stack web application with a React frontend, a Node.js/Express backend, and PostgreSQL for persistent storage. Authentication is handled with JSON Web Tokens, and passwords are hashed before being stored.

At a product level, the system is meant to reduce the manual overhead of hospital administration. It centralizes appointment scheduling, supports secure access to patient information, and gives different users different levels of access depending on whether they are a patient, doctor, or admin.

## Project Idea And Goal

The idea behind the project is to provide a practical digital workflow for a hospital or clinic where:

- Patients can register, log in, book appointments, and review their own appointments and records.
- Doctors can view their assigned appointments and create medical records for patients.
- Admins can view broader operational data and create medical records for any patient and doctor combination.

The problem the project is trying to solve is the common mismatch between patient needs and fragmented hospital administration. In a manual environment, appointment bookings can be duplicated, patient history is difficult to retrieve, and records are not always immediately available to the right staff member. This system organizes those processes into a single application.

## Tech Stack

### Frontend

- React 18
- React Router DOM for navigation
- Axios for API requests

### Backend

- Node.js
- Express.js
- PostgreSQL via the `pg` library
- bcryptjs for password hashing
- jsonwebtoken for authentication tokens
- cors for cross-origin requests
- morgan for request logging

### Database

- PostgreSQL tables for users, appointments, and medical records
- SQL schema and seed scripts in `backend/db`

### Deployment / Hosting

- `vercel.json` configures frontend and backend entry points for Vercel-style deployment

## Repository Layout

### Root

- `README.md` contains a short project summary and setup instructions
- `vercel.json` defines deployment routing
- `api/index.js` provides a serverless-style database test endpoint

### Backend

- `backend/src/app.js` wires together the API routes and middleware
- `backend/src/server.js` is a simpler standalone Express server entry point
- `backend/src/config/db.js` creates the PostgreSQL connection pool
- `backend/src/middleware/authMiddleware.js` checks JWTs and role access
- `backend/src/controllers` contains the business logic for auth, appointments, records, dashboard, and users
- `backend/src/routes` maps HTTP endpoints to controllers
- `backend/src/services/dashboardService.js` computes dashboard summary stats
- `backend/db/schema.sql` defines the database tables and indexes
- `backend/db/seed.sql` inserts sample users and starter data
- `backend/scripts/check-syntax.js` validates backend JavaScript syntax

### Frontend

- `frontend/src/App.js` defines the application routes and auth gating
- `frontend/src/services/api.js` configures Axios and attaches the JWT token
- `frontend/src/pages` contains the screens for login, registration, dashboard, appointments, and medical records

## Backend Architecture

The backend is organized around a standard controller/route/middleware structure.

### Main API App

`backend/src/app.js` is the central Express application for the modular API.

It does the following:

- Enables CORS, using `CORS_ORIGIN` if it is provided in the environment.
- Parses JSON request bodies.
- Logs requests with `morgan('dev')`.
- Exposes a health check at `GET /api/health`.
- Mounts the feature routes:
  - `/api/auth`
  - `/api/appointments`
  - `/api/medical-records`
  - `/api/dashboard`
  - `/api/users`
- Uses a final error handler that returns a 500 JSON response.

### Standalone Server Entry Point

`backend/src/server.js` is a smaller Express server that:

- Imports the database pool from `backend/db/db.js`.
- Exposes a root route that returns a simple running message.
- Exposes `GET /test-db` to verify the PostgreSQL connection by running `SELECT NOW()`.

This file is still important because the backend package scripts point to `src/server.js` as the main runtime entry point.

### Database Connection

There are two database connection files in the repository:

- `backend/src/config/db.js` exports a `pg.Pool` instance used by the modular controllers.
- `backend/db/db.js` creates a pool, loads environment variables with `dotenv`, tests the connection immediately, and exits if the database is unavailable.

Both follow the same connection strategy:

- Use `DATABASE_URL` from the environment.
- Enable SSL automatically when the connection string includes `neon.tech`.

## Authentication And Authorization

### JWT Auth Flow

Authentication is handled in `backend/src/controllers/authController.js` and enforced by `backend/src/middleware/authMiddleware.js`.

#### Register

`POST /api/auth/register` accepts:

- `name`
- `email`
- `password`
- `role` with default `patient`
- `phone`

The controller:

- Validates that name, email, password, and phone are present.
- Requires the password to be at least 6 characters.
- Checks whether the email already exists.
- Hashes the password with bcrypt.
- Inserts a new row in `users`.
- Signs a JWT containing the user id, role, name, and email.
- Returns the token and created user.

#### Login

`POST /api/auth/login` accepts:

- `email`
- `password`

The controller:

- Finds the user by email.
- Compares the supplied password with the stored password hash.
- Returns a signed JWT and the user record if the login is valid.

### Middleware

`requireAuth`:

- Reads the `Authorization` header.
- Expects the format `Bearer <token>`.
- Verifies the token with `JWT_SECRET`.
- Stores the decoded token data on `req.user`.

`requireRole(...roles)`:

- Checks `req.user.role`.
- Rejects the request with 403 if the user is not allowed.

## Database Schema

The schema in `backend/db/schema.sql` defines three core tables.

### Users

The `users` table stores hospital accounts.

Important fields:

- `id` as `BIGSERIAL` primary key
- `name`
- `email` with a unique constraint
- `password_hash`
- `role` restricted to `patient`, `doctor`, or `admin`
- `phone`
- `created_at`

### Appointments

The `appointments` table stores booking data.

Important fields:

- `patient_id` references `users(id)` and cascades on delete
- `doctor_id` references `users(id)` and becomes null if the doctor is deleted
- `doctor_name` stores a free-text fallback name
- `date`
- `reason`
- `status` restricted to `pending`, `completed`, or `cancelled`
- `created_at`

Indexes are added on `patient_id` for faster patient filtering.

### Medical Records

The `medical_records` table stores patient clinical history.

Important fields:

- `patient_id` references `users(id)` and cascades on delete
- `doctor_id` references `users(id)` and cascades on delete
- `diagnosis`
- `prescription`
- `notes`
- `date`
- `created_at`

An index is added on `patient_id` for lookup performance.

## Seed Data

`backend/db/seed.sql` creates starter data for demonstration and testing.

### Sample Users

The seed file inserts three users:

- Admin User: `admin@hospital.com`
- Dr. Smith: `doctor@hospital.com`
- John Patient: `patient@hospital.com`

All sample accounts use the default password `Password@123`.

### Sample Appointment

The seed script creates a pending appointment for the sample patient and doctor with a general checkup reason.

### Sample Medical Record

The seed script creates one record with:

- Diagnosis: seasonal flu
- Prescription: paracetamol twice daily
- Notes: rest and stay hydrated

This gives the UI something meaningful to render immediately after setup.

## Feature Breakdown

### Appointments

The appointments feature is implemented in `backend/src/controllers/appointmentController.js` and `frontend/src/pages/Appointments.js`.

#### Backend behavior

`GET /api/appointments` returns different data depending on role:

- Patients see only their own appointments.
- Doctors see only appointments assigned to them.
- Admins see all appointments.

The query joins `appointments` with `users` to get the patient name and doctor name.

`POST /api/appointments` lets an authenticated user create an appointment.

Important behavior:

- `date` and `reason` are required.
- A doctor can be assigned by `doctorId` if the chosen user really has the doctor role.
- If no doctor is selected, the appointment remains unassigned and uses `To be assigned` as the display fallback.
- New appointments are inserted with `pending` status.

#### Frontend behavior

The Appointments page:

- Loads appointments from the API on mount.
- Loads doctors with `GET /api/users?role=doctor` so patients can choose from available doctors.
- Allows only patients to open the appointment booking modal.
- Lets the patient choose a date, reason, optional doctor from the list, or a custom doctor name.
- Re-fetches appointments after a successful booking.

### Medical Records

The medical records feature is implemented in `backend/src/controllers/medicalRecordController.js` and `frontend/src/pages/MedicalRecords.js`.

#### Backend behavior

`GET /api/medical-records` is role-aware:

- Patients receive only their own records.
- Doctors receive only records they created.
- Admins receive all records.

`POST /api/medical-records` is restricted to `doctor` and `admin` via `requireRole('doctor', 'admin')`.

Important validation:

- `patientId`, `diagnosis`, and `prescription` are required.
- The selected patient must exist and must be a patient.
- Doctors must exist and have the doctor role.
- If the current user is a doctor, that doctor is automatically used as the creator.
- If the current user is an admin, they must choose a doctor explicitly.

#### Frontend behavior

The Medical Records page:

- Fetches records on mount.
- Fetches patient and doctor lists for doctors and admins.
- Lets doctors and admins add records through a modal form.
- Shows patient, doctor, diagnosis, prescription, notes, and date for each record.
- Displays inline validation errors from the API.

### Dashboard

The dashboard is implemented in `backend/src/controllers/dashboardController.js`, `backend/src/services/dashboardService.js`, and `frontend/src/pages/Dashboard.js`.

#### Backend behavior

`GET /api/dashboard`:

- Pulls the user-specific appointment list based on role.
- Builds summary statistics from those appointments.
- Returns the first five upcoming non-cancelled appointments.

`buildDashboardStats` computes:

- Total appointments
- Today’s appointments
- Pending appointments
- Completed appointments

#### Frontend behavior

The Dashboard page:

- Loads the logged-in user from local storage.
- Fetches dashboard data from the API.
- Renders the summary cards and upcoming appointments section.
- Provides quick navigation to appointments and medical records.
- Supports a manual refresh action.

### User Lookup

`backend/src/controllers/userController.js` and `backend/src/routes/userRoutes.js` implement user lookup.

Behavior:

- The route requires authentication.
- Patients can only query doctors.
- A `role` query parameter can be used to filter users by `patient`, `doctor`, or `admin`.
- The response returns basic public user details such as id, name, role, phone, and createdAt.

This route is used by the frontend to populate doctor and patient dropdowns.

## Frontend Architecture

The React app is a route-driven single-page application.

### Route Handling

`frontend/src/App.js` is the top-level router.

It uses local storage to track auth state and protects pages by redirecting unauthenticated users to `/login`.

Routes:

- `/login` for sign in
- `/register` for account creation
- `/dashboard` for overview and stats
- `/appointments` for appointment management
- `/records` for medical records
- `/` redirects to `/login`

### API Client

`frontend/src/services/api.js` creates an Axios instance.

It:

- Uses `REACT_APP_API_BASE_URL` if provided.
- Falls back to `/api` in production.
- Falls back to `http://localhost:5000/api` in development.
- Automatically attaches the stored JWT as a `Bearer` token on each request.

### Login Screen

`frontend/src/pages/Login.js`:

- Accepts email and password.
- Calls `POST /api/auth/login`.
- Stores the returned token and user in local storage.
- Redirects to the dashboard on success.

### Register Screen

`frontend/src/pages/Register.js`:

- Collects name, email, phone, role, and password.
- Calls `POST /api/auth/register`.
- Automatically logs the user in after successful registration.

## Deployment And Runtime Notes

### Vercel Configuration

`vercel.json` maps the repository into two service entry points:

- Frontend at the root route prefix `/`
- Backend under `/_/backend`

This means the project is prepared for a split deployment model where the React app and API can be routed independently.

### Serverless API File

`api/index.js` is a lightweight handler that connects to PostgreSQL and returns the current time from the database.

It appears to be a deployment test or minimal API endpoint rather than the main hospital API. It is still useful because it confirms the database can be reached in serverless environments.

### Backend Scripts

`backend/package.json` defines:

- `npm run dev` to start `nodemon src/server.js`
- `npm start` to run `node src/server.js`
- `npm run build` to run the syntax checker

The syntax checker walks through `backend/src` and runs Node’s `--check` mode on every `.js` file.

## Important Implementation Notes

- Role-based access is enforced both in the frontend UI and the backend API, but the backend is the real security boundary.
- The UI stores auth state in local storage, which keeps the session after refresh but also means logout must clear both token and user data.
- Appointments and records are joined with the `users` table so names can be displayed instead of raw IDs.
- The schema uses SQL constraints to prevent invalid roles and invalid appointment statuses.
- The project currently has a modular API app in `backend/src/app.js` and a smaller standalone server in `backend/src/server.js`, so there are two backend entry patterns present in the repo.

## Suggested Understanding Of The User Flow

1. A user opens the app and lands on the login page.
2. They register or log in.
3. The backend issues a JWT and the frontend stores it locally.
4. The dashboard loads role-aware data from the API.
5. Patients book appointments and view their own records.
6. Doctors manage their appointments and create medical records.
7. Admins can see broader operational information and create records for any patient/doctor pair.

## Summary

This project is a hospital operations system centered on authentication, appointment booking, and patient record management. The backend is built around PostgreSQL-backed Express controllers with JWT-based access control, while the frontend uses React Router and Axios to provide a clean, role-aware experience. The schema, seed data, and UI screens all align around the same domain model: users, appointments, and medical records.
