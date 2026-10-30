const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Get all employees with search, filter, sort, pagination
exports.getAllEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      department = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;
    const allowedSort = ['first_name', 'last_name', 'email', 'joining_date', 'created_at', 'employee_id'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let whereClauses = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(`(e.first_name ILIKE $${paramIndex} OR e.last_name ILIKE $${paramIndex} OR e.email ILIKE $${paramIndex} OR e.employee_id ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (department) {
      whereClauses.push(`e.department_id = $${paramIndex}`);
      params.push(department);
      paramIndex++;
    }

    if (status) {
      whereClauses.push(`e.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM employees e ${whereSQL}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT e.*, d.name as department_name, u.is_active as user_active
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN users u ON e.user_id = u.id
       ${whereSQL}
       ORDER BY e.${sortColumn} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get single employee
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT e.*, d.name as department_name, u.email as user_email, u.is_active
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Add new employee (creates user + employee)
exports.createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      designation,
      joiningDate,
      dateOfBirth,
      gender,
      address,
      password = 'Employee@123',
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name and email are required.' });
    }

    // Check if email exists
    const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }

    // Generate employee ID
    const countResult = await db.query('SELECT COUNT(*) FROM employees');
    const empCode = `EMP${String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0')}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await db.query(
      `INSERT INTO users (email, password, role) VALUES ($1, $2, 'employee') RETURNING id`,
      [email.toLowerCase(), hashedPassword]
    );
    const userId = userResult.rows[0].id;

    // Create employee
    const empResult = await db.query(
      `INSERT INTO employees 
       (user_id, employee_id, first_name, last_name, email, phone, department_id, designation, joining_date, date_of_birth, gender, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        userId,
        empCode,
        firstName,
        lastName,
        email.toLowerCase(),
        phone || null,
        departmentId || null,
        designation || null,
        joiningDate || null,
        dateOfBirth || null,
        gender || null,
        address || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Employee created successfully. Default password: ' + password,
      data: empResult.rows[0],
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      designation,
      joiningDate,
      dateOfBirth,
      gender,
      address,
      status,
    } = req.body;

    const check = await db.query('SELECT * FROM employees WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Empty string breaks DATE columns in PostgreSQL — convert to null
    const clean = (v) => (v === '' || v === undefined ? null : v);

    const safeFirstName = clean(firstName);
    const safeLastName = clean(lastName);
    const safeEmail = email ? String(email).toLowerCase().trim() : null;
    const safePhone = clean(phone);
    const safeDepartmentId = clean(departmentId);
    const safeDesignation = clean(designation);
    const safeJoiningDate = clean(joiningDate);
    const safeDateOfBirth = clean(dateOfBirth);
    const safeGender = clean(gender);
    const safeAddress = clean(address);
    const safeStatus = clean(status);

    if (safeEmail) {
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [safeEmail, check.rows[0].user_id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already exists.' });
      }
    }

    const result = await db.query(
      `UPDATE employees SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        department_id = COALESCE($5, department_id),
        designation = COALESCE($6, designation),
        joining_date = COALESCE($7, joining_date),
        date_of_birth = COALESCE($8, date_of_birth),
        gender = COALESCE($9, gender),
        address = COALESCE($10, address),
        status = COALESCE($11, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        safeFirstName,
        safeLastName,
        safeEmail,
        safePhone,
        safeDepartmentId,
        safeDesignation,
        safeJoiningDate,
        safeDateOfBirth,
        safeGender,
        safeAddress,
        safeStatus,
        id,
      ]
    );

    if (safeEmail) {
      await db.query(
        'UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [safeEmail, check.rows[0].user_id]
      );
    }

    if (safeStatus === 'inactive') {
      await db.query('UPDATE users SET is_active = false WHERE id = $1', [check.rows[0].user_id]);
    } else if (safeStatus === 'active') {
      await db.query('UPDATE users SET is_active = true WHERE id = $1', [check.rows[0].user_id]);
    }

    res.json({ success: true, message: 'Employee updated successfully.', data: result.rows[0] });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error.' });
  }
};

// Delete / Deactivate employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT * FROM employees WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Soft delete - set inactive
    await db.query(`UPDATE employees SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
    await db.query('UPDATE users SET is_active = false WHERE id = $1', [check.rows[0].user_id]);

    res.json({ success: true, message: 'Employee deactivated successfully.' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get recently added employees
exports.getRecentEmployees = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.id, e.employee_id, e.first_name, e.last_name, e.email, e.joining_date, e.profile_photo, d.name as department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.status = 'active'
       ORDER BY e.created_at DESC
       LIMIT 5`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Recent employees error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalEmp = await db.query(`SELECT COUNT(*) FROM employees`);
    const activeEmp = await db.query(`SELECT COUNT(*) FROM employees WHERE status = 'active'`);
    const inactiveEmp = await db.query(`SELECT COUNT(*) FROM employees WHERE status = 'inactive'`);
    const totalDept = await db.query(`SELECT COUNT(*) FROM departments`);
    const pendingLeaves = await db.query(`SELECT COUNT(*) FROM leave_requests WHERE status = 'pending'`);
    
    // Today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayPresent = await db.query(
      `SELECT COUNT(*) FROM attendance WHERE date = $1 AND status IN ('present', 'late')`,
      [today]
    );

    // Growth trend (last 6 months)
    const growth = await db.query(
      `SELECT TO_CHAR(joining_date, 'YYYY-MM') as month, COUNT(*) as count
       FROM employees
       WHERE joining_date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY TO_CHAR(joining_date, 'YYYY-MM')
       ORDER BY month`
    );

    res.json({
      success: true,
      data: {
        totalEmployees: parseInt(totalEmp.rows[0].count),
        activeEmployees: parseInt(activeEmp.rows[0].count),
        inactiveEmployees: parseInt(inactiveEmp.rows[0].count),
        totalDepartments: parseInt(totalDept.rows[0].count),
        pendingLeaveRequests: parseInt(pendingLeaves.rows[0].count),
        todayPresent: parseInt(todayPresent.rows[0].count),
        growthTrend: growth.rows,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Update own profile (employee)
exports.updateOwnProfile = async (req, res) => {
  try {
    const { phone, address } = req.body;
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee profile not found.' });
    }

    const result = await db.query(
      `UPDATE employees SET
        phone = COALESCE($1, phone),
        address = COALESCE($2, address),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [phone, address, employeeId]
    );

    res.json({ success: true, message: 'Profile updated successfully.', data: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};