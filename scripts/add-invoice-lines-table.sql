-- Add invoice_lines table and modify invoices table

USE construction_management;

-- Create invoice_lines table
CREATE TABLE IF NOT EXISTS invoice_lines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Remove the 'amount' column from the invoices table as it will now be calculated from invoice_lines
-- Check if the column exists before attempting to drop it
DELIMITER //
CREATE PROCEDURE DropColumnIfExist(
    IN tableName VARCHAR(255),
    IN columnName VARCHAR(255)
)
BEGIN
    IF EXISTS(
        SELECT *
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = tableName
        AND COLUMN_NAME = columnName
    ) THEN
        SET @drop_column_sql = CONCAT('ALTER TABLE ', tableName, ' DROP COLUMN ', columnName);
        PREPARE stmt FROM @drop_column_sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

CALL DropColumnIfExist('invoices', 'amount');
DROP PROCEDURE IF EXISTS DropColumnIfExist;

-- You might want to add an index to invoice_id for performance
CREATE INDEX IF NOT EXISTS idx_invoice_id ON invoice_lines (invoice_id);
