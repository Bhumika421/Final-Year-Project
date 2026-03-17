-- Safe Journey Planner (Nepal-only)
-- Import this file in phpMyAdmin
-- Database: safe_journey_planner

CREATE DATABASE IF NOT EXISTS safe_journey_planner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE safe_journey_planner;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','agency','customer') NOT NULL DEFAULT 'customer',

  -- agency verification
  verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  verification_reason VARCHAR(255) NULL,
  business_name VARCHAR(160) NULL,
  license_no VARCHAR(80) NULL,

  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TOURS (Nepal only)
CREATE TABLE IF NOT EXISTS tours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id INT NULL,

  title VARCHAR(160) NOT NULL,
  destination VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL,
  duration_days INT NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 4.50,
  image_url VARCHAR(500) NULL,
  description TEXT NULL,
  itinerary_json TEXT NULL,
  latitude DECIMAL(10,6) NULL,
  longitude DECIMAL(10,6) NULL,

  approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_public (is_active, approval_status),
  INDEX idx_destination (destination),
  INDEX idx_category (category),
  CONSTRAINT fk_tours_agency FOREIGN KEY (agency_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- SUPPORT
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  reply TEXT NULL,
  status ENUM('open','closed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_support_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- WISHLIST
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tour_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist (user_id, tour_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tour_id INT NOT NULL,
  travel_date DATE NULL,
  travelers INT NOT NULL DEFAULT 1,
  status ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- PAYMENTS (simple)
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  method ENUM('khalti','esewa','card') NOT NULL,
  amount_usd DECIMAL(10,2) NOT NULL,
  status ENUM('initiated','paid','failed') NOT NULL DEFAULT 'initiated',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Seed Admin (password: Admin@123)
-- NOTE: Change after first login.
INSERT IGNORE INTO users (id, full_name, email, password_hash, role, verification_status)
VALUES (1, 'Admin', 'admin@safejourney.com', '$2y$10$K9VvT6bKZz6yP9yVJ8lJYe4qZJzUj4Hk6Zx8J8E8cQwZB9M0wZ0tW', 'admin', 'verified');

-- Seed Agency (password: Agency@123)
INSERT IGNORE INTO users (id, full_name, email, password_hash, role, verification_status, business_name, license_no)
VALUES (2, 'Himalayan Trails', 'agency@safejourney.com', '$2y$10$K9VvT6bKZz6yP9yVJ8lJYe4qZJzUj4Hk6Zx8J8E8cQwZB9M0wZ0tW', 'agency', 'verified', 'Himalayan Trails', 'NEP-AG-001');

-- Seed 10 Nepal tours (all approved + active)
INSERT INTO tours (agency_id, title, destination, category, duration_days, price_usd, rating, image_url, description, itinerary_json, latitude, longitude, approval_status, is_active) VALUES
(2,'Kathmandu Heritage Walk','Kathmandu','Culture',3,199.00,4.70,'https://picsum.photos/seed/kathmandu/900/600','Durbar Squares, temples, and local markets with a guided heritage walk.',NULL,27.717200,85.324000,'approved',1),
(2,'Pokhara Lakeside Escape','Pokhara','Nature',4,349.00,4.80,'https://picsum.photos/seed/pokhara/900/600','Phewa Lake, Sarangkot sunrise, Peace Pagoda hike and lakeside relaxation.',NULL,28.209600,83.985600,'approved',1),
(2,'Chitwan Jungle Safari','Chitwan','Wildlife',3,299.00,4.60,'https://picsum.photos/seed/chitwan/900/600','Jeep safari, wildlife viewing, and Tharu cultural program.',NULL,27.529100,84.354200,'approved',1),
(2,'Everest View Experience','Everest Region','Adventure',6,799.00,4.85,'https://picsum.photos/seed/everest/900/600','Scenic viewpoints, Sherpa villages, and mountain panoramas.',NULL,27.988100,86.925000,'approved',1),
(2,'Lumbini Spiritual Tour','Lumbini','Culture',2,149.00,4.55,'https://picsum.photos/seed/lumbini/900/600','Visit Maya Devi Temple and explore peaceful monasteries.',NULL,27.484400,83.276000,'approved',1),
(2,'Nagarkot Sunrise Getaway','Nagarkot','Nature',2,119.00,4.50,'https://picsum.photos/seed/nagarkot/900/600','Short escape near Kathmandu with sunrise and Himalayan views.',NULL,27.715400,85.521900,'approved',1),
(2,'Bandipur Village Stay','Bandipur','Culture',2,129.00,4.58,'https://picsum.photos/seed/bandipur/900/600','Cobblestone streets, Newari culture, and scenic hilltop vibes.',NULL,27.935500,84.417500,'approved',1),
(2,'Illam Tea Garden Tour','Illam','Nature',4,259.00,4.62,'https://picsum.photos/seed/illam/900/600','Tea gardens, viewpoints and eastern Nepal landscapes.',NULL,26.911700,87.923400,'approved',1),
(2,'Janakpur Cultural Journey','Janakpur','Culture',3,199.00,4.52,'https://picsum.photos/seed/janakpur/900/600','Janaki Mandir and Mithila culture experience.',NULL,26.728800,85.925000,'approved',1),
(2,'Mustang Landscapes Trek','Mustang','Adventure',7,899.00,4.78,'https://picsum.photos/seed/mustang/900/600','High-altitude desert landscapes and local monasteries.',NULL,28.998000,83.847000,'approved',1);
