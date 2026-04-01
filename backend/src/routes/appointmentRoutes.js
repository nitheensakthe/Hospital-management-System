const express = require('express');
const { getAppointments, createAppointment } = require('../controllers/appointmentController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getAppointments);
router.post('/', requireAuth, createAppointment);

module.exports = router;
