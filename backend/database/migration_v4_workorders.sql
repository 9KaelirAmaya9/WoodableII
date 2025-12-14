-- Work Orders Migration
-- Creates tables for Axonic Motorworks work order management system

-- Work Orders Table
CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    work_order_number VARCHAR(20) UNIQUE NOT NULL, -- Format: YR-XXXX
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Client Information
    client_name VARCHAR(255) NOT NULL,
    client_address VARCHAR(255),
    client_city VARCHAR(100),
    client_state VARCHAR(2),
    client_zip VARCHAR(10),
    client_phone VARCHAR(20),
    client_dl_license VARCHAR(50),
    
    -- Vehicle Information
    vehicle_vin VARCHAR(17),
    vehicle_odometer INTEGER,
    vehicle_year INTEGER,
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_license_plate VARCHAR(20),
    
    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.0875, -- 8.875% default
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    client_sale_price DECIMAL(10, 2),
    profit DECIMAL(10, 2),
    
    -- Other
    other_comments TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    
    -- Metadata
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Order Items Table
CREATE TABLE IF NOT EXISTS work_order_items (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    taxed BOOLEAN DEFAULT true,
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_orders_number ON work_orders(work_order_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_client_name ON work_orders(client_name);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_date ON work_orders(date);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_by ON work_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_work_order_items_work_order_id ON work_order_items(work_order_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_work_orders_updated_at ON work_orders;
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate work order number
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    current_year VARCHAR(2);
    next_number INTEGER;
    new_number VARCHAR(20);
BEGIN
    -- Get last 2 digits of current year
    current_year := TO_CHAR(CURRENT_DATE, 'YY');
    
    -- Get the highest number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(work_order_number FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM work_orders
    WHERE work_order_number LIKE current_year || '-%';
    
    -- Format as YR-XXXX (e.g., 25-0001)
    new_number := current_year || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Sample query to verify table creation
-- SELECT * FROM work_orders;
-- SELECT * FROM work_order_items;
