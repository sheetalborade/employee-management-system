const db = require('../config/db');

// Get leave types
exports.getLeaveTypes = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM leave_types ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get leave types error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get all leave requests (admin)
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereSQL = '';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereSQL = `WHERE lr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM leave_requests lr ${whereSQL}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT lr.*, e.first_name, e.last_name, e.employee_id as emp_code,
              lt.name as leave_type_name, d.name as department_name
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       LEFT JOIN departments d ON e.department_id = d.id
       ${whereSQL}
       ORDER BY 
         CASE WHEN lr.status = 'pending' THEN 0 ELSE 1 END,
         lr.created_at DESC
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
    console.error('Get leave requests error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Approve / Reject leave
exports.reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const check = await db.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    if (check.rows[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be reviewed.' });
    }

    const result = await db.query(
      `UPDATE leave_requests SET
        status = $1,
        comments = $2,
        reviewed_by = $3,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, comments || null, req.user.id, id]
    );

    // If approved, mark attendance as on_leave for those dates
    if (status === 'approved') {
      const leave = result.rows[0];
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        await db.query(
          `INSERT INTO attendance (employee_id, date, status)
           VALUES ($1, $2, 'on_leave')
           ON CONFLICT (employee_id, date)
           DO UPDATE SET status = 'on_leave', updated_at = CURRENT_TIMESTAMP`,
          [leave.employee_id, dateStr]
        );
      }
    }

    res.json({ success: true, message: `Leave request ${status}.`, data: result.rows[0] });
  } catch (error) {
    console.error('Review leave error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Apply for leave (employee)
exports.applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee profile not found.' });
    }

    const { leaveTypeId, startDate, endDate, reason } = req.body;

    if (!leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Leave type, start date and end date are required.' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date.' });
    }

    const result = await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [employeeId, leaveTypeId, startDate, endDate, reason || null]
    );

    res.status(201).json({ success: true, message: 'Leave application submitted.', data: result.rows[0] });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get my leave requests
exports.getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee profile not found.' });
    }

    const result = await db.query(
      `SELECT lr.*, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.employee_id = $1
       ORDER BY lr.created_at DESC`,
      [employeeId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('My leaves error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Cancel pending leave
exports.cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.employeeId;

    const check = await db.query(
      'SELECT * FROM leave_requests WHERE id = $1 AND employee_id = $2',
      [id, employeeId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    if (check.rows[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled.' });
    }

    await db.query(
      `UPDATE leave_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Leave request cancelled.' });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Leave balance / trends
exports.getLeaveBalance = async (req, res) => {
  try {
    const employeeId = req.user.employeeId || req.query.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID required.' });
    }

    const year = new Date().getFullYear();
    const result = await db.query(
      `SELECT lt.id, lt.name, lt.max_days,
              COALESCE(SUM(
                CASE WHEN lr.status = 'approved' 
                THEN (lr.end_date - lr.start_date + 1) 
                ELSE 0 END
              ), 0) as used_days
       FROM leave_types lt
       LEFT JOIN leave_requests lr ON lt.id = lr.leave_type_id 
         AND lr.employee_id = $1 
         AND EXTRACT(YEAR FROM lr.start_date) = $2
       GROUP BY lt.id, lt.name, lt.max_days
       ORDER BY lt.name`,
      [employeeId, year]
    );

    const balance = result.rows.map((r) => ({
      ...r,
      remaining: Math.max(0, r.max_days - parseInt(r.used_days)),
    }));

    res.json({ success: true, data: balance });
  } catch (error) {
    console.error('Leave balance error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Leave trends for admin dashboard
exports.getLeaveTrends = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT lt.name,
              COUNT(*) as total_requests,
              COALESCE(SUM(lr.end_date - lr.start_date + 1), 0) as total_days
       FROM leave_types lt
       LEFT JOIN leave_requests lr ON lt.id = lr.leave_type_id AND lr.status = 'approved'
         AND lr.start_date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY lt.id, lt.name
       ORDER BY total_days DESC`
    );

    const totalDays = result.rows.reduce((sum, r) => sum + parseInt(r.total_days), 0) || 1;

    const trends = result.rows.map((r) => ({
      name: r.name,
      days: parseInt(r.total_days),
      percentage: Math.round((parseInt(r.total_days) / totalDays) * 100),
      requests: parseInt(r.total_requests),
    }));

    res.json({ success: true, data: trends });
  } catch (error) {
    console.error('Leave trends error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Holidays
exports.getHolidays = async (req, res) => {
  try {
    const { year } = req.query;
    let query = 'SELECT * FROM holidays';
    const params = [];

    if (year) {
      query += ' WHERE EXTRACT(YEAR FROM date) = $1';
      params.push(year);
    }

    query += ' ORDER BY date';
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Add holiday (admin)
exports.addHoliday = async (req, res) => {
  try {
    const { name, date, description } = req.body;
    if (!name || !date) {
      return res.status(400).json({ success: false, message: 'Name and date required.' });
    }

    const result = await db.query(
      `INSERT INTO holidays (name, date, description) VALUES ($1, $2, $3) RETURNING *`,
      [name, date, description || null]
    );

    res.status(201).json({ success: true, message: 'Holiday added.', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Holiday already exists for this date.' });
    }
    console.error('Add holiday error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};