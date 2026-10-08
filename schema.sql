-- Digital Warranty Tracker SQLite Schema
-- Supports Product Owners, Service Center Staff, Service Technicians, and Warranty Administrators

PRAGMA foreign_keys = ON;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('product_owner', 'service_center_staff', 'service_technician', 'warranty_admin')),
    phone TEXT,
    avatar_url TEXT,
    organization TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Coverage Rules (Configured by Warranty Administrators)
CREATE TABLE IF NOT EXISTS coverage_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer TEXT NOT NULL,
    category TEXT NOT NULL,
    standard_warranty_months INTEGER NOT NULL DEFAULT 12,
    extended_warranty_allowed INTEGER NOT NULL DEFAULT 1,
    accidental_damage_covered INTEGER NOT NULL DEFAULT 0,
    requires_original_invoice INTEGER NOT NULL DEFAULT 1,
    grace_period_days INTEGER NOT NULL DEFAULT 30,
    terms_summary TEXT,
    created_by INTEGER REFERENCES users(id),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products & Warranties (Managed by Product Owners, verified by system/admins)
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model_number TEXT,
    serial_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_price REAL,
    retailer TEXT,
    warranty_duration_months INTEGER NOT NULL DEFAULT 12,
    warranty_start_date DATE NOT NULL,
    warranty_end_date DATE NOT NULL,
    warranty_type TEXT NOT NULL DEFAULT 'standard' CHECK(warranty_type IN ('standard', 'extended', 'accidental_protection')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expiring_soon', 'expired', 'voided')),
    verification_status TEXT NOT NULL DEFAULT 'verified' CHECK(verification_status IN ('unverified', 'verified', 'rejected')),
    verification_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Invoices & OCR Data (Proof of purchase storage)
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_kb INTEGER,
    mime_type TEXT DEFAULT 'image/jpeg',
    ocr_raw_text TEXT,
    extracted_store TEXT,
    extracted_date DATE,
    extracted_price REAL,
    extracted_serial TEXT,
    manual_corrections_made INTEGER DEFAULT 0,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Warranty Claims (Follows Draft -> Submitted -> Under Review -> Service Scheduled -> Resolved / Rejected / Withdrawn)
CREATE TABLE IF NOT EXISTS warranty_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_number TEXT UNIQUE NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    issue_category TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    evidence_photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'under_review', 'service_scheduled', 'resolved', 'rejected', 'withdrawn')),
    admin_notes TEXT,
    claim_resolution TEXT,
    approved_amount REAL DEFAULT 0.0,
    decided_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Service Requests (Managed by Staff, assigned to Technicians, tracked by Owners)
CREATE TABLE IF NOT EXISTS service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_number TEXT UNIQUE NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    claim_id INTEGER REFERENCES warranty_claims(id) ON DELETE SET NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    assigned_technician_id INTEGER REFERENCES users(id),
    assigned_by_staff_id INTEGER REFERENCES users(id),
    issue_title TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'in_progress', 'awaiting_parts', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
    technician_notes TEXT,
    scheduled_slot TEXT,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Reminders (Expiry and service due notifications)
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    service_request_id INTEGER REFERENCES service_requests(id) ON DELETE SET NULL,
    reminder_type TEXT NOT NULL CHECK(reminder_type IN ('warranty_expiry_30d', 'warranty_expiry_7d', 'warranty_expired', 'service_due', 'claim_status')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    due_date DATE NOT NULL,
    channel TEXT NOT NULL DEFAULT 'all' CHECK(channel IN ('email', 'push', 'all')),
    is_read INTEGER DEFAULT 0,
    is_sent INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Activity Logs (Audit trail for actions across the system)
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_owner ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_serial ON products(serial_number);
CREATE INDEX IF NOT EXISTS idx_claims_owner ON warranty_claims(owner_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON warranty_claims(status);
CREATE INDEX IF NOT EXISTS idx_service_assigned ON service_requests(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_service_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id, is_read);

