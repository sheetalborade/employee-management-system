const db = require('../config/db');

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT d.*, COUNT(e.id) as employee_count
       FROM departments d
       LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
       GROUP BY d.id
       ORDER BY d.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get single department with employees
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
    if (dept.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const employees = await db.query(
      `SELECT id, employee_id, first_name, last_name, email, designation, status
       FROM employees WHERE department_id = $1 ORDER BY first_name`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...dept.rows[0],
        employees: employees.rows,
      },
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Create department
exports.createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Department name is required.' });
    }

    const check = await db.query('SELECT id FROM departments WHERE name ILIKE $1', [name]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Department already exists.' });
    }

    const result = await db.query(
      `INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *`,
      [name, description || null]
    );

    res.status(201).json({ success: true, message: 'Department created successfully.', data: result.rows[0] });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const check = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    if (name) {
      const nameCheck = await db.query(
        'SELECT id FROM departments WHERE name ILIKE $1 AND id != $2',
        [name, id]
      );
      if (nameCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Department name already exists.' });
      }
    }

    const result = await db.query(
      `UPDATE departments SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [name, description, id]
    );

    res.json({ success: true, message: 'Department updated successfully.', data: result.rows[0] });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Delete department (prevent if employees assigned)
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const check = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const empCheck = await db.query(
      `SELECT COUNT(*) FROM employees WHERE department_id = $1 AND status = 'active'`,
      [id]
    );
    if (parseInt(empCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department. Employees are still assigned to it.',
      });
    }

    await db.query('DELETE FROM departments WHERE id = $1', [id]);
    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};