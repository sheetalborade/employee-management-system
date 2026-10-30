const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Common
router.get('/types', leaveController.getLeaveTypes);
router.get('/holidays', leaveController.getHolidays);
router.get('/balance', leaveController.getLeaveBalance);

// Employee
router.post('/apply', roleMiddleware('employee'), leaveController.applyLeave);
router.get('/my', roleMiddleware('employee', 'admin'), leaveController.getMyLeaves);
router.put('/:id/cancel', roleMiddleware('employee'), leaveController.cancelLeave);

// Admin
router.get('/', roleMiddleware('admin'), leaveController.getAllLeaveRequests);
router.put('/:id/review', roleMiddleware('admin'), leaveController.reviewLeaveRequest);
router.get('/trends', roleMiddleware('admin'), leaveController.getLeaveTrends);
router.post('/holidays', roleMiddleware('admin'), leaveController.addHoliday);

module.exports = router;