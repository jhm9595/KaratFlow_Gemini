CREATE TABLE company_partnerships (
    partnership_id BIGSERIAL PRIMARY KEY,
    requester_company_id BIGINT REFERENCES companies(company_id),
    target_company_id BIGINT REFERENCES companies(company_id),
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'APPROVED', 'REJECTED'
    pin_code VARCHAR(6),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
