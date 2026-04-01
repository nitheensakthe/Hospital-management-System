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