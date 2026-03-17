# Safe Journey Planner (Travel & Tour Management System)

This project provides three separate portals:

- **Customer**: browse approved tours, book and pay, wishlist, notifications, and support requests
- **Agency**: submit tour packages for review and view bookings for approved tours
- **Admin**: verify agencies, approve/reject agency tour packages, manage tours, and respond to support tickets

## Folder structure
- `backend-php/` PHP REST API (XAMPP)
- `frontend-react/` React (Vite) UI

---

## 1) Setup backend (XAMPP)

### A. Put backend in htdocs
Copy the whole **safe-journey-planner** folder into:

`C:\xampp\htdocs\safe-journey-planner\`

So backend is at:
`C:\xampp\htdocs\safe-journey-planner\backend-php\`

### B. Start XAMPP
Open XAMPP Control Panel:
- Start **Apache**
- Start **MySQL**

### C. Create DB + tables
1. Go to phpMyAdmin: `http://localhost/phpmyadmin`
2. Open the file: `backend-php/src/sql/schema.sql`
3. Copy/paste into phpMyAdmin SQL tab and run.

### D. Check backend config
File: `backend-php/src/config/config.php`
- DB user/pass (default root / empty for XAMPP)
- JWT secret (you can change later)

### E. Test backend
Open in browser:
`http://localhost/safe-journey-planner/backend-php/public/api/health`

Expected:
`{"ok":true,...}`

---

## 2) Setup frontend (React)

### A. Install Node.js
Install Node LTS from nodejs.org (only once).

### B. Install dependencies + run
Open **VS Code terminal** in:
`C:\xampp\htdocs\safe-journey-planner\frontend-react`

Run:
```bash
npm install
npm run dev
```

Frontend URL:
`http://localhost:5173`

---

## 3) Admin verification settings
Open `backend-php/src/config/config.php` and set private values:
- `admin_setup_code` (used one time to create the first admin account)
- `admin_login_code` (required every time an admin logs in)

You can create the first admin account from: `.../admin-setup` (in the frontend).

---

## 4) API base URL
Frontend uses:
`http://localhost/safe-journey-planner/backend-php/public`

If your folder name is different, edit:
`frontend-react/.env` (optional) or `src/api/client.js`.

---

## Notes (important)
- Payment is **simulated** for FYP demo (no real gateway).
- Currency converter uses **demo offline rates**; replace with a live API later.
- Map uses OpenStreetMap tiles (no key).

## Accounts
- Customers and agencies can register from the UI.
- Agency accounts require admin verification before they can log in.
- Only one admin account is allowed (created via Admin Setup).
