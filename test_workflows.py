import urllib.request
import json

def api_call(url, method='GET', data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        body = json.dumps(data).encode('utf-8')
    else:
        body = None
    with urllib.request.urlopen(req, data=body) as resp:
        return json.loads(resp.read().decode('utf-8'))

print("=== TESTING WORKFLOW STATE MACHINES ===")

# 1. Product Owner creates a service request, then cancels it
print("[1] Creating new pending service request by customer Alex Vance...")
create_res = api_call("http://localhost:8080/api/service-requests", method='POST', data={
    "owner_id": 1,
    "product_id": 1,
    "issue_title": "MacBook Trackpad Haptic Feedback Test",
    "issue_description": "Intermittent click vibration",
    "priority": "low"
})
new_sr_id = create_res["service_request"]["id"]
print(f"Created SR #{new_sr_id}:", create_res["service_request"]["request_number"])

print("\nCancelling the newly created pending request...")
res = api_call(f"http://localhost:8080/api/service-requests/{new_sr_id}/cancel", method='PATCH', data={
    "user_id": 1,
    "reason": "Customer tested device at home and symptom resolved."
})
print("Cancel Response:", res)
assert res["success"] is True

# 2. Service Staff assigns technician to ticket #3
print("\n[2] Testing service staff technician assignment on ticket #3...")
res = api_call("http://localhost:8080/api/service-requests/3", method='PATCH', data={
    "assigned_technician_id": 3,
    "scheduled_slot": "Tomorrow 10:00 - 12:00 (Bay 1)",
    "technician_notes": "Priority display calibration check",
    "status": "assigned",
    "staff_id": 2
})
print("Assign Response:", res)
assert res["success"] is True

# 3. Technician reports diagnosis on ticket #3
print("\n[3] Testing technician diagnosis report on ticket #3...")
res = api_call("http://localhost:8080/api/service-requests/3/workflow", method='PATCH', data={
    "action": "report_diagnosis",
    "technician_id": 3,
    "diagnosis": "Logic board ribbon connector loose.",
    "root_cause": "Impact vibration during transit.",
    "troubleshooting_steps": "Bench voltage inspection + ribbon reseating"
})
print("Tech Workflow Response:", res)
assert res["success"] is True

# 4. Technician completes repair on ticket #3
print("\n[4] Testing technician completion & QC signoff on ticket #3...")
res = api_call("http://localhost:8080/api/service-requests/3/workflow", method='PATCH', data={
    "action": "complete",
    "technician_id": 3,
    "technician_notes": "Ribbon replaced and calibrated. 100% bench QC pass."
})
print("Complete Response:", res)
assert res["success"] is True

# 5. Service Staff adjudicates warranty claim with reason and fraud flag check
print("\n[5] Testing staff claim adjudication with rejection reason and fraud flag...")
res = api_call("http://localhost:8080/api/claims/2", method='PATCH', data={
    "status": "rejected",
    "rejection_reason": "Physical liquid damage detected upon bay inspection.",
    "admin_notes": "Not covered by limited hardware clause.",
    "fraud_flag": True,
    "decided_by": 2
})
print("Adjudicate Response:", res)
assert res["success"] is True
assert res["claim"]["rejection_reason"] == "Physical liquid damage detected upon bay inspection."
assert res["claim"]["fraud_flag"] == 1

print("\nALL WORKFLOW TESTS COMPLETED SUCCESSFULLY AND VALIDATED!")
