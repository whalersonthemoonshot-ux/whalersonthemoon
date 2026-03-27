#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class WhaleTrackerAPITester:
    def __init__(self, base_url="https://whale-tracker-44.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Dict = None, headers: Dict = None) -> tuple[bool, Any]:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = response.text

            details = f"Status: {response.status_code}"
            if not success:
                details += f" (expected {expected_status})"
            
            self.log_test(name, success, details, response_data if not success else None)
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        
        if success:
            # Validate response structure
            required_fields = ["status", "timestamp", "helius_configured", "covalent_configured"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test(
                    "Health Check Response Structure",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            else:
                self.log_test(
                    "Health Check Response Structure",
                    True,
                    f"All required fields present. Status: {response.get('status')}"
                )
        
        return success

    def test_transactions_endpoint(self):
        """Test transactions endpoint"""
        # Test all transactions
        success, response = self.run_test(
            "Get All Transactions",
            "GET",
            "transactions",
            200
        )
        
        if success:
            # Validate response structure
            required_fields = ["transactions", "total_count", "last_updated", "networks"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test(
                    "Transactions Response Structure",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            else:
                transactions = response.get("transactions", [])
                self.log_test(
                    "Transactions Response Structure",
                    True,
                    f"Found {len(transactions)} transactions"
                )
                
                # Validate transaction structure if any exist
                if transactions:
                    tx = transactions[0]
                    tx_required_fields = [
                        "id", "signature", "network", "token_name", "token_symbol",
                        "amount_usd", "amount_cad", "from_address", "to_address",
                        "timestamp", "explorer_url", "transaction_type"
                    ]
                    tx_missing_fields = [field for field in tx_required_fields if field not in tx]
                    
                    if tx_missing_fields:
                        self.log_test(
                            "Transaction Object Structure",
                            False,
                            f"Missing fields in transaction: {tx_missing_fields}"
                        )
                    else:
                        self.log_test(
                            "Transaction Object Structure",
                            True,
                            f"Transaction has all required fields. Network: {tx.get('network')}, Amount CAD: {tx.get('amount_cad')}"
                        )
        
        # Test Solana filter
        success, response = self.run_test(
            "Get Solana Transactions",
            "GET",
            "transactions?network=solana",
            200
        )
        
        if success:
            transactions = response.get("transactions", [])
            solana_only = all(tx.get("network") == "solana" for tx in transactions)
            self.log_test(
                "Solana Filter",
                solana_only,
                f"Found {len(transactions)} Solana transactions"
            )
        
        # Test Base filter
        success, response = self.run_test(
            "Get Base Transactions",
            "GET",
            "transactions?network=base",
            200
        )
        
        if success:
            transactions = response.get("transactions", [])
            base_only = all(tx.get("network") == "base" for tx in transactions)
            self.log_test(
                "Base Filter",
                base_only,
                f"Found {len(transactions)} Base transactions"
            )

    def test_subscription_endpoints(self):
        """Test subscription endpoints"""
        # Test subscription count
        success, response = self.run_test(
            "Get Subscription Count",
            "GET",
            "subscriptions/count",
            200
        )
        
        if success and "count" in response:
            initial_count = response["count"]
            self.log_test(
                "Subscription Count Structure",
                True,
                f"Current subscriber count: {initial_count}"
            )
        
        # Test email subscription
        test_email = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
        success, response = self.run_test(
            "Subscribe Email",
            "POST",
            "subscribe",
            200,
            data={"email": test_email}
        )
        
        if success:
            required_fields = ["id", "email", "created_at"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test(
                    "Subscription Response Structure",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            else:
                self.log_test(
                    "Subscription Response Structure",
                    True,
                    f"Subscription created for {response.get('email')}"
                )
        
        # Test duplicate subscription
        success, response = self.run_test(
            "Duplicate Subscription (Should Fail)",
            "POST",
            "subscribe",
            400,
            data={"email": test_email}
        )
        
        # Test invalid email
        success, response = self.run_test(
            "Invalid Email (Should Fail)",
            "POST",
            "subscribe",
            422,
            data={"email": "invalid-email"}
        )

    def test_exchange_rate_endpoint(self):
        """Test exchange rate endpoint"""
        success, response = self.run_test(
            "Get Exchange Rate",
            "GET",
            "exchange-rate",
            200
        )
        
        if success:
            required_fields = ["usd_to_cad", "last_updated"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test(
                    "Exchange Rate Response Structure",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            else:
                rate = response.get("usd_to_cad")
                self.log_test(
                    "Exchange Rate Response Structure",
                    True,
                    f"USD to CAD rate: {rate}"
                )

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        
        if success and "message" in response:
            self.log_test(
                "API Root Response",
                True,
                f"Message: {response.get('message')}"
            )

    def run_all_tests(self):
        """Run all API tests"""
        print("🐋 WHALERS ON THE MOON - API TESTING")
        print("=" * 50)
        print(f"Testing API at: {self.api_url}")
        print()
        
        # Run all test suites
        self.test_root_endpoint()
        self.test_health_check()
        self.test_transactions_endpoint()
        self.test_subscription_endpoints()
        self.test_exchange_rate_endpoint()
        
        # Print summary
        print("=" * 50)
        print(f"📊 TEST SUMMARY")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Return exit code
        return 0 if self.tests_passed == self.tests_run else 1

def main():
    tester = WhaleTrackerAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())