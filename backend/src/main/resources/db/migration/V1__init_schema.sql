CREATE TABLE companies (
    company_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'VENDOR', 'MANUFACTURER', 'SUBCONTRACTOR'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(company_id),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    order_id BIGSERIAL PRIMARY KEY,
    vendor_company_id BIGINT REFERENCES companies(company_id),
    manufacturer_company_id BIGINT REFERENCES companies(company_id),
    order_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE designs (
    design_id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(company_id),
    design_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    base_labor_fee DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    order_item_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(order_id),
    design_id BIGINT REFERENCES designs(design_id),
    quantity INT NOT NULL,
    ring_size VARCHAR(10),
    color VARCHAR(20),
    engraving VARCHAR(100),
    stone_details VARCHAR(255),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE work_orders (
    work_order_id BIGSERIAL PRIMARY KEY,
    order_item_id BIGINT REFERENCES order_items(order_item_id),
    current_stage VARCHAR(30) NOT NULL, -- 'CAD', 'CASTING', 'POLISHING', 'PLATING', 'INSPECTION'
    is_hold BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subcontract_tasks (
    task_id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT REFERENCES work_orders(work_order_id),
    subcontractor_id BIGINT REFERENCES companies(company_id),
    stage VARCHAR(30) NOT NULL,
    dispatched_weight_g DECIMAL(10,3),
    received_weight_g DECIMAL(10,3),
    agreed_labor_fee DECIMAL(15,2),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE change_type_rules (
    rule_id BIGSERIAL PRIMARY KEY,
    change_type VARCHAR(50) NOT NULL, -- 'RING_SIZE', 'COLOR', 'ENGRAVING'
    cutoff_stage VARCHAR(30) NOT NULL,
    free_stage VARCHAR(30) NOT NULL,
    additional_fee DECIMAL(15,2) NOT NULL
);

CREATE TABLE order_change_requests (
    request_id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT REFERENCES work_orders(work_order_id),
    change_type VARCHAR(50) NOT NULL,
    requested_value VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'APPROVED', 'REJECTED'
    applied_fee DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_metal_prices (
    price_id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    price_per_don DECIMAL(15,2) NOT NULL, -- 3.75g 당 가격
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_cancellations (
    cancellation_id BIGSERIAL PRIMARY KEY,
    work_order_id BIGINT REFERENCES work_orders(work_order_id),
    stage_at_cancellation VARCHAR(30) NOT NULL,
    cancellation_fee DECIMAL(15,2) NOT NULL,
    scrap_gold_g DECIMAL(10,3) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
    invoice_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(order_id),
    total_pure_gold_g DECIMAL(10,3) NOT NULL,
    settlement_weight_g DECIMAL(10,3) NOT NULL,
    gold_amount DECIMAL(15,2) NOT NULL,
    labor_fee_total DECIMAL(15,2) NOT NULL,
    final_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data
INSERT INTO change_type_rules (change_type, cutoff_stage, free_stage, additional_fee) VALUES
('RING_SIZE', 'PLATING', 'CASTING', 5000),
('COLOR', 'PLATING', 'POLISHING', 10000),
('ENGRAVING', 'INSPECTION', 'POLISHING', 3000);
