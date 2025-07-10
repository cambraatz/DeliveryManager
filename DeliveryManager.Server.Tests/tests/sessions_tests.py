import unittest
import requests
import json
import argparse
import sys
import os
from datetime import datetime, timedelta

# Import utilities from the local utils.py
from utils import (
    COLOR_SUCCESS, COLOR_FAIL, COLOR_PRIMARY, COLOR_SECONDARY, COLOR_WARN,
    BASE_API_URL, DEV_USERNAME, DEV_USERNAME, DEV_PASSWORD, DEV_POWERUNIT,
    DEV_COMPANIES, DEV_MODULES, DEV_COMPANY, # Use DM-specific dev user/company
    printc, printv, log_header, # logging helpers
    get_authenticated_session_delivery_manager, # Use the DM-specific auth helper
    logout_via_api
)

from db_utils import (
    insert_test_user,
    delete_test_user,
)

# list of users added to DB...
CREATED_TEST_USERNAMES = []

# --- API HELPER FUNCTIONS FOR SESSIONS CONTROLLER ---
# These are identical to AdminPortal's, just using the new BASE_API_URL

def get_current_driver_via_api(session, verbose=False):
    """Helper to call GET /v1/sessions/me and return the response."""
    url = f"{BASE_API_URL}/sessions/me"
    printv(f"  > GET {url} - Getting current driver session", verbose)
    response = session.get(url, verify=False)
    printv(f"  < Status: {response.status_code}", verbose)
    try:
        printv(f"  < Response: {json.dumps(response.json(), indent=2)}", verbose)
    except json.JSONDecodeError:
        if response.text:
            printv(f"  < Response (text): {response.text}", verbose)
    return response

def return_session_via_api(session, verbose=False):
    """Helper to call POST /v1/sessions/return and return the response."""
    url = f"{BASE_API_URL}/sessions/return"
    printv(f"  > POST {url} - Initializing return session", verbose)
    response = session.post(url, verify=False) # Return doesn't need a body
    printv(f"  < Status: {response.status_code}", verbose)
    try:
        printv(f"  < Response: {json.dumps(response.json(), indent=2)}", verbose)
    except json.JSONDecodeError:
        if response.text:
            printv(f"  < Response (text): {response.text}", verbose)
    return response

# --- unittest.TestCase Class ---

class SessionApiTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """
        Runs once before all tests in this class.
        Inserts specific test manifests into the database using db_utils.
        """
        log_header("Setting up DB test data for SessionApiTests")
        try:
            # Define today's date in both DB (YYYYMMDD) and API (YYYY-MM-DD) formats
            # Use current date as TEST_MFSTDATE_API_FORMAT
            cls.TEST_MFSTDATE_API_FORMAT = datetime.now().strftime("%Y-%m-%d") 
            #today_db_format = datetime.now().strftime("%Y%m%d") 

            verbose = os.environ.get('API_TEST_VERBOSE') == '1'

            # Insert specific test user for out tests to use
            insert_test_user(
                username=DEV_USERNAME,
                password=DEV_PASSWORD,
                powerunit=DEV_POWERUNIT,
                companies=DEV_COMPANIES,
                modules=DEV_MODULES,
                verbose=verbose
            )
            CREATED_TEST_USERNAMES.append(DEV_USERNAME)
            
            printc("Test data setup complete", COLOR_SUCCESS)
            log_header("Beginning SessionApiTests")
        except Exception as e:
            printc(f"FAILED TO SETUP TEST DATA: {e}", COLOR_FAIL)
            printc("--- Test run aborted due to database setup failure. ---", COLOR_FAIL)
            raise # Re-raise to immediately stop the test runner if setup fails

    @classmethod
    def tearDownClass(cls):
        """
        Runs once after all tests in this class have completed.
        Cleans up only the test data inserted by setUpClass.
        """
        log_header("Cleaning up test data in database for SessionApiTests")
        try:
            # Delete only the specific records that were inserted for this test class
            delete_test_user(CREATED_TEST_USERNAMES)
            #delete_test_delivery_manifests(CREATED_TEST_MFST_KEYS) # inactive where no mfst generated...
            printc("--- Test data cleanup complete ---", COLOR_SUCCESS)
        except Exception as e:
            printc(f"--- FAILED TO CLEANUP TEST DATA: {e} ---", COLOR_FAIL)
            # It's generally good to re-raise cleanup failures so they are noticed.
            raise 

    def setUp(self):
        """Runs before each test method."""
        self.verbose = os.environ.get('API_TEST_VERBOSE') == '1'
        if self.verbose:
            printc(f"\n--- Running Test: {self._testMethodName} ---", COLOR_PRIMARY)

        # Get an authenticated session for tests that require it
        # Using the DeliveryManager-specific authentication helper
        self.session = get_authenticated_session_delivery_manager(
            username=DEV_USERNAME, 
            company=DEV_COMPANY, 
            verbose=self.verbose
        )
        if not self.session:
            self.skipTest("Setup failed: Could not get authenticated session for DeliveryManager DEV user.")

    def tearDown(self):
        """Runs after each test method."""
        if self.session:
            printv(f"\n--- CLEANUP: Logging out session for {self.session.cookies.get('username', 'N/A')} ---", self.verbose, COLOR_SECONDARY)
            try:
                logout_response = logout_via_api(self.session, verbose=self.verbose)
                if logout_response.status_code == 200:
                    printv("  < CLEANUP: Session logged out successfully.", self.verbose, COLOR_SUCCESS)
                else:
                    printc(f"  < CLEANUP: Failed to logout session. Status: {logout_response.status_code}", COLOR_WARN)
            except Exception as e:
                printc(f"  < CLEANUP ERROR: Exception during session logout: {e}", COLOR_FAIL)
        
        if self.session:
            self.session.cookies.clear()

    # Test 1: Dev Login (Success) - NEW TEST FOR DELIVERY MANAGER
    def test_1_dev_login_success(self):
        printv(f"\n--- Attempting Dev Login (Success) ---", self.verbose, COLOR_SECONDARY)
        # The setUp already performs a dev login. This test verifies its outcome.
        # We just need to assert that the session is indeed authenticated.
        
        # Verify the session has the expected cookies
        self.assertIsNotNone(self.session.cookies.get("username"), "Username cookie not set after dev-login")
        self.assertEqual(self.session.cookies.get("username"), DEV_USERNAME, "Incorrect username cookie")

        self.assertIsNotNone(self.session.cookies.get("company"), "Company cookie not set after dev-login")
        self.assertEqual(self.session.cookies.get("company"), DEV_COMPANY, "Incorrect company cookie")

        self.assertIsNotNone(self.session.cookies.get("access_token"), "Access token cookie not set after dev-login")
        self.assertIsNotNone(self.session.cookies.get("refresh_token"), "Refresh token cookie not set after dev-login")
        self.assertIsNotNone(self.session.cookies.get("company_mapping"), "Company mapping cookie not set after dev-login")
        self.assertIsNotNone(self.session.cookies.get("module_mapping"), "Module mapping cookie not set after dev-login")

        # Optionally, try to access a protected endpoint to confirm authentication
        try:
            printv(f"\n--- Attempting Get Current Driver (Valid) ---", self.verbose, COLOR_SECONDARY)
            response = get_current_driver_via_api(self.session, self.verbose)
            self.assertEqual(response.status_code, 200, f"Expected 200 OK for /me after dev-login, got {response.status_code}. Response: {response.text}")

            response_json = response.json()
            self.assertEqual(response_json["user"]["Username"], DEV_USERNAME, "Fetched user username mismatch after dev-login")

            printc("Test Dev Login (Success) PASSED.", COLOR_SUCCESS)
        except Exception as e:
            printc(f"Test Dev Login (Success) FAILED: {e}", COLOR_FAIL)
            raise

    # Test 2: Get Current Driver (Success)
    def test_2_get_current_driver_success(self):
        # Session is already created and authenticated in setUp.
        try:
            printv(f"\n--- Attempting Get Current Driver (Valid) ---", self.verbose, COLOR_SECONDARY)
            response = get_current_driver_via_api(self.session, self.verbose)
            self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}. Response: {response.text}")
            
            response_json = response.json()
            self.assertIn("user", response_json, "Response missing 'user' object")
            self.assertEqual(response_json["user"]["Username"], DEV_USERNAME, "Fetched user username mismatch")
            # The C# controller returns 'mapping' which is the serialized companyMapping.
            # Your AdminPortal test checked for 'companies' and 'modules'.
            # Adjusting to match DeliveryManager's 'mapping' structure.
            self.assertIn("mapping", response_json, "Response missing 'mapping' (company_mapping) object")
            
            # Optional: Parse mapping and check content if needed
            # try:
            #     parsed_mapping = json.loads(response_json["mapping"])
            #     self.assertIn(DEV_COMPANY_DM, parsed_mapping, "Company key not in mapping")
            # except json.JSONDecodeError:
            #     self.fail("Could not decode company_mapping from response.")

            printc("Test Get Current Driver (Success) PASSED.", COLOR_SUCCESS)
        except Exception as e:
            printc(f"Test Get Current Driver (Success) FAILED: {e}", COLOR_FAIL)
            raise

    # Test 3: Get Current Driver (Missing Cookie - Unauthorized/BadRequest)
    def test_3_get_current_driver_missing_cookie(self):
        # Create a session with no cookies for this specific test
        session_no_cookies = requests.Session()
        session_no_cookies.cookies.clear()

        try:
            printv(f"\n--- Attempting Get Current Driver (Unauthorized) ---", self.verbose, COLOR_SECONDARY)
            response = get_current_driver_via_api(session_no_cookies, self.verbose)
            
            # The API has [Authorize] and then checks cookies.
            # If no cookie is sent, [Authorize] will return 401 Unauthorized.
            # If cookie is sent but empty, then the controller's BadRequest will trigger.
            # Assert for either 401 or 400.
            self.assertIn(response.status_code, [401, 400], f"Expected 401 or 400, got {response.status_code}. Response: {response.text}")
            
            if response.status_code == 400:
                response_json = response.json()
                self.assertIn("Username cookies is missing or empty", response_json["message"], "Bad Request message mismatch")
            # For 401, the body might be empty or a generic ProblemDetails from ASP.NET Core
            
            printc("Test Get Current Driver (Missing Cookie) PASSED.", COLOR_SUCCESS)
        except Exception as e:
            printc(f"Test Get Current Driver (Missing Cookie) FAILED: {e}", COLOR_FAIL)
            raise

    # Test 4: Logout (Success)
    def test_4_logout_success(self):
        # Session is already created and authenticated in setUp.
        try:
            printv(f"\n--- Attempting Logout ---", self.verbose, COLOR_SECONDARY)
            response = logout_via_api(self.session, self.verbose) # This test *performs* the logout
            self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}. Response: {response.text}")
            
            response_json = response.json()
            self.assertIn("Logged out successfully", response_json["message"], "Logout message mismatch")

            printv(f"\n--- Attempting Unauthorized Access ---", self.verbose, COLOR_SECONDARY)
            # Verify that the session is truly logged out by attempting to access a protected endpoint
            # Use a generic protected endpoint if /users/{DEV_USERNAME} is not available in DeliveryManager
            protected_url = f"{BASE_API_URL}/sessions/me" # /sessions/me is a protected endpoint
            post_logout_response = self.session.get(protected_url, verify=False)
            self.assertEqual(post_logout_response.status_code, 401, 
                             f"Expected 401 Unauthorized after logout, got {post_logout_response.status_code}. Response: {post_logout_response.text}")

            printc("Test Logout (Success) PASSED.", COLOR_SUCCESS)
        except Exception as e:
            printc(f"Test Logout (Success) FAILED: {e}", COLOR_FAIL)
            raise

    # Test 5: Return Session (Success)
    def test_5_return_session_success(self):
        # Session is already created and authenticated in setUp.
        try:
            printv(f"\n--- Attempting Valid Return ---", self.verbose, COLOR_SECONDARY)
            response = return_session_via_api(self.session, self.verbose)
            self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}. Response: {response.text}")
            
            response_json = response.json()
            self.assertIn("Returning, cookies extension completed successfully.", response_json["message"], "Return message mismatch")
            
            # Verify 'return' cookie is set (though its value is 'true', it's a flag)
            self.assertEqual(self.session.cookies.get("return"), "true", "Return cookie not set or not 'true'")

            printc("Test Return Session (Success) PASSED.", COLOR_SUCCESS)
        except Exception as e:
            printc(f"Test Return Session (Success) FAILED: {e}", COLOR_FAIL)
            raise

    # Test 6: Return Session (Unauthorized)
    def test_6_return_session_unauthorized(self):
        # Create a session with no cookies (unauthenticated) for this test
        session_no_cookies = requests.Session()
        session_no_cookies.cookies.clear()

        try:
            printv(f"\n--- Attempting Unauthorized Return ---", self.verbose, COLOR_SECONDARY)
            response = return_session_via_api(session_no_cookies, self.verbose)
            # This endpoint has [Authorize], so it should return 401 Unauthorized
            self.assertEqual(response.status_code, 401, f"Expected 401 Unauthorized, got {response.status_code}. Response: {response.text}")
            
            # For 401, the body might be empty or a generic ProblemDetails from ASP.NET Core
            
            printc("Test Return Session (Unauthorized) PASSED.", COLOR_SUCCESS)
        except Exception as e:
            printc(f"Test Return Session (Unauthorized) FAILED: {e}", COLOR_FAIL)
            raise

# --- MAIN EXECUTION BLOCK ---
if __name__ == "__main__":
    # 1. Parse custom arguments first
    parser = argparse.ArgumentParser(description="Run API tests for DeliveryManager Sessions Controller.")
    parser.add_argument(
        '-v_test', '--verbose',
        action='store_true',
        help='Enable verbose output for API requests and responses (for custom printv). Use -v for unittest verbosity.'
    )
    
    # Use parse_known_args to let unittest.main handle its own arguments
    args, unknown_args = parser.parse_known_args()

    # Set environment variable for direct execution too
    if args.verbose:
        os.environ['API_TEST_VERBOSE'] = '1'
    else:
        os.environ['API_TEST_VERBOSE'] = '0'

    # 2. Reconstruct sys.argv for unittest.main, removing custom arguments
    sys.argv = [sys.argv[0]] + unknown_args

    # 3. Run unittest.main() with the modified argv
    unittest.main()