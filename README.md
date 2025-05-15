# Library Manager

A desktop application built with **Electron** for managing core library operations such as adding and removing books, borrowing/returning items, tracking fines, and managing librarian/student accounts.

## Features
- Add, edit, and delete books
- Borrow and return books
- Track overdue books and calculate fines
- Pay fines
- Librarian and student login systems
- Data stored locally in JSON files
- Role-based UI (librarians vs students)

## Tech Stack
- **Electron.js** (desktop framework)
- **HTML/CSS/JavaScript** for UI
- Local storage using JSON for persistence
- Modular architecture using `UserManager`, `Authenticator`, `DatabaseController`, and more

## Purpose
Built as a school project to simulate a real-world library system and demonstrate CRUD operations, role management, and desktop UI development with Electron.

## How to Run
```bash
git clone https://github.com/NovNet99/Library-Manager.git
cd Library-Manager
npm install
npm start
