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

To develop a cloud-enabled full-stack web application using MERN stack that automates hospital appointment scheduling and securely manages patient medical records with real-time accessibility.

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Cloud**: MongoDB Atlas

## Features

- Online appointment booking
- Secure patient record management
- Role-based access (Patient, Doctor, Admin)
- Real-time data synchronization
- Responsive design

## Installation

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Project Structure

```
hospital-management-system/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── services/
    └── public/
```