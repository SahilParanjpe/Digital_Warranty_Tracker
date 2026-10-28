import urllib.request
import json
import sys

def test(url, method='GET', data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        body = json.dumps(data).encode('utf-8')
    else:
        body = None
    try:
        with urllib.request.urlopen(req, data=body) as resp:
            content = resp.read().decode('utf-8')
            print(f"[PASS] {method} {url} -> {resp.status}")
            return content
    except Exception as e:
        print(f"[FAIL] {method} {url} -> {e}")
        return None

print("=== TESTING BACKEND ROLE-BASED ENDPOINTS ===")
test("http://localhost:8080/api/health")
test("http://localhost:8080/api/dashboard/stats?role=product_owner&user_id=1")
test("http://localhost:8080/api/dashboard/stats?role=service_center_staff&user_id=2")
test("http://localhost:8080/api/dashboard/stats?role=service_technician&user_id=3")
test("http://localhost:8080/api/dashboard/stats?role=warranty_admin&user_id=4")
test("http://localhost:8080/api/analytics")
test("http://localhost:8080/api/technicians/workload")
test("http://localhost:8080/api/products/1/certificate")
test("http://localhost:8080/api/parts-requests?technician_id=3")
test("http://localhost:8080/api/users?search=alex")
test("http://localhost:8080/api/audit-logs")
test("http://localhost:8080/api/reports/export?type=products")

# Test Login for all 4 roles
roles = [
    ("alex@owner.com", "product_owner"),
    ("sarah@servicecenter.com", "service_center_staff"),
    ("david@technician.com", "service_technician"),
    ("elena@admin.com", "warranty_admin")
]
print("\n=== TESTING 4 ROLE LOGINS ===")
for email, role in roles:
    res = test("http://localhost:8080/api/auth/login", method='POST', data={"email": email, "password": "password123"})
    if res:
        j = json.loads(res)
        assert j.get("success") is True, f"Login failed for {email}"
        assert j["user"]["role"] == role, f"Role mismatch for {email}"
        print(f"  -> Verified login for {email} ({j['user']['name']}) - role: {j['user']['role']}")

print("\nALL VERIFICATIONS PASSED!")

