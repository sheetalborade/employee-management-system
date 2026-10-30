# Employee Management System

Full-stack web app to manage employees, departments, attendance, and leave.

**Admin** manages the system.  
**Employee** views own data and applies for leave.

---

## Tech Stack

- Frontend: React (Vite), Axios, Recharts  
- Backend: Node.js, Express  
- Database: PostgreSQL  
- Auth: JWT, bcrypt  

---

## Features

### Admin
- Dashboard (stats and charts)
- Manage employees (add, edit, view, deactivate)
- Manage departments
- Mark and view attendance
- Approve or reject leave requests
- Reports with CSV export

### Employee
- Personal dashboard
- View and update profile
- Attendance history
- Apply and cancel leave
- View holidays
- Change password

---

## How to Run

### Requirements
- Node.js
- PostgreSQL

### Steps

1. Create a PostgreSQL database named `ems_db`
2. Set your database password in `backend/.env`
3. Backend:
   cd backend
   npm install
   npm run seed
   npm run dev
4.Frontend:
    cd frontend
    npm install
    npm run dev