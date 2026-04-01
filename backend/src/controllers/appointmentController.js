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
    const doctorResult = assignedDoctorId
      ? await pool.query('SELECT name FROM users WHERE id = $1', [assignedDoctorId])
      : { rows: [] };

    return res.status(201).json({
      ...created,
      doctor: doctorResult.rows[0]?.name || created.doctor_name || 'To be assigned'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create appointment' });
  }
}

module.exports = {
  getAppointments,
  createAppointment
};
