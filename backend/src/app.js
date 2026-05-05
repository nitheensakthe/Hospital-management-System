const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const pool = require('./config/db');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : true;

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    const usersTable = await pool.query("SELECT to_regclass('public.users') AS name");
    const appointmentsTable = await pool.query(
      "SELECT to_regclass('public.appointments') AS name"
    );
    const recordsTable = await pool.query(
      "SELECT to_regclass('public.medical_records') AS name"
    );

    res.json({
      status: 'ok',
      db: 'ok',
      tables: {
        users: Boolean(usersTable.rows?.[0]?.name),
        appointments: Boolean(appointmentsTable.rows?.[0]?.name),
        medical_records: Boolean(recordsTable.rows?.[0]?.name)
      }
    });
  } catch (error) {
    console.error('Health check failed');
    console.error(error);
    const exposeErrors = String(process.env.EXPOSE_ERRORS || '').toLowerCase() === 'true';
    res.status(500).json({
      status: 'error',
      db: 'error',
      ...(exposeErrors ? { error: error.message } : {})
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const exposeErrors = String(process.env.EXPOSE_ERRORS || '').toLowerCase() === 'true';
  res.status(500).json({
    message: 'Internal server error',
    ...(exposeErrors ? { error: err.message, code: err.code } : {})
  });
});

module.exports = app;
