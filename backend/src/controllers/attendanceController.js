const db = require('../config/db');

// Get attendance records (admin - all, with filters)
exports.getAttendance = async (req, res) => {
  try {
    const { date, employeeId, month, year, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params = [];
    let paramIndex = 1;

    if (date) {
      whereClauses.push(`a.date = $${paramIndex}`);
      params.push(date);
      paramIndex++;
    }

    if (employeeId) {
      whereClauses.push(`a.employee_id = $${paramIndex}`);
      params.push(employeeId);
      paramIndex++;
    }

    if (month && year) {
      whereClauses.push(`EXTRACT(MONTH FROM a.date) = $${paramIndex} AND EXTRACT(YEAR FROM a.date) = $${paramIndex + 1}`);
      params.push(month, year);
      paramIndex += 2;
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM attendance a ${whereSQL}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT a.*, e.first_name, e.last_name, e.employee_id as emp_code, d.name as department_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ${whereSQL}
       ORDER BY a.date DESC, e.first_name
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
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Mark attendance (admin)
exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, notes } = req.body;

    if (!employeeId || !date || !status) {
      return res.status(400).json({ success: false, message: 'Employee, date and status are required.' });
    }

    // Upsert
    const result = await db.query(
      `INSERT INTO attendance (employee_id, date, check_in, check_out, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (employee_id, date)
       DO UPDATE SET
         check_in = COALESCE($3, attendance.check_in),
         check_out = COALESCE($4, attendance.check_out),
         status = $5,
         notes = COALESCE($6, attendance.notes),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [employeeId, date, checkIn || null, checkOut || null, status, notes || null]
    );

    res.json({ success: true, message: 'Attendance marked successfully.', data: result.rows[0] });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Bulk mark attendance for a date
exports.bulkMarkAttendance = async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{employeeId, status, checkIn, checkOut}]

    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Date and records array required.' });
    }

    const results = [];
    for (const rec of records) {
      const result = await db.query(
        `INSERT INTO attendance (employee_id, date, check_in, check_out, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (employee_id, date)
         DO UPDATE SET
           check_in = COALESCE($3, attendance.check_in),
           check_out = COALESCE($4, attendance.check_out),
           status = $5,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [rec.employeeId, date, rec.checkIn || null, rec.checkOut || null, rec.status]
      );
      results.push(result.rows[0]);
    }

    res.json({ success: true, message: 'Bulk attendance marked.', data: results });
  } catch (error) {
    console.error('Bulk attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get my attendance (employee)
exports.getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee profile not found.' });
    }

    const { month, year } = req.query;
    let query = `SELECT * FROM attendance WHERE employee_id = $1`;
    const params = [employeeId];

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`;
      params.push(month, year);
    }

    query += ` ORDER BY date DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('My attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Attendance summary for dashboard
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    const result = await db.query(
      `SELECT 
         TO_CHAR(date, 'Mon') as month,
         EXTRACT(MONTH FROM date) as month_num,
         COUNT(*) FILTER (WHERE status IN ('present', 'late')) as present,
         COUNT(*) FILTER (WHERE status = 'late') as late,
         COUNT(*) FILTER (WHERE status = 'absent') as absent,
         COUNT(*) FILTER (WHERE status = 'on_leave') as on_leave
       FROM attendance
       WHERE date >= CURRENT_DATE - ($1 || ' months')::INTERVAL
       GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date)
       ORDER BY month_num`,
      [months]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Attendance summary error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Daily summary
exports.getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status IN ('present', 'late')) as present,
         COUNT(*) FILTER (WHERE status = 'absent') as absent,
         COUNT(*) FILTER (WHERE status = 'on_leave') as on_leave,
         COUNT(*) FILTER (WHERE status = 'late') as late,
         COUNT(*) as total
       FROM attendance
       WHERE date = $1`,
      [targetDate]
    );

    res.json({ success: true, data: { date: targetDate, ...result.rows[0] } });
  } catch (error) {
    console.error('Daily summary error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};