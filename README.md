# Digital Warranty Tracker & Service Hub

An intelligent, full-stack digital warranty management platform designed for **Product Owners**, **Service Center Staff**, **Service Technicians**, and **Warranty Administrators**.

Built with a **Python REST backend**, **SQLite database**, and a high-fidelity frontend designed directly from reference aesthetics:
- **Hero Landing Page:** Modern minimalist design with floating pill navbar, pastel mesh gradient, bold typography, and trusted brand logos.
- **Interactive Dashboard:** Tailored CRM dashboard interface with left rounded sidebar, KPI sparkline cards, curved warranty coverage trend charts, today's schedule/service queue, and activity streams.
- **Strict Indian Rupee (`₹` INR) Currency:** Used across all dashboard metrics, portfolio charts, category pills, OCR receipts, and claim payouts.
- **Distinct Stakeholder Dashboard Views:** Dynamically customized for each of the 4 roles with specialized KPIs, contextual greeting subtexts, action buttons, and prioritized functional workflows.

---

## 👥 Who Uses It & Differentiated Dashboard Views

| Role | Key Responsibilities & Capabilities | Customized Dashboard View & KPIs | Demo Login |
| :--- | :--- | :--- | :--- |
| 👤 **Product Owner** | Registers products, uploads invoice receipts with OCR data extraction, receives warranty expiry reminders, and files claims with defect photos. | **Personal Warranty Vault View:**<br>• Focus: My Products Directory & OCR Scanner<br>• Quick Actions: `Instant OCR Scan`, `+ Register Product`, `+ File Claim`<br>• KPIs: Total Vault Value (₹), Claims Filed, Verification Rate (100%), 30-Day Expiry Alerts | `alex@owner.com`<br>`password123` |
| 🏢 **Service Center Staff** | Receives warranty service requests, allocates bay slots, and dispatches repair jobs to available technicians. | **Service Dispatch & Intake Desk View:**<br>• Focus: Service Bay Queue & Workshop Schedule<br>• Quick Actions: `Dispatch Technician`, `+ New Service Intake`, `Bay Schedule`<br>• KPIs: Pending Intake Queue, Active Service Bays, On-Duty Techs, Dispatch SLA | `sarah@servicecenter.com`<br>`password123` |
| 🔧 **Service Technician** | Views assigned service tickets, inspects hardware, records diagnostic notes, requisitions parts, and completes repair orders. | **Senior Technician Workbench View:**<br>• Focus: Assigned Bench Work Orders & QC<br>• Quick Actions: `Complete Bench Job ✓`, `Update Diagnostic Notes`, `Requisition Parts`<br>• KPIs: Jobs Assigned Today, Active Bench Work, First-Time Fix Rate (96.4%), Parts Queue | `david@technician.com`<br>`password123` |
| 🛡️ **Warranty Administrator** | Configures manufacturer coverage rules (standard terms, ADH coverage, grace periods) and adjudicates warranty claims. | **Warranty Governance & Claims Desk View:**<br>• Focus: Claims Lifecycle Adjudication & Policy Rules Engine<br>• Quick Actions: `Adjudicate Claims`, `+ Configure Policy Rule`, `Manufacturer Policies`<br>• KPIs: Pending Claims Value (₹), Approved Payouts (₹), Active Brand Rules, Rejection Rate | `elena@admin.com`<br>`password123` |

*Note: The application includes a top role bar and a 1-click Quick Demo Login in the modal to instantly toggle between all 4 perspectives.*

---

## 🗄️ Database Tables (SQLite: `warranty_tracker.db`)

