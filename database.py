import sqlite3
import os
import hashlib
from datetime import datetime, date, timedelta

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'warranty_tracker.db')
SCHEMA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'schema.sql')

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def init_db(force_reseed=False):
    db_exists = os.path.exists(DB_FILE)
    conn = get_db_connection()
    with open(SCHEMA_FILE, 'r') as f:
        conn.executescript(f.read())
    conn.commit()

    # Check if users already exist
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM users")
    count = cur.fetchone()[0]

    if count == 0 or force_reseed:
        seed_data(conn)
    conn.close()

def seed_data(conn):
    cur = conn.cursor()

    # Clear existing demo data if re-seeding
    cur.execute("DELETE FROM activity_logs")
    cur.execute("DELETE FROM reminders")
    cur.execute("DELETE FROM service_requests")
    cur.execute("DELETE FROM warranty_claims")
    cur.execute("DELETE FROM invoices")
    cur.execute("DELETE FROM products")
    cur.execute("DELETE FROM coverage_rules")
    cur.execute("DELETE FROM users")

    # 1. Insert Users (4 Core Roles)
    users = [
        (
            1, "Alex Vance", "alex@owner.com", hash_password("password123"),
            "product_owner", "+1 (555) 234-5678",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            "Individual Consumer"
        ),
        (
            2, "Sarah Connor", "sarah@servicecenter.com", hash_password("password123"),
            "service_center_staff", "+1 (555) 345-6789",
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
            "Metro Central Service Hub"
        ),
        (
            3, "David Miller", "david@technician.com", hash_password("password123"),
            "service_technician", "+1 (555) 456-7890",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
            "Apex Hardware Repairs"
        ),
        (
            4, "Elena Rostova", "elena@admin.com", hash_password("password123"),
            "warranty_admin", "+1 (555) 567-8901",
            "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
            "Global Warranty Underwriters Ltd"
        )
    ]
    cur.executemany("""
        INSERT INTO users (id, name, email, password_hash, role, phone, avatar_url, organization)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, users)

    # 2. Insert Coverage Rules
    coverage_rules = [
        ("Apple", "Laptops & Computers", 12, 1, 1, 1, 60, "Standard 1-year limited warranty covering hardware failures; AppleCare+ extends to 3 years with accidental protection.", 4),
        ("Samsung", "Smartphones & Tablets", 24, 1, 0, 1, 30, "24-month manufacturer guarantee on motherboard and battery, screen defects covered under manufacturing defect clause.", 4),
        ("Sony", "Cameras & Audio", 12, 1, 0, 1, 30, "12 months sensor and lens optical mechanism warranty. Excludes water ingress unless model is IPX8 certified.", 4),
        ("Dell", "Workstations & Displays", 36, 1, 0, 1, 45, "3-year ProSupport next-business-day onsite service for hardware faults.", 4),
        ("Dyson", "Home Appliances", 24, 0, 0, 1, 30, "2 years parts and labor guarantee on motor and electronics upon invoice verification.", 4),
        ("LG", "Television & Display", 24, 1, 0, 1, 30, "2-year panel replacement warranty for non-burn-in defects, original retail receipt mandatory.", 4)
    ]
    cur.executemany("""
        INSERT INTO coverage_rules (manufacturer, category, standard_warranty_months, extended_warranty_allowed, accidental_damage_covered, requires_original_invoice, grace_period_days, terms_summary, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, coverage_rules)

    # Current reference dates
    today = date(2026, 7, 25)

    # 3. Insert Products & Warranties
    products = [
        (
            1, 1, "Apple MacBook Pro 16\" M3 Max", "Apple", "MBP16-M3M-1TB", "C02G4589MD6R",
            "Laptops & Computers", "2025-11-15", 3499.00, "Apple Fifth Avenue",
            36, "2025-11-15", "2028-11-15", "extended", "active", "verified",
            "AppleCare+ Plan Confirmed. Active coverage valid until Nov 2028."
        ),
        (
            2, 1, "Samsung Galaxy S25 Ultra 512GB", "Samsung", "SM-S928B/DS", "R5CW209KL99",
            "Smartphones & Tablets", "2025-08-10", 1379.99, "Samsung Experience Store",
            24, "2025-08-10", "2027-08-10", "standard", "active", "verified",
            "Verified against Samsung Knox IMEI register."
        ),
        (
            3, 1, "Sony Alpha A7 IV Mirrorless Camera", "Sony", "ILCE-7M4/BQ", "33918204",
            "Cameras & Audio", "2024-08-01", 2498.00, "B&H Photo Video",
            24, "2024-08-01", "2026-08-01", "standard", "expiring_soon", "verified",
            "Warranty expiring in 7 days! Reminder scheduled."
        ),
        (
            4, 1, "Dell UltraSharp 32 4K USB-C Monitor", "Dell", "U3223QE", "CN-0F74W1-74445",
            "Workstations & Displays", "2023-05-10", 879.50, "Dell Official Store",
            36, "2023-05-10", "2026-05-10", "standard", "expired", "verified",
            "Warranty expired 2 months ago. Extended coverage option eligible."
        ),
        (
            5, 1, "Dyson V15 Detect Absolute Vacuum", "Dyson", "368340-01", "649-US-J49821A",
            "Home Appliances", "2025-01-20", 749.99, "Dyson Demo Store",
            24, "2025-01-20", "2027-01-20", "standard", "active", "verified",
            "Motor and digital filter covered under Dyson Direct guarantee."
        ),
        (
            6, 1, "LG OLED 65\" C4 4K Smart TV", "LG", "OLED65C4PUA", "404RMKCY8912",
            "Television & Display", "2025-04-12", 1899.00, "Best Buy",
            24, "2025-04-12", "2027-04-12", "standard", "active", "verified",
            "Retail invoice and serial matched with LG North America register."
        )
    ]
    cur.executemany("""
        INSERT INTO products (id, owner_id, product_name, brand, model_number, serial_number, category, purchase_date, purchase_price, retailer, warranty_duration_months, warranty_start_date, warranty_end_date, warranty_type, status, verification_status, verification_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, products)

    # 4. Invoices & OCR Data
    invoices = [
        (
            1, 1, "Apple_Receipt_INV-88291.pdf", "/static/uploads/invoices/apple_mbp_receipt.pdf",
            420, "application/pdf",
            "APPLE STORE 5TH AVE\nRECEIPT #INV-88291\nDATE: 2025-11-15\nITEM: MACBOOK PRO 16 M3 MAX\nS/N: C02G4589MD6R\nTOTAL: $3,499.00\nWARRANTY: APPLECARE+ 3 YR",
            "Apple Fifth Avenue", "2025-11-15", 3499.00, "C02G4589MD6R", 0
        ),
        (
            2, 2, "SamsungStore_Tax_Invoice_9941.jpg", "/static/uploads/invoices/samsung_invoice.jpg",
            1280, "image/jpeg",
            "SAMSUNG EXPERIENCE STORE\nINVOICE 9941-K\nDATE: 2025-08-10\nDEVICE: SM-S928B/DS GALAXY S25 ULTRA\nIMEI/SN: R5CW209KL99\nAMOUNT: $1,379.99\nWARRANTY: 24 MONTHS",
            "Samsung Experience Store", "2025-08-10", 1379.99, "R5CW209KL99", 0
        ),
        (
            3, 3, "BH_Photo_Invoice_20240801.pdf", "/static/uploads/invoices/bh_sony_receipt.pdf",
            310, "application/pdf",
            "B&H PHOTO VIDEO NYC\nORDER 9928194\nDATE: 08/01/2024\nSONY A7 IV BODY\nSERIAL: 33918204\nTOTAL: $2,498.00\nMFG WARRANTY: 2 YEARS",
            "B&H Photo Video", "2024-08-01", 2498.00, "33918204", 1
        ),
        (
            4, 5, "Dyson_Order_Confirmation.pdf", "/static/uploads/invoices/dyson_receipt.pdf",
            195, "application/pdf",
            "DYSON DIRECT\nORDER #DY-98102\nPURCHASE DATE: 2025-01-20\nDYSON V15 DETECT\nS/N: 649-US-J49821A\nPRICE: $749.99",
            "Dyson Demo Store", "2025-01-20", 749.99, "649-US-J49821A", 0
        )
    ]
    cur.executemany("""
        INSERT INTO invoices (id, product_id, filename, file_path, file_size_kb, mime_type, ocr_raw_text, extracted_store, extracted_date, extracted_price, extracted_serial, manual_corrections_made)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, invoices)

    # 5. Warranty Claims
    claims = [
        (
            1, "CLM-2026-0081", 3, 1, "Sensor & Shutter Mechanism",
            "Shutter curtain getting intermittently jammed when shooting in continuous burst mode above 1/2000s shutter speed.",
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
            "under_review", "Claim verified under Sony 2-year optical warranty. Service inspection dispatched to central lab.",
            "Pending repair authorization from administrator", 0.0, 4
        ),
        (
            2, "CLM-2026-0045", 1, 1, "Display Artifacts & Flickering",
            "Mini-LED backlight flickering on the right side of the screen when brightness exceeds 70%.",
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
            "service_scheduled", "Approved for direct top-case & display panel replacement under AppleCare+ coverage.",
            "Replacement panel allocated to Metro Central Service Hub", 890.0, 4
        ),
        (
            3, "CLM-2026-0012", 5, 1, "Battery / Motor Cut-off",
            "Suction motor pulsing and shutting down after 3 minutes in boost mode.",
            "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80",
            "resolved", "Battery pack and cyclone filter assembly replaced free of charge.",
            "Resolved and returned to owner via courier", 145.0, 4
        )
    ]
    cur.executemany("""
        INSERT INTO warranty_claims (id, claim_number, product_id, owner_id, issue_category, issue_description, evidence_photo_url, status, admin_notes, claim_resolution, approved_amount, decided_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, claims)

    # 6. Service Requests
    service_requests = [
        (
            1, "SR-2026-104", 1, 2, 1, 3, 2,
            "MacBook Pro Display Panel Replacement",
            "Replace Liquid Retina XDR display panel and calibrate True Tone sensor.",
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
            "in_progress", "high",
            "Display panel unpacked. Calibration tool connected. ETA 2 hours.",
            "Today 09:30 - 11:30"
        ),
        (
            2, "SR-2026-105", 3, 1, 1, 3, 2,
            "Sony A7 IV Shutter Assembly Diagnosis",
            "Inspect physical shutter curtain and test electronic sensor readout.",
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
            "assigned", "medium",
            "Device received at service bay. Technician David assigned.",
            "Today 14:00 - 15:30"
        ),
        (
            3, "SR-2026-092", 5, 3, 1, 3, 2,
            "Dyson V15 Motor & Battery Replacement",
            "Replace main battery module and conduct airflow CFM test.",
            "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80",
            "completed", "medium",
            "Replaced battery assembly. Run time tested at 62 mins in Eco mode.",
            "Yesterday 11:00 - 12:00"
        ),
        (
            4, "SR-2026-108", 2, None, 1, None, 2,
            "Samsung S25 Ultra Type-C Port Inspection",
            "Loose connection when charging; check port pins and lint obstruction.",
            "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80",
            "pending", "low",
            "New incoming request. Waiting for technician bay allocation.",
            "Tomorrow 10:00 - 11:00"
        )
    ]
    cur.executemany("""
        INSERT INTO service_requests (id, request_number, product_id, claim_id, owner_id, assigned_technician_id, assigned_by_staff_id, issue_title, issue_description, photo_url, status, priority, technician_notes, scheduled_slot)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, service_requests)

    # 7. Reminders
    reminders = [
        (
            1, 1, 3, None, "warranty_expiry_7d",
            "Warranty Expiring in 7 Days",
            "Your Sony Alpha A7 IV warranty expires on 2026-08-01. File any pending claims or purchase an extended warranty now.",
            "2026-07-25", "all", 0, 1
        ),
        (
            2, 1, 4, None, "warranty_expired",
            "Warranty Expired: Dell UltraSharp 32",
            "The standard 3-year warranty for your Dell monitor ended on 2026-05-10. You can still schedule certified repairs at partner rates.",
            "2026-05-10", "email", 1, 1
        ),
        (
            3, 1, 1, 1, "service_due",
            "Service Scheduled for MacBook Pro 16\"",
            "Your service appointment #SR-2026-104 is scheduled for Today at 09:30 AM with Senior Tech David Miller.",
            "2026-07-25", "push", 0, 1
        ),
        (
            4, 1, 2, None, "warranty_expiry_30d",
            "Warranty Health Check: Samsung Galaxy S25",
            "Your Galaxy S25 warranty is active and valid until August 2027. All coverage terms are verified.",
            "2026-07-20", "push", 1, 1
        )
    ]
    cur.executemany("""
        INSERT INTO reminders (id, user_id, product_id, service_request_id, reminder_type, title, message, due_date, channel, is_read, is_sent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, reminders)

    # 8. Activity Logs
    activity_logs = [
        (1, 1, "Claim Filed", "claim", 1, "Alex Vance submitted claim CLM-2026-0081 for Sony A7 IV."),
        (2, 4, "Claim Approved", "claim", 2, "Warranty Admin Elena approved claim CLM-2026-0045 for $890.00."),
        (3, 2, "Service Assigned", "service", 1, "Sarah Connor assigned Service Request #SR-2026-104 to David Miller."),
        (4, 3, "Repair In Progress", "service", 1, "Tech David Miller updated SR-2026-104: Parts received, disassembly started."),
        (5, 1, "OCR Invoice Uploaded", "invoice", 1, "OCR successfully extracted Apple Fifth Ave invoice data with 99.4% confidence.")
    ]
    cur.executemany("""
        INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?, ?, ?)
    """, activity_logs)

    conn.commit()

if __name__ == "__main__":
    init_db(force_reseed=True)
    print("Database initialized and seeded successfully at:", DB_FILE)

