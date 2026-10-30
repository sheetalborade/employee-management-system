const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Employee
router.get('/my', roleMiddleware('employee', 'admin'), attendanceController.getMyAttendance);

// Admin
router.get('/', roleMiddleware('admin'), attendanceController.getAttendance);
router.post('/mark', roleMiddleware('admin'), attendanceController.markAttendance);
router.post('/bulk', roleMiddleware('admin'), attendanceController.bulkMarkAttendance);
router.get('/summary', roleMiddleware('admin'), attendanceController.getAttendanceSummary);
router.get('/daily', roleMiddleware('admin'), attendanceController.getDailySummary);

module.exports = router;