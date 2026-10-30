const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Admin only
router.get('/', roleMiddleware('admin'), employeeController.getAllEmployees);
router.get('/stats', roleMiddleware('admin'), employeeController.getDashboardStats);
router.get('/recent', roleMiddleware('admin'), employeeController.getRecentEmployees);
router.post('/', roleMiddleware('admin'), employeeController.createEmployee);
router.get('/:id', roleMiddleware('admin'), employeeController.getEmployeeById);
router.put('/:id', roleMiddleware('admin'), employeeController.updateEmployee);
router.delete('/:id', roleMiddleware('admin'), employeeController.deleteEmployee);

// Employee can update own profile
router.put('/profile/me', roleMiddleware('employee', 'admin'), employeeController.updateOwnProfile);

module.exports = router;