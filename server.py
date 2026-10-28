#!/usr/bin/env python3
import os
import sys
import json
import urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import database
import api

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'static')
TEMPLATES_DIR = os.path.join(BASE_DIR, 'templates')

class WarrantyServerHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Flat query param helper
        params = {k: v[0] for k, v in query.items()}

        # 1. API Endpoints
        if path.startswith('/api/'):
            self.handle_api_get(path, params)
            return

        # 2. Main SPA HTML route
        if path in ('/', '/index.html', '/dashboard', '/login', '/signup', '/portal'):
            self.serve_template('index.html')
            return

        # 3. Static Files
        if path.startswith('/static/'):
            relative_path = path[len('/static/'):]
            full_path = os.path.join(STATIC_DIR, relative_path)
            if os.path.exists(full_path) and os.path.isfile(full_path):
                self.serve_file(full_path)
                return

        # Fallback to standard file serving if exists in current dir
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        data = self.read_json_body()

        if path.startswith('/api/'):
            self.handle_api_post(path, data)
            return

        self.send_json({"error": "Not Found"}, 404)

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        data = self.read_json_body()

        if path.startswith('/api/'):
            self.handle_api_patch(path, data)
            return

        self.send_json({"error": "Not Found"}, 404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        params = {k: v[0] for k, v in query.items()}

        if path.startswith('/api/'):
            self.handle_api_delete(path, params)
            return

        self.send_json({"error": "Not Found"}, 404)

    # ---------------- API Dispatchers ---------------- #
    def handle_api_get(self, path, params):
        try:
            if path == '/api/health':
                self.send_json({"status": "healthy", "service": "digital-warranty-tracker", "database": "connected"})

            elif path == '/api/users':
                # Use admin_get_users for richer info (product_count, etc)
                search = params.get('search')
                role = params.get('role')
                res, code = api.admin_get_users(search=search, role_filter=role)
                self.send_json(res, code)

            elif path == '/api/products':
                res, code = api.get_products(params)
                self.send_json(res, code)

            elif path.startswith('/api/products/'):
                parts = path.strip('/').split('/')
                # /api/products/<id> or /api/products/<id>/certificate
                if len(parts) == 3 and parts[2].isdigit():
                    prod_id = int(parts[2])
                    res, code = api.get_product_detail(prod_id)
                    self.send_json(res, code)
                elif len(parts) == 4 and parts[2].isdigit() and parts[3] == 'certificate':
                    prod_id = int(parts[2])
                    res, code = api.get_warranty_certificate(prod_id)
                    self.send_json(res, code)
                else:
                    self.send_json({"error": "Invalid product endpoint"}, 400)

            elif path == '/api/claims':
                res, code = api.get_claims(params)
                self.send_json(res, code)

            elif path == '/api/service-requests':
                res, code = api.get_service_requests(params)
                self.send_json(res, code)

            elif path == '/api/rules':
                res, code = api.get_coverage_rules()
                self.send_json(res, code)

            elif path == '/api/reminders':
                uid = int(params.get('user_id', 1))
                res, code = api.get_reminders(uid)
                self.send_json(res, code)

            elif path == '/api/dashboard/stats':
                uid = int(params.get('user_id', 1))
                role = params.get('role', 'product_owner')
                res, code = api.get_dashboard_stats(uid, role)
                self.send_json(res, code)

            elif path == '/api/analytics':
                res, code = api.get_analytics_data()
                self.send_json(res, code)

            elif path == '/api/technicians/workload':
                res, code = api.get_technicians_workload()
                self.send_json(res, code)

            elif path == '/api/parts-requests':
                res, code = api.get_parts_requests(params)
                self.send_json(res, code)

            elif path == '/api/categories-brands':
                res, code = api.get_categories_and_brands()
                self.send_json(res, code)

            elif path == '/api/audit-logs':
                search = params.get('search')
                entity_type = params.get('entity_type')
                limit = int(params.get('limit', 50))
                res, code = api.get_audit_logs(search, entity_type, limit)
                self.send_json(res, code)

            elif path == '/api/reports/export':
                report_type = params.get('type', 'products')
                uid = int(params.get('user_id')) if params.get('user_id') and params.get('user_id').isdigit() else None
                role = params.get('role', 'warranty_admin')
                csv_data = api.export_report_csv(report_type, uid, role)
                encoded = csv_data.encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'text/csv; charset=utf-8')
                self.send_header('Content-Disposition', f'attachment; filename="warranty_{report_type}_report.csv"')
                self.send_header('Content-Length', str(len(encoded)))
                self.end_headers()
                self.wfile.write(encoded)

            else:
                self.send_json({"error": "Endpoint not found"}, 404)
        except Exception as e:
            self.send_json({"error": str(e)}, 500)

    def handle_api_post(self, path, data):
        try:
            if path == '/api/auth/login':
                res, code = api.handle_login(data)
                self.send_json(res, code)
            elif path == '/api/auth/register':
                res, code = api.handle_register(data)
                self.send_json(res, code)
            elif path == '/api/auth/send-otp':
                res, code = api.handle_send_otp(data)
                self.send_json(res, code)
            elif path == '/api/auth/verify-otp':
                res, code = api.handle_verify_otp(data)
                self.send_json(res, code)
            elif path == '/api/products':
                res, code = api.create_product(data)
                self.send_json(res, code)
            elif path == '/api/ocr/parse':
                res, code = api.parse_ocr_simulated(data)
                self.send_json(res, code)
            elif path == '/api/warranty/verify':
                res, code = api.verify_warranty(data)
                self.send_json(res, code)
            elif path == '/api/claims':
                res, code = api.create_claim(data)
                self.send_json(res, code)
            elif path == '/api/service-requests':
                res, code = api.create_service_request(data)
                self.send_json(res, code)
            elif path == '/api/rules':
                res, code = api.create_or_update_rule(data)
                self.send_json(res, code)
            elif path.startswith('/api/reminders/') and path.endswith('/read'):
                parts = path.strip('/').split('/')
                rem_id = int(parts[2])
                res, code = api.mark_reminder_read(rem_id)
                self.send_json(res, code)
            elif path == '/api/users':
                res, code = api.admin_create_user(data)
                self.send_json(res, code)
            elif path == '/api/parts-requests':
                res, code = api.create_parts_request(data)
                self.send_json(res, code)
            else:
                self.send_json({"error": "Endpoint not found"}, 404)
        except Exception as e:
            self.send_json({"error": str(e)}, 500)

    def handle_api_patch(self, path, data):
        try:
            if path.startswith('/api/claims/'):
                parts = path.strip('/').split('/')
                claim_id = int(parts[2])
                res, code = api.update_claim_status(claim_id, data)
                self.send_json(res, code)

            elif path.startswith('/api/products/'):
                parts = path.strip('/').split('/')
                # /api/products/<id>/verify
                prod_id = int(parts[2])
                if len(parts) == 4 and parts[3] == 'verify':
                    res, code = api.verify_product(prod_id, data)
                    self.send_json(res, code)
                else:
                    self.send_json({"error": "Invalid product endpoint"}, 400)

            elif path.startswith('/api/service-requests/'):
                parts = path.strip('/').split('/')
                # /api/service-requests/<id>
                # /api/service-requests/<id>/cancel
                # /api/service-requests/<id>/workflow
                req_id = int(parts[2])
                if len(parts) == 3:
                    res, code = api.update_service_request(req_id, data)
                    self.send_json(res, code)
                elif len(parts) == 4 and parts[3] == 'cancel':
                    uid = int(data.get('user_id', 1))
                    reason = data.get('reason', 'Customer requested cancellation')
                    res, code = api.cancel_service_request(req_id, uid, reason)
                    self.send_json(res, code)
                elif len(parts) == 4 and parts[3] == 'workflow':
                    tech_id = int(data.get('technician_id', 3))
                    res, code = api.technician_workflow_action(req_id, tech_id, data)
                    self.send_json(res, code)
                else:
                    self.send_json({"error": "Invalid service request sub-endpoint"}, 400)

            elif path.startswith('/api/users/'):
                parts = path.strip('/').split('/')
                if len(parts) == 3 and parts[2].isdigit():
                    user_id = int(parts[2])
                    res, code = api.admin_update_user(user_id, data)
                    self.send_json(res, code)
                else:
                    self.send_json({"error": "Invalid user ID"}, 400)

            elif path.startswith('/api/parts-requests/'):
                parts = path.strip('/').split('/')
                if len(parts) == 3 and parts[2].isdigit():
                    part_id = int(parts[2])
                    res, code = api.update_parts_request(part_id, data)
                    self.send_json(res, code)
                else:
                    self.send_json({"error": "Invalid part request ID"}, 400)

            else:
                self.send_json({"error": "Endpoint not found"}, 404)
        except Exception as e:
            self.send_json({"error": str(e)}, 500)

    def handle_api_delete(self, path, params):
        try:
            if path.startswith('/api/products/'):
                parts = path.strip('/').split('/')
                if len(parts) == 3 and parts[2].isdigit():
                    prod_id = int(parts[2])
                    uid = int(params.get('user_id', 1)) if params.get('user_id') else None
                    role = params.get('role', 'warranty_admin')
                    res, code = api.delete_product(prod_id, uid, role)
                    self.send_json(res, code)
                else:
                    self.send_json({"error": "Invalid product ID"}, 400)
            else:
                self.send_json({"error": "Endpoint not found"}, 404)
        except Exception as e:
            self.send_json({"error": str(e)}, 500)

    # ---------------- Helpers ---------------- #
    def read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                return json.loads(body)
            except json.JSONDecodeError:
                return {}
        return {}

    def send_json(self, data, status_code=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def serve_template(self, filename):
        file_path = os.path.join(TEMPLATES_DIR, filename)
        if os.path.exists(file_path):
            with open(file_path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        else:
            self.send_json({"error": f"Template {filename} not found"}, 404)

    def serve_file(self, full_path):
        mime = 'text/plain'
        if full_path.endswith('.html'):
            mime = 'text/html'
        elif full_path.endswith('.css'):
            mime = 'text/css'
        elif full_path.endswith('.js'):
            mime = 'application/javascript'
        elif full_path.endswith('.svg'):
            mime = 'image/svg+xml'
        elif full_path.endswith('.png'):
            mime = 'image/png'
        elif full_path.endswith('.jpg') or full_path.endswith('.jpeg'):
            mime = 'image/jpeg'
        elif full_path.endswith('.pdf'):
            mime = 'application/pdf'
        elif full_path.endswith('.json'):
            mime = 'application/json'

        with open(full_path, 'rb') as f:
            content = f.read()
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

def run(port=8080):
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass
    database.init_db()
    server_address = ('0.0.0.0', port)
    httpd = ThreadingHTTPServer(server_address, WarrantyServerHandler)
    print(f"[*] Digital Warranty Tracker running on http://localhost:{port}")
    httpd.serve_forever()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run(port)
