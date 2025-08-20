-- Construction Management Database Setup

CREATE DATABASE IF NOT EXISTS construction_management;
USE construction_management;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    type ENUM('salaire', 'metre') NOT NULL,
    salaire DECIMAL(10,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table for salary employees
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    present BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (employee_id, date)
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    adresse TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Material steps table
CREATE TABLE IF NOT EXISTS material_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Material descriptions table
CREATE TABLE IF NOT EXISTS material_descriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    step_id INT NOT NULL,
    description TEXT NOT NULL,
    quantity VARCHAR(50) NULL,
    price DECIMAL(10,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (step_id) REFERENCES material_steps(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password) VALUES 
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBVWEiA/6p2LW6')
ON DUPLICATE KEY UPDATE username = username;

-- Insert sample data
INSERT INTO employees (nom, prenom, telephone, type, salaire) VALUES 
('Alami', 'Ahmed', '0612345678', 'salaire', 4000.00),
('Bennani', 'Youssef', '0623456789', 'salaire', 3500.00),
('Chakiri', 'Mohamed', '0634567890', 'metre', NULL),
('Douiri', 'Hassan', '0645678901', 'metre', NULL)
ON DUPLICATE KEY UPDATE nom = nom;

INSERT INTO clients (nom, prenom, telephone, adresse) VALUES 
('Tazi', 'Fatima', '0656789012', '123 Rue Mohammed V, Casablanca'),
('Zaki', 'Omar', '0667890123', '456 Avenue Hassan II, Rabat')
ON DUPLICATE KEY UPDATE nom = nom;