The SQLite database schema is defined in [`schema.sql`](file:///home/students/Desktop/158/schema.sql) and managed via [`database.py`](file:///home/students/Desktop/158/database.py):

1. **`users`**
   - Stores user accounts, authentication credentials (SHA-256 password hash), avatars, and roles (`product_owner`, `service_center_staff`, `service_technician`, `warranty_admin`).

2. **`coverage_rules`**
   - Configured by Warranty Administrators to govern manufacturer warranty policies (`Apple`, `Samsung`, `Sony`, `Dell`, `Dyson`, `LG`).
   - Fields: `standard_warranty_months`, `extended_warranty_allowed`, `accidental_damage_covered`, `requires_original_invoice`, `grace_period_days`, `terms_summary`.

3. **`products`**
   - Central repository for registered products and active warranties.
   - Fields: `owner_id`, `product_name`, `brand`, `model_number`, `serial_number`, `category`, `purchase_date`, `purchase_price`, `retailer`, `warranty_duration_months`, `warranty_start_date`, `warranty_end_date`, `warranty_type`, `status` (`active`, `expiring_soon`, `expired`, `voided`), `verification_status`.

4. **`invoices`**
   - Keeps proof of purchase safe and retrievable.
   - Fields: `product_id`, `filename`, `file_path`, `ocr_raw_text`, `extracted_store`, `extracted_date`, `extracted_price`, `extracted_serial`, `manual_corrections_made`.

5. **`warranty_claims`**
   - Complete 5-stage claims lifecycle: `draft` → `submitted` → `under_review` → `service_scheduled` → `resolved` (with `rejected` and `withdrawn` options).
   - Fields: `claim_number`, `product_id`, `owner_id`, `issue_category`, `issue_description`, `evidence_photo_url`, `status`, `admin_notes`, `approved_amount`, `decided_by`.

6. **`service_requests`**
   - Bay repair tickets assigned by Service Center Staff to Service Technicians.
   - Fields: `request_number`, `product_id`, `claim_id`, `owner_id`, `assigned_technician_id`, `assigned_by_staff_id`, `issue_title`, `issue_description`, `photo_url`, `status` (`pending`, `assigned`, `in_progress`, `awaiting_parts`, `completed`), `priority`, `technician_notes`, `scheduled_slot`.

7. **`reminders`**
   - Automated alerts for warranty expiry (30 days, 7 days before) and service appointments.
   - Fields: `user_id`, `product_id`, `service_request_id`, `reminder_type`, `title`, `message`, `due_date`, `channel` (`email`, `push`, `all`), `is_read`.

8. **`activity_logs`**
   - Audit trail of actions across the entire platform.
   - Fields: `user_id`, `action`, `entity_type`, `entity_id`, `details`, `created_at`.

---

## ⚡ Key Features

- **Product Registration with OCR Scanner:**
  - Upload receipt image or pick sample invoices (Apple Store 5th Ave, B&H Photo Sony, Samsung Experience Store, Dyson Direct).
  - Automatically extracts store name, purchase date, price, model, and serial number with confidence scoring.
  - **Manual correction always possible** via editable inputs before saving to the database.

- **Warranty Verification Engine:**
  - Real-time check against manufacturer register and administrator coverage rules.
  - Returns coverage eligibility badge (`ELIGIBLE` / `EXPIRED`), remaining days, and applicable policy clauses.

- **Proof of Purchase Storage:**
  - View invoices, view OCR extraction transcripts, and download stored receipts.

- **Smart Reminders & Push Alerts:**
  - Drawer showing upcoming warranty expiration dates and scheduled service appointments.
  - Channel indicators for email and push notifications.

- **DWT Interactive Dashboard:**
  - Real-time active vs expired warranty counts.
  - Interactive search and filter toolbar (search by serial number, brand, model, or status).
  - 4 KPI metric cards with sparkline curves and trend delta badges.
  - Curved warranty portfolio value chart with actual vs forecast comparison.
  - Today's schedule card with technician avatars and status tags.
  - Warranty lifecycle pipeline conversion tracker.

---

## 🚀 Running the Project

The server uses Python's standard library with zero external dependencies required:

1. **Initialize and Seed Database:**
   ```bash
   python3 database.py
   ```

2. **Start the Web Server:**
   ```bash
   python3 server.py 8080
   ```

3. **Open in Browser:**
   Visit **`http://localhost:8080`**
   - Switch between **Landing Hero** and **Dashboard View** using the top navigation bar.
   - Switch between all 4 user roles (**Product Owner**, **Service Staff**, **Technician**, **Admin**) at any time.

