const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function getProfile(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, phone, created_at AS "createdAt" FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = result.rows[0];

    // Stats
    const apptCount = await pool.query(
      'SELECT COUNT(*) FROM appointments WHERE patient_id = $1 OR doctor_id = $1',
      [req.user.id]
    );
    const recordCount = await pool.query(
      'SELECT COUNT(*) FROM medical_records WHERE patient_id = $1 OR doctor_id = $1',
      [req.user.id]
    );

    return res.json({
      ...user,
      stats: {
        appointments: parseInt(apptCount.rows[0].count, 10),
        records: parseInt(recordCount.rows[0].count, 10)
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
}

async function updateProfile(req, res) {
  const { name, phone, currentPassword, newPassword } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and phone are required' });
  }

  try {
    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      const userRow = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      const valid = await bcrypt.compare(currentPassword, userRow.rows[0].password_hash);
      if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });

      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET name = $1, phone = $2, password_hash = $3 WHERE id = $4', [name, phone, hash, req.user.id]);
    } else {
      await pool.query('UPDATE users SET name = $1, phone = $2 WHERE id = $3', [name, phone, req.user.id]);
    }

    const updated = await pool.query(
      'SELECT id, name, email, role, phone, created_at AS "createdAt" FROM users WHERE id = $1',
      [req.user.id]
    );

    return res.json({ message: 'Profile updated successfully', user: updated.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
}

module.exports = { getProfile, updateProfile };
