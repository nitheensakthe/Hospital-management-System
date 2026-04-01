const express = require('express');
const { getMedicalRecords, createMedicalRecord } = require('../controllers/medicalRecordController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getMedicalRecords);
router.post('/', requireAuth, requireRole('doctor', 'admin'), createMedicalRecord);

module.exports = router;
