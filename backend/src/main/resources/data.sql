-- Insert Companies
INSERT INTO companies (name, role) VALUES ('KaratFlow Vendor', 'VENDOR');
INSERT INTO companies (name, role) VALUES ('Main Factory', 'MANUFACTURER');
INSERT INTO companies (name, role) VALUES ('Plating Subcontractor', 'SUBCONTRACTOR');

-- Insert Designs
INSERT INTO designs (design_code, name, base_labor_fee) VALUES ('R-101', 'Classic Ring', 50000);
INSERT INTO designs (design_code, name, base_labor_fee) VALUES ('N-202', 'Elegant Necklace', 75000);
INSERT INTO designs (design_code, name, base_labor_fee) VALUES ('E-303', 'Simple Earrings', 40000);

-- Insert Orders (B2B and B2C mixed)
INSERT INTO orders (vendor_company_id, manufacturer_company_id, order_date, status, order_type, customer_name) VALUES (1, 2, '2026-08-17', 'IN_PROGRESS', 'B2C', '고객1 (접수)');
INSERT INTO orders (vendor_company_id, manufacturer_company_id, order_date, status, order_type, customer_name) VALUES (1, 2, '2026-08-16', 'IN_PROGRESS', 'B2B', '업체2 (CAD)');
INSERT INTO orders (vendor_company_id, manufacturer_company_id, order_date, status, order_type, customer_name) VALUES (1, 2, '2026-08-15', 'IN_PROGRESS', 'B2C', '고객3 (주물)');
INSERT INTO orders (vendor_company_id, manufacturer_company_id, order_date, status, order_type, customer_name) VALUES (1, 2, '2026-08-14', 'IN_PROGRESS', 'B2B', '업체4 (세공)');
INSERT INTO orders (vendor_company_id, manufacturer_company_id, order_date, status, order_type, customer_name) VALUES (1, 2, '2026-08-13', 'COMPLETED', 'B2C', '고객5 (완성)');

-- Insert Order Items
INSERT INTO order_items (order_id, design_id, quantity, status, engraving_text, engraving_font, engraving_location, surface_finish) VALUES (1, 1, 1, 'IN_PROGRESS', 'For You', 'Serif', '안바닥', '유광');
INSERT INTO order_items (order_id, design_id, quantity, status, engraving_text, engraving_font, engraving_location, surface_finish) VALUES (2, 2, 5, 'IN_PROGRESS', NULL, NULL, NULL, '무광');
INSERT INTO order_items (order_id, design_id, quantity, status, engraving_text, engraving_font, engraving_location, surface_finish) VALUES (3, 3, 1, 'IN_PROGRESS', 'J&A', 'Script', '겉면', '헤어라인');
INSERT INTO order_items (order_id, design_id, quantity, status, engraving_text, engraving_font, engraving_location, surface_finish) VALUES (4, 1, 2, 'IN_PROGRESS', NULL, NULL, NULL, '유광');
INSERT INTO order_items (order_id, design_id, quantity, status, engraving_text, engraving_font, engraving_location, surface_finish) VALUES (5, 2, 1, 'COMPLETED', 'Love', 'Serif', '안바닥', '유광');

-- Insert Work Orders
INSERT INTO work_orders (order_item_id, current_stage, is_hold) VALUES (1, 'PENDING', FALSE);
INSERT INTO work_orders (order_item_id, current_stage, is_hold) VALUES (2, 'CAD', FALSE);
INSERT INTO work_orders (order_item_id, current_stage, is_hold) VALUES (3, 'CASTING', FALSE);
INSERT INTO work_orders (order_item_id, current_stage, is_hold) VALUES (4, 'POLISHING', FALSE);
INSERT INTO work_orders (order_item_id, current_stage, is_hold) VALUES (5, 'COMPLETED', FALSE);
