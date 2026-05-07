const express = require('express');
const { getAppointments, createAppointment, updateAppointmentStatus } = require('../controllers/appointmentController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/',            requireAuth, getAppointments);
router.post('/',           requireAuth, createAppointment);
router.patch('/:id/status', requireAuth, updateAppointmentStatus);

module.exports = router;
