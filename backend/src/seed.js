/**
 * Seed script - Run after creating database and applying schema.sql
 * Usage: node src/seed.js
 */
const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function seed() {
  try {
    console.log('🌱 Starting seed...');

    // Create admin if not exists
    const adminCheck = await db.query("SELECT id FROM users WHERE email = 'admin@ems.com'");
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await db.query(
        `INSERT INTO users (email, password, role) VALUES ($1, $2, 'admin')`,
        ['admin@ems.com', hashedPassword]
      );
      console.log('✅ Admin created: admin@ems.com / Admin@123');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Departments
    const depts = [
      ['IT', 'Information Technology Department'],
      ['Sales', 'Sales and Business Development'],
      ['HR', 'Human Resources'],
      ['Finance', 'Finance and Accounting'],
      ['Development', 'Software Development'],
      ['Marketing', 'Marketing and Communications'],
      ['Operations', 'Operations Management'],
      ['Data', 'Data Analytics and Science'],
    ];
    for (const [name, desc] of depts) {
      await db.query(
        `INSERT INTO departments (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [name, desc]
      );
    }
    console.log('✅ Departments seeded');

    // Leave types
    const leaveTypes = [
      ['Casual Leave', 'Short-term personal leave', 12],
      ['Sick Leave', 'Medical related leave', 10],
      ['Annual Leave', 'Yearly paid leave', 15],
      ['Emergency Leave', 'Urgent personal emergencies', 5],
    ];
    for (const [name, desc, max] of leaveTypes) {
      await db.query(
        `INSERT INTO leave_types (name, description, max_days) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
        [name, desc, max]
      );
    }
    console.log('✅ Leave types seeded');

    // Holidays 2025-2026
    const holidays = [
      ['New Year', '2025-01-01', 'New Year Day'],
      ['Republic Day', '2025-01-26', 'Republic Day of India'],
      ['Holi', '2025-03-14', 'Festival of Colors'],
      ['Good Friday', '2025-04-18', 'Good Friday'],
      ['Independence Day', '2025-08-15', 'Independence Day of India'],
      ['Gandhi Jayanti', '2025-10-02', 'Mahatma Gandhi Birthday'],
      ['Diwali', '2025-10-20', 'Festival of Lights'],
      ['Christmas', '2025-12-25', 'Christmas Day'],
      ['New Year', '2026-01-01', 'New Year Day'],
    ];
    for (const [name, date, desc] of holidays) {
      await db.query(
        `INSERT INTO holidays (name, date, description) VALUES ($1, $2, $3) ON CONFLICT (date) DO NOTHING`,
        [name, date, desc]
      );
    }
    console.log('✅ Holidays seeded');

    // Sample employees
    const employees = [
      { first: 'Wade', last: 'Warren', email: 'wade.warren@ems.com', dept: 'IT', desig: 'Software Engineer', phone: '9876543210' },
      { first: 'Jerome', last: 'Bell', email: 'jerome.bell@ems.com', dept: 'Sales', desig: 'Sales Executive', phone: '9876543211' },
      { first: 'Theresa', last: 'Webb', email: 'theresa.webb@ems.com', dept: 'Development', desig: 'Frontend Developer', phone: '9876543212' },
      { first: 'Robert', last: 'Fox', email: 'robert.fox@ems.com', dept: 'Sales', desig: 'Sales Manager', phone: '9876543213' },
      { first: 'Jenny', last: 'Wilson', email: 'jenny.wilson@ems.com', dept: 'Data', desig: 'Data Analyst', phone: '9876543214' },
      { first: 'Priya', last: 'Sharma', email: 'priya.sharma@ems.com', dept: 'HR', desig: 'HR Manager', phone: '9876543215' },
      { first: 'Amit', last: 'Patel', email: 'amit.patel@ems.com', dept: 'Finance', desig: 'Accountant', phone: '9876543216' },
      { first: 'Sneha', last: 'Reddy', email: 'sneha.reddy@ems.com', dept: 'Marketing', desig: 'Marketing Executive', phone: '9876543217' },
    ];

    const empPassword = await bcrypt.hash('Employee@123', 10);
    let empCount = 0;

    for (const emp of employees) {
      const exists = await db.query('SELECT id FROM users WHERE email = $1', [emp.email]);
      if (exists.rows.length > 0) continue;

      const deptRes = await db.query('SELECT id FROM departments WHERE name = $1', [emp.dept]);
      const deptId = deptRes.rows[0]?.id || null;

      const userRes = await db.query(
        `INSERT INTO users (email, password, role) VALUES ($1, $2, 'employee') RETURNING id`,
        [emp.email, empPassword]
      );

      empCount++;
      const empCode = `EMP${String(empCount).padStart(4, '0')}`;
      const joining = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
        .toISOString()
        .split('T')[0];

      await db.query(
        `INSERT INTO employees (user_id, employee_id, first_name, last_name, email, phone, department_id, designation, joining_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')`,
        [userRes.rows[0].id, empCode, emp.first, emp.last, emp.email, emp.phone, deptId, emp.desig, joining]
      );
    }
    console.log('✅ Sample employees created (password: Employee@123)');

    // Sample attendance for current month
    const empList = await db.query(`SELECT id FROM employees WHERE status = 'active' LIMIT 8`);
    const today = new Date();
    for (let i = 0; i < 15; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
      const dateStr = d.toISOString().split('T')[0];

      for (const e of empList.rows) {
        const statuses = ['present', 'present', 'present', 'present', 'late', 'absent'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const checkIn = status === 'present' ? '09:00:00' : status === 'late' ? '10:15:00' : null;
        const checkOut = status !== 'absent' ? '18:00:00' : null;

        await db.query(
          `INSERT INTO attendance (employee_id, date, check_in, check_out, status)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (employee_id, date) DO NOTHING`,
          [e.id, dateStr, checkIn, checkOut, status]
        );
      }
    }
    console.log('✅ Sample attendance seeded');

    // Sample leave requests
    const leaveTypeRes = await db.query('SELECT id FROM leave_types');
    const leaveTypesIds = leaveTypeRes.rows.map((r) => r.id);
    if (empList.rows.length > 0 && leaveTypesIds.length > 0) {
      const samples = [
        { empIdx: 0, typeIdx: 0, start: '2025-04-10', end: '2025-04-12', reason: 'Personal Leave', status: 'pending' },
        { empIdx: 1, typeIdx: 1, start: '2025-04-05', end: '2025-04-06', reason: 'Sick Leave', status: 'pending' },
        { empIdx: 2, typeIdx: 3, start: '2025-03-20', end: '2025-03-21', reason: 'Family Emergency', status: 'approved' },
        { empIdx: 3, typeIdx: 1, start: '2025-03-15', end: '2025-03-16', reason: 'Sick Leave', status: 'approved' },
        { empIdx: 4, typeIdx: 1, start: '2025-03-10', end: '2025-03-11', reason: 'Sick Leave', status: 'approved' },
      ];

      for (const s of samples) {
        if (empList.rows[s.empIdx]) {
          await db.query(
            `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING`,
            [
              empList.rows[s.empIdx].id,
              leaveTypesIds[s.typeIdx],
              s.start,
              s.end,
              s.reason,
              s.status,
            ]
          );
        }
      }
      console.log('✅ Sample leave requests seeded');
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('-----------------------------------');
    console.log('Admin Login: admin@ems.com / Admin@123');
    console.log('Employee Login: wade.warren@ems.com / Employee@123');
    console.log('(or any other sample employee email)');
    console.log('-----------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();