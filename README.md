# Automated University Schedule Generator

This project is a full-stack web application designed to automate the creation, editing, and management of university class schedules. It integrates a Python-based scheduling algorithm with a Node.js + Express backend and a Vanilla JavaScript frontend. The system supports multiple user roles (admins, teachers, and guests) and ensures intelligent class distribution while resolving teacher and room conflicts.

## Features

* Automated class schedule generation using graph coloring and conflict detection.
* Teacher availability management (primary & backup slots).
* Admin panel for managing subjects, rooms, and types.
* Support for lectures, practicals, and lab sessions with frequency and room assignments.
* Schedule approval system for admins.
* Public guest view with filters by level and course code.
* Authentication system for admin registration and login.
* Message-sending feature from admin to individual or all teachers.
* Multi-language interface support (Armenian & Russian content).

## Technologies Used

* **Backend:** Node.js, Express, MS SQL Server (via `mssql`)
* **Frontend:** HTML, CSS, Vanilla JavaScript
* **Scheduling Algorithm:** Python with `networkx`, `pyodbc`
* **Authentication:** JSON Web Tokens (JWT), bcrypt
* **Database:** SQL Server (with tables like `Courses`, `Teachers`, `Rooms`, `Schedule`, `schedule_editable`, `created_schedule`, etc.)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/schedule-generator.git
cd schedule-generator
```

### 2. Install Node.js Dependencies

```bash
npm install
```

### 3. Set Up MS SQL Server

* Create a database named `schedule`.
* Run schema creation scripts to create all necessary tables.

### 5. Run the Server

```bash
node app.js
```

### 6. Generate Schedule

* Log in as admin.
* Confirm teacher availability.
* Click "Generate Schedule" to run `algorithm.py`.

## Folder Structure

```
root/
├── app.js                      # Express server entry
├── algorithm.py                # Scheduling algorithm
├── routes/                     # Backend API route handlers
├── frontend/
│   ├── html/                   # Admin & guest HTML pages
│   ├── js/                     # Frontend logic
│   ├── css/                    # Styles
├── public/                     # Static assets (optional)
```

## Available Endpoints

* `/api/subjects/add-subject` – Add new subjects (lecture/practical/lab)
* `/api/schedule/save-availability` – Save teacher availability
* `/api/generate-schedule` – Trigger schedule generation
* `/api/login`, `/api/register` – Admin authentication
* `/schedule_approval` – Get generated schedule for admin approval

## License

This project is developed as part of a university diploma thesis. Not intended for commercial distribution.
