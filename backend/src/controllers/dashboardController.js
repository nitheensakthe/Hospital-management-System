const pool = require('../config/db');
const { buildDashboardStats } = require('../services/dashboardService');

async function getDashboard(req, res) {
  try {
    const appointmentsResult = req.user.role === 'patient'
      ? await pool.query(
          `SELECT id, date, reason,
                  COALESCE(d.name, a.doctor_name, 'To be assigned') AS doctor,
                  status
           FROM appointments a
           LEFT JOIN users d ON d.id = a.doctor_id
           WHERE patient_id = $1
           ORDER BY date ASC`,
          [req.user.id]
        )
      : req.user.role === 'doctor'
      ? await pool.query(
          `SELECT id, date, reason,
                  COALESCE(d.name, a.doctor_name, 'To be assigned') AS doctor,
                  status
           FROM appointments a
           LEFT JOIN users d ON d.id = a.doctor_id
           WHERE doctor_id = $1
           ORDER BY date ASC`,
          [req.user.id]
        )
      : await pool.query(
          `SELECT id, date, reason,
                  COALESCE(d.name, a.doctor_name, 'To be assigned') AS doctor,
                  status
           FROM appointments a
           LEFT JOIN users d ON d.id = a.doctor_id
           ORDER BY date ASC`
        );

    const appointments = appointmentsResult.rows;
    const stats = buildDashboardStats(appointments);

    const upcomingAppointments = appointments
      .filter((apt) => new Date(apt.date) >= new Date() && apt.status !== 'cancelled')
      .slice(0, 5);

    return res.json({ stats, upcomingAppointments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to load dashboard' });
  }
}

module.exports = {
  getDashboard
};
