import subprocess
import time
import urllib.request
import urllib.error
import json
import os
import sys

# Constants
API_URL = "http://127.0.0.1:8081"
DB_FILE = "local_integration_test.db"

def cleanup():
    # Delete SQLite db if it exists to start fresh
    if os.path.exists(DB_FILE):
        try:
            os.remove(DB_FILE)
        except OSError:
            pass

def make_request(url, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        
    try:
        with urllib.request.urlopen(req, data=body) as response:
            res_content = response.read().decode("utf-8")
            res_data = None
            if res_content.strip():
                try:
                    res_data = json.loads(res_content)
                except json.JSONDecodeError:
                    res_data = res_content
            return response.status, res_data
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_data = json.loads(err_body)
            detail = err_data.get("detail", err_body)
        except Exception:
            detail = err_body
        return e.code, detail
    except Exception as e:
        return 500, str(e)

def run_tests():
    print("\n--- Starting API Integration Tests ---")
    
    # 1. Test Root
    status, res = make_request(f"{API_URL}/")
    print(f"GET / -> Status: {status}, Response: {res}")
    assert status == 200, "Root endpoint failed"
    
    # 2. Test Customer Creation (Unique Email)
    print("\n[Testing Customer Management]")
    cust1 = {"name": "Alice Smith", "email": "alice@example.com", "phone": "1234567890"}
    status, res = make_request(f"{API_URL}/customers", "POST", cust1)
    print(f"Create Customer 1 -> Status: {status}, ID: {res.get('id') if status==201 else res}")
    assert status == 201, "Customer 1 creation failed"
    alice_id = res["id"]
    
    # Try duplicate email
    status, res = make_request(f"{API_URL}/customers", "POST", cust1)
    print(f"Create Duplicate Customer -> Status: {status}, Detail: {res}")
    assert status == 400, "Duplicate email check failed"
    assert "already exists" in str(res), "Incorrect error message for duplicate email"

    # 3. Test Product Creation (Unique SKU, Quantities)
    print("\n[Testing Product Management]")
    prod1 = {"name": "Product A", "sku": "PROD-A", "price": 10.0, "quantity": 5}
    status, res = make_request(f"{API_URL}/products", "POST", prod1)
    print(f"Create Product A -> Status: {status}, ID: {res.get('id') if status==201 else res}")
    assert status == 201, "Product A creation failed"
    prod_a_id = res["id"]
    
    prod2 = {"name": "Product B", "sku": "PROD-B", "price": 20.0, "quantity": 10}
    status, res = make_request(f"{API_URL}/products", "POST", prod2)
    print(f"Create Product B -> Status: {status}, ID: {res.get('id') if status==201 else res}")
    assert status == 201, "Product B creation failed"
    prod_b_id = res["id"]
    
    # Duplicate SKU test
    status, res = make_request(f"{API_URL}/products", "POST", prod1)
    print(f"Create Duplicate SKU -> Status: {status}, Detail: {res}")
    assert status == 400, "Duplicate SKU check failed"
    assert "already exists" in str(res), "Incorrect error message for duplicate SKU"

    # Negative price test
    invalid_prod = {"name": "Product C", "sku": "PROD-C", "price": -5.0, "quantity": 2}
    status, res = make_request(f"{API_URL}/products", "POST", invalid_prod)
    print(f"Create Negative Price Product -> Status: {status}, Detail: {res}")
    assert status == 422 or status == 400, "Negative price check failed"

    # 4. Test Order Creation & Inventory Operations
    print("\n[Testing Order Management & Stock Rules]")
    
    # Check stats before order
    status, stats = make_request(f"{API_URL}/dashboard/stats")
    print(f"Stats Before Order -> Products: {stats['total_products']}, Customers: {stats['total_customers']}, Orders: {stats['total_orders']}")
    
    # Valid Order
    # Alice buys 2 of Product A (Stock: 5 -> should become 3)
    # Alice buys 1 of Product B (Stock: 10 -> should become 9)
    # Total price should be: (2 * 10) + (1 * 20) = 40.0
    order_payload = {
        "customer_id": alice_id,
        "items": [
            {"product_id": prod_a_id, "quantity": 2},
            {"product_id": prod_b_id, "quantity": 1}
        ]
    }
    
    status, order = make_request(f"{API_URL}/orders", "POST", order_payload)
    print(f"Place Valid Order -> Status: {status}, Order ID: {order.get('id') if status==201 else order}, Calculated Total: {order.get('total_amount') if status==201 else None}")
    assert status == 201, "Order placement failed"
    assert order["total_amount"] == 40.0, "Order total amount calculation incorrect"
    order_id = order["id"]
    
    # Verify stock reduction
    status, res_a = make_request(f"{API_URL}/products/{prod_a_id}")
    status, res_b = make_request(f"{API_URL}/products/{prod_b_id}")
    print(f"Product A remaining stock: {res_a['quantity']} (expected 3)")
    print(f"Product B remaining stock: {res_b['quantity']} (expected 9)")
    assert res_a["quantity"] == 3, "Product A stock not reduced correctly"
    assert res_b["quantity"] == 9, "Product B stock not reduced correctly"
    
    # Invalid Order (exceeding stock)
    # Alice tries to buy 4 of Product A, but only 3 left
    over_order = {
        "customer_id": alice_id,
        "items": [
            {"product_id": prod_a_id, "quantity": 4}
        ]
    }
    status, res = make_request(f"{API_URL}/orders", "POST", over_order)
    print(f"Place Excess Order -> Status: {status}, Detail: {res}")
    assert status == 400, "Exceeding stock check failed"
    assert "Insufficient stock" in str(res), "Incorrect error message for insufficient stock"
    
    # 5. Cancel/Delete Order and verify stock restoration
    print("\n[Testing Order Deletion / Stock Restoration]")
    status, res = make_request(f"{API_URL}/orders/{order_id}", "DELETE")
    print(f"Cancel Order #{order_id} -> Status: {status}")
    assert status == 204 or status == 200, "Order deletion failed"
    
    # Verify stock is restored
    status, res_a = make_request(f"{API_URL}/products/{prod_a_id}")
    status, res_b = make_request(f"{API_URL}/products/{prod_b_id}")
    print(f"Product A restored stock: {res_a['quantity']} (expected 5)")
    print(f"Product B restored stock: {res_b['quantity']} (expected 10)")
    assert res_a["quantity"] == 5, "Product A stock not restored"
    assert res_b["quantity"] == 10, "Product B stock not restored"

    # Check stats after canceling
    status, stats = make_request(f"{API_URL}/dashboard/stats")
    print(f"Stats After Cancel -> Products: {stats['total_products']}, Customers: {stats['total_customers']}, Orders: {stats['total_orders']}")
    
    print("\n[SUCCESS] ALL API INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    cleanup()
    
    # Set SQLite environment variable for local test run
    os.environ["DATABASE_URL"] = f"sqlite:///./{DB_FILE}"
    
    # Start uvicorn server in a separate background process
    print("Booting local test server with SQLite...")
    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8081"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait for server to boot
    time.sleep(3)
    
    try:
        run_tests()
    except AssertionError as ae:
        print(f"\n[ERROR] Test validation failed: {ae}")
        # Print server logs on failure
        try:
            server_process.terminate()
            stdout, stderr = server_process.communicate(timeout=2)
            print("--- Server Stdout ---")
            print(stdout)
            print("--- Server Stderr ---")
            print(stderr)
        except Exception as e:
            print(f"Could not read server logs: {e}")
        sys.exit(1)
    except Exception as ex:
        print(f"\n[ERROR] Unexpected error: {ex}")
        try:
            server_process.terminate()
            stdout, stderr = server_process.communicate(timeout=2)
            print("--- Server Stdout ---")
            print(stdout)
            print("--- Server Stderr ---")
            print(stderr)
        except Exception as e:
            print(f"Could not read server logs: {e}")
        sys.exit(1)
    finally:
        # Terminate server process
        server_process.terminate()
        server_process.wait()
        cleanup()
        print("Test server shut down and database cleaned up.")
