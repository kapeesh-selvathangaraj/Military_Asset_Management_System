-- PostgreSQL Schema for Military Asset Management System
-- Compatible with Supabase / Node.js backend

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (clean setup)
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS asset_balances CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS asset_types CASCADE;
DROP TABLE IF EXISTS bases CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'base_commander', 'logistics_officer', 'viewer')),
    base_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bases table
CREATE TABLE bases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE,                   -- Added base code column
    location VARCHAR(200) NOT NULL,
    commander_id UUID,
    contact_info JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset types table
CREATE TABLE asset_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    unit_of_measure VARCHAR(20) DEFAULT 'units',
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets table (individual items)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type_id UUID NOT NULL REFERENCES asset_types(id),
    serial_number VARCHAR(100) UNIQUE,
    base_id UUID NOT NULL REFERENCES bases(id),
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    current_status VARCHAR(50) DEFAULT 'available' 
        CHECK (current_status IN ('available', 'assigned', 'maintenance', 'disposed', 'transferred')),
    condition_status VARCHAR(50) DEFAULT 'good' 
        CHECK (condition_status IN ('new', 'good', 'fair', 'poor', 'unserviceable')),
    acquisition_date DATE,
    acquisition_cost DECIMAL(12,2),
    metadata JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset balances table (bulk quantities)
CREATE TABLE asset_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_id UUID NOT NULL REFERENCES bases(id),
    asset_type_id UUID NOT NULL REFERENCES asset_types(id),
    current_balance INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(base_id, asset_type_id)
);

-- Purchases table
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_id UUID NOT NULL REFERENCES bases(id),
    asset_type_id UUID NOT NULL REFERENCES asset_types(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(12,2) NOT NULL CHECK (unit_cost >= 0),
    total_cost DECIMAL(12,2) NOT NULL CHECK (total_cost >= 0),
    vendor VARCHAR(200) NOT NULL,
    purchase_date DATE NOT NULL,
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled')),
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfers table
CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_base_id UUID NOT NULL REFERENCES bases(id),
    to_base_id UUID NOT NULL REFERENCES bases(id),
    asset_type_id UUID NOT NULL REFERENCES asset_types(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    transfer_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
    reason VARCHAR(500),
    tracking_number VARCHAR(100),
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    completed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    assigned_to_user_id UUID NOT NULL REFERENCES users(id),
    assigned_by UUID NOT NULL REFERENCES users(id),
    assignment_date DATE NOT NULL,
    expected_return_date DATE,
    actual_return_date DATE,
    purpose VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active' 
        CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
    condition_at_assignment VARCHAR(50),
    condition_at_return VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_base FOREIGN KEY (base_id) REFERENCES bases(id);
ALTER TABLE bases ADD CONSTRAINT fk_bases_commander FOREIGN KEY (commander_id) REFERENCES users(id);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_base ON users(base_id);
CREATE INDEX idx_assets_type ON assets(asset_type_id);
CREATE INDEX idx_assets_base ON assets(base_id);
CREATE INDEX idx_assets_status ON assets(current_status);
CREATE INDEX idx_assets_condition ON assets(condition_status);
CREATE INDEX idx_asset_balances_base ON asset_balances(base_id);
CREATE INDEX idx_asset_balances_type ON asset_balances(asset_type_id);
CREATE INDEX idx_purchases_base ON purchases(base_id);
CREATE INDEX idx_purchases_type ON purchases(asset_type_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_transfers_from ON transfers(from_base_id);
CREATE INDEX idx_transfers_to ON transfers(to_base_id);
CREATE INDEX idx_transfers_type ON transfers(asset_type_id);
CREATE INDEX idx_transfers_date ON transfers(transfer_date);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_assignments_asset ON assignments(asset_id);
CREATE INDEX idx_assignments_user ON assignments(assigned_to_user_id);
CREATE INDEX idx_assignments_date ON assignments(assignment_date);
CREATE INDEX idx_assignments_status ON assignments(status);

-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bases_updated_at BEFORE UPDATE ON bases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_asset_types_updated_at BEFORE UPDATE ON asset_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
