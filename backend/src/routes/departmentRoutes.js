const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);

// Admin only
router.post('/', roleMiddleware('admin'), departmentController.createDepartment);
router.put('/:id', roleMiddleware('admin'), departmentController.updateDepartment);
router.delete('/:id', roleMiddleware('admin'), departmentController.deleteDepartment);

module.exports = router;