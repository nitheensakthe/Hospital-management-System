const pool = require('../config/db');

async function getMedicalRecords(req, res) {
  try {
    const result = req.user.role === 'patient'
      ? await pool.query(
          `SELECT mr.id, mr.patient_id AS "patientId", p.name AS "patientName", mr.doctor_id AS "doctorId",
                  d.name AS doctor, mr.diagnosis, mr.prescription, mr.notes, mr.date,
                  mr.created_at AS "createdAt"
           FROM medical_records mr
           JOIN users p ON p.id = mr.patient_id
           JOIN users d ON d.id = mr.doctor_id
           WHERE mr.patient_id = $1
           ORDER BY mr.date DESC`,
          [req.user.id]
        )
      : req.user.role === 'doctor'
      ? await pool.query(
          `SELECT mr.id, mr.patient_id AS "patientId", p.name AS "patientName", mr.doctor_id AS "doctorId",
                  d.name AS doctor, mr.diagnosis, mr.prescription, mr.notes, mr.date,
                  mr.created_at AS "createdAt"
           FROM medical_records mr
           JOIN users p ON p.id = mr.patient_id
           JOIN users d ON d.id = mr.doctor_id
           WHERE mr.doctor_id = $1
           ORDER BY mr.date DESC`,
          [req.user.id]
        )
      : await pool.query(
          `SELECT mr.id, mr.patient_id AS "patientId", p.name AS "patientName", mr.doctor_id AS "doctorId",
                  d.name AS doctor, mr.diagnosis, mr.prescription, mr.notes, mr.date,
                  mr.created_at AS "createdAt"
           FROM medical_records mr
           JOIN users p ON p.id = mr.patient_id
           JOIN users d ON d.id = mr.doctor_id
           ORDER BY mr.date DESC`
        );

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch medical records' });
  }
}

async function createMedicalRecord(req, res) {
  const { patientId, doctorId, diagnosis, prescription, notes, date } = req.body;

  if (!patientId || !diagnosis || !prescription) {
    return res.status(400).json({ message: 'Patient, diagnosis, and prescription are required' });
  }

  try {
    const patientResult = await pool.query(
      'SELECT id, name FROM users WHERE id = $1 AND role = $2',
      [patientId, 'patient']
    );

    if (patientResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid patient selected' });
    }

    const assignedDoctorId = req.user.role === 'doctor' ? req.user.id : doctorId;

    if (!assignedDoctorId) {
      return res.status(400).json({ message: 'Doctor is required' });
    }

    const doctorResult = await pool.query(
      'SELECT id, name FROM users WHERE id = $1 AND role = $2',
      [assignedDoctorId, 'doctor']
    );

    if (doctorResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid doctor selected' });
    }

    const result = await pool.query(
      `INSERT INTO medical_records (patient_id, doctor_id, diagnosis, prescription, notes, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, patient_id AS "patientId", doctor_id AS "doctorId", diagnosis, prescription, notes, date, created_at AS "createdAt"`,
      [patientId, assignedDoctorId, diagnosis, prescription, notes || null, date || new Date()]
    );

    return res.status(201).json({
      ...result.rows[0],
      patientName: patientResult.rows[0].name,
      doctor: doctorResult.rows[0].name
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create medical record' });
  }
}

module.exports = {
  getMedicalRecords,
  createMedicalRecord
};
