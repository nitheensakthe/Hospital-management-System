const pool = require('../config/db');

async function getAppointments(req, res) {
  try {
    const result = req.user.role === 'patient'
      ? await pool.query(
          `SELECT a.id, a.patient_id AS "patientId", u.name AS "patientName", a.date, a.reason,
                  COALESCE(d.name, a.doctor_name, 'To be assigned') AS doctor,
                  a.status, a.created_at AS "createdAt"
           FROM appointments a
           JOIN users u ON u.id = a.patient_id
           LEFT JOIN users d ON d.id = a.doctor_id
           WHERE a.patient_id = $1
           ORDER BY a.date ASC`,
          [req.user.id]
        )
      : req.user.role === 'doctor'
      ? await pool.query(
          `SELECT a.id, a.patient_id AS "patientId", u.name AS "patientName", a.date, a.reason,
                  COALESCE(d.name, a.doctor_name, 'To be assigned') AS doctor,
                  a.status, a.created_at AS "createdAt"
           FROM appointments a
           JOIN users u ON u.id = a.patient_id
           LEFT JOIN users d ON d.id = a.doctor_id
           WHERE a.doctor_id = $1
           ORDER BY a.date ASC`,
          [req.user.id]
        )
      : await pool.query(
          `SELECT a.id, a.patient_id AS "patientId", u.name AS "patientName", a.date, a.reason,
                  COALESCE(d.name, a.doctor_name, 'To be assigned') AS doctor,
                  a.status, a.created_at AS "createdAt"
           FROM appointments a
           JOIN users u ON u.id = a.patient_id
           LEFT JOIN users d ON d.id = a.doctor_id
           ORDER BY a.date ASC`
        );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch appointments' });
  }
}

async function createAppointment(req, res) {
  const { date, reason, doctorId, doctor } = req.body;

  if (!date || !reason) {
    return res.status(400).json({ message: 'Date and reason are required' });
  }

  try {
    let assignedDoctorId = null;
    if (doctorId) {
      const doctorResult = await pool.query(
        'SELECT id, name FROM users WHERE id = $1 AND role = $2',
        [doctorId, 'doctor']
      );
      if (doctorResult.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid doctor selected' });
      }
      assignedDoctorId = doctorResult.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, date, reason, doctor_name, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, patient_id AS "patientId", date, reason, doctor_name, status, created_at AS "createdAt"`,
      [req.user.id, assignedDoctorId, date, reason, doctor || null]
    );

    const created = result.rows[0];
    const doctorRow = assignedDoctorId
      ? await pool.query('SELECT name FROM users WHERE id = $1', [assignedDoctorId])
      : { rows: [] };

    // Notify the assigned doctor
    if (assignedDoctorId) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, 'appointment')`,
        [assignedDoctorId, 'New Appointment Request',
         `A new appointment has been booked for ${new Date(date).toLocaleDateString()}: "${reason}"`]
      );
    }

    return res.status(201).json({
      ...created,
      doctor: doctorRow.rows[0]?.name || created.doctor_name || 'To be assigned'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create appointment' });
  }
}

async function updateAppointmentStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const allowed = ['confirmed', 'completed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
  }

  try {
    // Fetch appointment
    const apptResult = await pool.query(
      `SELECT a.*, u.name AS "patientName", u.id AS "patientUserId"
       FROM appointments a
       JOIN users u ON u.id = a.patient_id
       WHERE a.id = $1`,
      [id]
    );

    if (apptResult.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appt = apptResult.rows[0];

    // Doctors can only update their own appointments
    if (req.user.role === 'doctor' && appt.doctor_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own appointments' });
    }

    const updated = await pool.query(
      `UPDATE appointments SET status = $1 WHERE id = $2
       RETURNING id, patient_id AS "patientId", date, reason, status`,
      [status, id]
    );

    // Notify the patient
    const statusLabels = { confirmed: 'Confirmed ✅', completed: 'Completed 🏁', cancelled: 'Cancelled ❌' };
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, 'appointment')`,
      [appt.patientUserId,
       `Appointment ${statusLabels[status]}`,
       `Your appointment on ${new Date(appt.date).toLocaleDateString()} has been ${status}.`]
    );

    return res.json(updated.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update appointment status' });
  }
}

module.exports = { getAppointments, createAppointment, updateAppointmentStatus };
