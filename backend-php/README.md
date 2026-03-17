# Backend (PHP + MySQL) - Safe Journey Planner

This is a lightweight REST API for the **Travel & Tour Management System (Safe Journey Planner)**.

## Tech
- PHP 8+ (XAMPP)
- MySQL (phpMyAdmin)
- Apache (mod_rewrite enabled)

## Main URL (when placed in htdocs)
Assuming you put the folder here:
`C:\xampp\htdocs\safe-journey-planner\backend-php`

Then API base is:
`http://localhost/safe-journey-planner/backend-php/public`

Example:
- GET `http://localhost/safe-journey-planner/backend-php/public/api/health`

## Files you must configure
- `src/config/config.php` (DB and JWT secret)

## Demo admin
- Email: `admin@demo.com`
- Password: `Admin@12345`

(You can change the admin credentials in the database.)