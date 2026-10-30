const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, employeeId: user.employee_id || null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const result = await db.query(
      `SELECT u.*, e.id as employee_id, e.first_name, e.last_name, e.profile_photo, e.status as emp_status
       FROM users u
       LEFT JOIN employees e ON u.id = e.user_id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    if (user.role === 'employee' && user.emp_status === 'inactive') {
      return res.status(401).json({ success: false, message: 'Employee account is inactive.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employee_id,
        firstName: user.first_name,
        lastName: user.last_name,
        profilePhoto: user.profile_photo,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.role, u.is_active,
              e.id as employee_id, e.employee_id as emp_code, e.first_name, e.last_name,
              e.phone, e.designation, e.joining_date, e.profile_photo, e.status,
              d.name as department_name, d.id as department_id
       FROM users u
       LEFT JOIN employees e ON u.id = e.user_id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        employeeId: user.employee_id,
        empCode: user.emp_code,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        designation: user.designation,
        joiningDate: user.joining_date,
        profilePhoto: user.profile_photo,
        status: user.status,
        department: user.department_name,
        departmentId: user.department_id,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const result = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      hashedPassword,
      req.user.id,
    ]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Register initial admin (only if no admin exists)
exports.registerAdmin = async (req, res) => {
  try {
    const check = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Admin already exists.' });
    }

    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (email, password, role) VALUES ($1, $2, 'admin') RETURNING id, email, role`,
      [email.toLowerCase(), hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Register admin error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};