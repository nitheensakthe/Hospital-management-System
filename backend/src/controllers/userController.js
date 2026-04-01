const pool = require('../config/db');

async function getUsers(req, res) {
  const { role } = req.query;

  if (req.user.role === 'patient' && role !== 'doctor') {
    return res.status(403).json({ message: 'Patients can only query doctors' });
  }

  if (role) {
    if (!['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role filter' });
    }

    const result = await pool.query(
      'SELECT id, name, role, phone, created_at AS "createdAt" FROM users WHERE role = $1 ORDER BY name ASC',
      [role]
    );

    return res.json(result.rows);
  }

  const result = await pool.query(
    'SELECT id, name, role, phone, created_at AS "createdAt" FROM users ORDER BY name ASC'
  );

  return res.json(result.rows);
}

module.exports = {
  getUsers
};
