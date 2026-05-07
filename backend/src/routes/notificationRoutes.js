const express = require('express');
const { getNotifications, markAllRead, markOneRead } = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/',           requireAuth, getNotifications);
router.patch('/read-all', requireAuth, markAllRead);
router.patch('/:id/read', requireAuth, markOneRead);

module.exports = router;
