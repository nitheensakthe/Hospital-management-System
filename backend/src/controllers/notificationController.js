const pool = require('../config/db');

async function getNotifications(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, title, message, type, is_read AS "isRead", created_at AS "createdAt"
       FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 30`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
}

async function markAllRead(req, res) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
}

async function markOneRead(req, res) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to mark notification as read' });
  }
}

module.exports = { getNotifications, markAllRead, markOneRead };
