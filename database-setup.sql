-- Create database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS ocr_comparison CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE ocr_comparison;

-- Create the comparisons table
CREATE TABLE IF NOT EXISTS comparisons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_case VARCHAR(255) NOT NULL,
    hpux_image_path VARCHAR(255) NOT NULL,
    linux_image_path VARCHAR(255) NOT NULL,
    hpux_extracted_data LONGTEXT,
    linux_extracted_data LONGTEXT,
    differences LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_test_case ON comparisons(test_case);
CREATE INDEX idx_created_at ON comparisons(created_at);

-- Create a user for the application (optional)
-- Replace 'password' with a secure password
-- CREATE USER 'ocr_app_user'@'localhost' IDENTIFIED BY 'password';
-- GRANT ALL PRIVILEGES ON ocr_comparison.* TO 'ocr_app_user'@'localhost';
-- FLUSH PRIVILEGES;