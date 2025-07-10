import unittest
import requests
import json
import argparse
import sys
import os
import uuid
from datetime import datetime, timedelta

# Import utilities from the local utils.py
from utils import (
    COLOR_SUCCESS, COLOR_FAIL, COLOR_PRIMARY, COLOR_SECONDARY, COLOR_WARN,
    BASE_API_URL, DEV_USERNAME, DEV_PASSWORD, DEV_POWERUNIT, DEV_COMPANY,
    DEV_COMPANIES, DEV_MODULES,
    printc, printv, log_header, # logging helpers
    get_authenticated_session_delivery_manager, # session auth
    logout_via_api, dev_deliveryform_update
)

# Import database utilities from db_utils.py
from db_utils import (
    insert_test_user,
    delete_test_user,
    insert_test_delivery_manifest,
    delete_test_delivery_manifests,
    create_test_image_file,
    delete_test_image_file
)

# --- Test Data Constants (will be managed and created by setUpClass) ---
# Define the keys and power units that your tests will rely on.
# These will be inserted into the DB by setUpClass.
# Using unique IDs or timestamps is good practice to avoid conflicts
# if tests are run in parallel or if cleanup fails unexpectedly.
# For simplicity, we'll use fixed keys here, assuming cleanup is reliable.
TEST_POWERUNIT_HAS_MANIFESTS = "PYTEST01" # A powerunit specifically for Python tests
TEST_MFSTKEY_UNDELIVERED = "PYTESTUNDLV0" # Unique and recognizable key for an undelivered manifest
TEST_MFSTKEY_DELIVERED = "PYTESTDLV0"   # Unique and recognizable key for a delivered manifest
TEST_MFSTKEY_TO_BE_UPDATED = "UPDX07102500" # Key for a manifest that will be updated by a test
TEST_MFSTKEY_TO_CONFLICT = "CONX07102500"
TEST_MFSTKEY_TO_MISS = "NANX07102500"
TODAY_DB_FORMAT = datetime.now().strftime("%Y%m%d") 

# List to hold all MFSTKEYs created by setUpClass, so tearDownClass can clean them up
CREATED_TEST_USERNAMES = []
CREATED_TEST_MFST_KEYS = []
CREATED_TEST_IMAGE_FILES = []

# For scenarios where no manifests should be found
TEST_POWERUNIT_NO_MANIFESTS = "NOPUMANIFESTS"
# Use a date far in the past to ensure no accidental matches
TEST_MFSTDATE_NO_MANIFESTS = (datetime.now() - timedelta(days=99)).strftime("%Y-%m-%d")

# A tiny 1x1 transparent PNG image (actual bytes) for testing image upload/retrieval
# This is a valid PNG file, so your GetContentType should correctly identify it.
TINY_TEST_PNG_BYTES = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0cIDATx\xda\xed\xc1\x01\x01\x00\x00\x00\xc2\xa0\xf7Om\x00\x00\x00\x00IEND\xaeB`'
TEST_IMAGE_ORIGINAL_FILENAME = "test_signature.png" # The filename to pass to create_test_image_file

# --- API HELPER FUNCTIONS FOR DELIVERIES CONTROLLER ---

def validate_and_assign_manifest_api(session, payload, verbose=False):
    """Helper to call POST /v1/deliveries/validate-and-assign."""
    url = f"{BASE_API_URL}/deliveries/validate-and-assign"
    printv(f"  > POST {url} - Validate and Assign Manifest with: \n\t{payload}", verbose)

    response = session.post(url, json=payload, verify=False)
    printv(f"  < Status: {response.status_code}", verbose)
    try:
        printv(f"  < Response: {json.dumps(response.json(), indent=2)}", verbose)
    except json.JSONDecodeError:
        if response.text:
            printv(f"  < Response (text): {response.text}", verbose)

    return response

def get_deliveries_api(session, powerunit, mfstdate, verbose=False):
    """Helper to call GET /v1/deliveries."""
    url = f"{BASE_API_URL}/deliveries"
    params = {
        "powerunit": powerunit,
        "mfstdate": mfstdate
    }
    printv(f"  > GET {url} - Get Deliveries with params {params}", verbose)
    response = session.get(url, params=params, verify=False)
    printv(f"  < Status: {response.status_code}", verbose)
    try:
        printv(f"  < Response: {json.dumps(response.json(), indent=2)}", verbose)
    except json.JSONDecodeError:
        if response.text:
            printv(f"  < Response (text): {response.text}", verbose)
    return response

def update_delivery_api(session, mfstkey, delivery_data, verbose=False, files=None):
    """Helper to call PUT /v1/deliveries/{MFSTKEY} with form data."""
    url = f"{BASE_API_URL}/deliveries/{mfstkey}"
    printv(f"  > PUT {url} - Update Delivery for MFSTKEY {mfstkey} with data {delivery_data}", verbose)
    response = session.put(url, data=delivery_data, verify=False)
    printv(f"  < Status: {response.status_code}", verbose)
    try:
        printv(f"  < Response: {json.dumps(response.json(), indent=2)}", verbose)
    except json.JSONDecodeError:
        if response.text:
            printv(f"  < Response (text): {response.text}", verbose)
    return response

def get_image_api(session, file_name, verbose=False):
    """Helper to call GET /v1/deliveries/image/{fileName}."""
    url = f"{BASE_API_URL}/deliveries/image/{file_name}"
    printv(f"  > GET {url} - Get Image for fileName {file_name}", verbose)
    response = session.get(url, verify=False)
    printv(f"  < Status: {response.status_code}", verbose)
    return response

# --- unittest.TestCase Class ---

class DeliveriesApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """
        Runs once before all tests in this class.
        Inserts specific test manifests into the database using db_utils.
        """
        #printc("\n--- Setting up test data in database for DeliveriesApiTests ---", COLOR_PRIMARY)
        log_header("Setting up test data in database for DeliveriesApiTests")
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

            # Insert specific test manifests that our tests will use
            # Add each MFSTKEY to the list for cleanup
            for i in range(1,3):
                mfstkey = TEST_MFSTKEY_UNDELIVERED+str(i)
                insert_test_delivery_manifest(
                    mfstkey=mfstkey,
                    powerunit=DEV_POWERUNIT, 
                    mfstdate=TODAY_DB_FORMAT, # Use DB format for insertion
                    status='0', # Undelivered
                    consname="HOMEDEPOT.COM",
                    stop=i,
                    verbose=verbose
                )
                CREATED_TEST_MFST_KEYS.append(mfstkey)

            for i in range(1,3):
                mfstkey=TEST_MFSTKEY_DELIVERED+str(i)
                insert_test_delivery_manifest(
                    mfstkey=mfstkey, 
                    powerunit=DEV_POWERUNIT, 
                    mfstdate=TODAY_DB_FORMAT, # Use DB format for insertion
                    status='1', # Delivered
                    dlvddate=TODAY_DB_FORMAT,
                    dlvdtime="1200",
                    dlvdsign="Test Signature Automate",
                    consname="HOMEDEPOT.COM",
                    stop=i,
                    verbose=verbose
                )
                CREATED_TEST_MFST_KEYS.append(mfstkey)

            # A manifest specifically for the update test. Initially undelivered.
            for i in range(1,3):
                mfstkey = TEST_MFSTKEY_TO_BE_UPDATED+str(i)
                insert_test_delivery_manifest(
                    mfstkey=mfstkey, 
                    powerunit=DEV_POWERUNIT, # Can use same powerunit
                    mfstdate=TODAY_DB_FORMAT,
                    status='0', # Undelivered initially
                    consname="HOMEDEPOT.COM",
                    stop=i,
                    verbose=verbose
                )
                CREATED_TEST_MFST_KEYS.append(mfstkey)

            # Create a test image file and store its generated name
            cls.GENERATED_TEST_IMAGE_FILENAME = create_test_image_file(TINY_TEST_PNG_BYTES, TEST_IMAGE_ORIGINAL_FILENAME)
            CREATED_TEST_IMAGE_FILES.append(cls.GENERATED_TEST_IMAGE_FILENAME)
            
            printc("Test data setup complete", COLOR_SUCCESS)
            #printc("\n--- Beginning DeliveriesApiTests ---", COLOR_PRIMARY)
            log_header("Beginning DeliveriesApiTests")
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
        #printc("\n--- Cleaning up test data in database for DeliveriesApiTests ---", COLOR_PRIMARY)
        log_header("Cleaning up test data in database for DeliveriesApiTests")
        try:
            # Delete only the specific records that were inserted for this test class
            delete_test_user(CREATED_TEST_USERNAMES)
            delete_test_delivery_manifests(CREATED_TEST_MFST_KEYS) 

            # delete all image files created...
            for filename in CREATED_TEST_IMAGE_FILES:
                delete_test_image_file(filename)

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

        # Authenticate for each test to ensure a clean session
        self.session = get_authenticated_session_delivery_manager(
            username=DEV_USERNAME, 
            company=DEV_COMPANY, 
            verbose=self.verbose
        )
        if not self.session:
            self.skipTest("Setup failed: Could not get authenticated session for DEV user.")

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

    # --- Test Cases for POST /v1/deliveries/validate-and-assign ---
    # Test 1: Validate MFSTDATE and assign POWERUNIT (Success) 
    def test_1_validate_and_assign_success(self):
        printv(f"\n--- Test 1: Validate and Assign (Success) ---", self.verbose, COLOR_SECONDARY)
        # generate payload...
        payload = {
            "USERNAME": DEV_USERNAME,
            "POWERUNIT": DEV_POWERUNIT,
            "MFSTDATE": TODAY_DB_FORMAT
        }

        # attempt to validate delivery manifest...
        printv(f"\n--- Attempting Validate and Assign (200 Success) ---", self.verbose, COLOR_SECONDARY)
        response = validate_and_assign_manifest_api(self.session, payload, self.verbose)
        self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}. Response: {response.text}")

        response_json = response.json()
        self.assertIn("message", response_json)
        self.assertEqual("Valid date/powerunit combination was found.", response_json["message"])

        self.assertIn("manifest", response_json)
        self.assertIsNotNone(response_json["manifest"])
        self.assertEqual(response_json["manifest"]["POWERUNIT"], DEV_POWERUNIT)

        printc("Test Validate and Assign (Success) PASSED.", COLOR_SUCCESS)

    # Test 2: Validate and Assign Valid but Unauthorized (Unauthorized)
    def test_2_validate_and_assign_unauthorized(self):
        printv(f"\n--- Attempting Validate and Assign (401 Unauthorized) ---", self.verbose, COLOR_SECONDARY)
        # generate payload...
        payload = {
            "USERNAME": DEV_USERNAME,
            "POWERUNIT": TEST_POWERUNIT_HAS_MANIFESTS,
            "MFSTDATE": TODAY_DB_FORMAT 
        }

        session_no_auth = requests.Session()

        # attempt to validate delivery manifest...
        response = validate_and_assign_manifest_api(session_no_auth, payload, self.verbose)
        self.assertEqual(response.status_code, 401, f"Expected 401 Unauthorized, got {response.status_code}. Response: {response.text}")

        printc("Test Validate and Assign (Unauthorized) PASSED.", COLOR_SUCCESS)
    
    # Test 3: Validate and Assign Missing Fields (Bad Request)
    def test_3_validate_and_assign_bad_request_missing_fields(self):
        # generate payload...
        payload = { # Missing POWERUNIT and MFSTDATE
            "USERNAME": DEV_USERNAME
        }

        # attempt to validate delivery manifest...
        printv(f"\n--- Attempting Validate and Assign (400 Bad Request - Missing Fields) ---", self.verbose, COLOR_SECONDARY)
        response = validate_and_assign_manifest_api(self.session, payload, self.verbose)
        self.assertEqual(response.status_code, 400, f"Expected 400 Bad Request, got {response.status_code}. Response: {response.text}")
        #printc(f"response: {response}", COLOR_FAIL)

        response_json = response.json()
        #printc(f"response_json: {response_json}", COLOR_FAIL)
        self.assertIn("POWERUNIT", response_json["errors"], "Expected POWERUNIT error in bad request")
        self.assertIn("MFSTDATE", response_json["errors"], "Expected MFSTDATE error in bad request")

        printc("Test Validate and Assign (Bad Request - Missing Fields) PASSED.", COLOR_SUCCESS)
    
    # Test 4: Validate and Assign No Data (Not Found)
    def test_4_validate_and_assign_no_manifest_found(self):
        # generate payload...
        payload = {
            "USERNAME": DEV_USERNAME,
            "POWERUNIT": "-1",
            "MFSTDATE": TODAY_DB_FORMAT
        }

        printv(f"\n--- Attempting Validate and Assign (404 Not Found) ---", self.verbose, COLOR_SECONDARY)
        response = validate_and_assign_manifest_api(
            self.session, 
            payload,
            self.verbose
        )
        self.assertEqual(response.status_code, 404, f"Expected 404 Not Found, got {response.status_code}. Response: {response.text}")
        #printc(f"response: {response}", COLOR_FAIL)

        response_json = response.json()
        #printc(f"response_json: {response_json}", COLOR_FAIL)
        self.assertIn("message", response_json)
        self.assertIn("No matching delivery manifests found", response_json["message"])
        
        printc("Test Validate and Assign (No Manifest Found) PASSED.", COLOR_SUCCESS)
    
    # --- Test Cases for GET /v1/deliveries ---
    # Test 5: Get Deliveries w/ Valid Deliveries (Success)
    def test_5_get_deliveries_success_with_data(self):
        # generate payload...
        payload = {
            "POWERUNIT": DEV_POWERUNIT,
            "MFSTDATE": TODAY_DB_FORMAT
        }

        printv(f"\n--- Attempting Get Deliveries (200 Success w/ Data) ---", self.verbose, COLOR_SECONDARY)
        response = get_deliveries_api(
            self.session, 
            DEV_POWERUNIT,
            TODAY_DB_FORMAT,
            self.verbose
        )
        self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}. Response: {response.text}")
        #printc(f"response: {response}", COLOR_FAIL)

        response_json = response.json()
        #printc(f"response_json: {response_json}", COLOR_FAIL)
        self.assertIn("Undelivered", response_json)
        self.assertIsInstance(response_json["Undelivered"], list)
        self.assertGreater(len(response_json["Undelivered"]), 0, "Undelivered list cannot be empty.")

        self.assertIn("Delivered", response_json)
        self.assertIsInstance(response_json["Delivered"], list)
        self.assertGreater(len(response_json["Delivered"]), 0, "Delivered list cannot be empty.")

        printc("Test Get Deliveries (Success with Data) PASSED.", COLOR_SUCCESS)
    
    # Test 6: Get Deliveries w/ No Deliveries (Success)
    def test_6_get_deliveries_success_no_data(self):
        # generate payload...
        payload = {
            "POWERUNIT": "-1", # A powerunit known to have no manifests
            "MFSTDATE": TEST_MFSTDATE_NO_MANIFESTS # A date known to have no manifests
        }

        printv(f"\n--- Attempting Get Deliveries (200 Success w/o Data) ---", self.verbose, COLOR_SECONDARY)
        response = get_deliveries_api(
            self.session, 
            "-1",
            TEST_MFSTDATE_NO_MANIFESTS,
            self.verbose
        )
        self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}. Response: {response.text}")
        #printc(f"response: {response}", COLOR_FAIL)

        response_json = response.json()
        #printc(f"response_json: {response_json}", COLOR_FAIL)
        
        # assert delivery lists are empty...
        self.assertEqual(len(response_json["Undelivered"]), 0, "Expected empty undelivered list")
        self.assertEqual(len(response_json["Delivered"]), 0, "Expected empty delivered list")
        self.assertIn("No valid records were found.", response_json["Message"])

        printc("Test Get Deliveries (Success - No Data) PASSED.", COLOR_SUCCESS)
    
    # Test 7: Get Deliveries w/o Authorization (Unauthorized)
    def test_7_get_deliveries_unauthorized(self):
        printv(f"\n--- Attempting Get Deliveries (401 Unauthorized) ---", self.verbose, COLOR_SECONDARY)
        # start with clean session (ie: no authorization)...
        session_no_auth = requests.Session()

        response = get_deliveries_api(
            session_no_auth, 
            DEV_POWERUNIT, 
            TODAY_DB_FORMAT, 
            self.verbose
        )
        #printc(f"response: {response}", COLOR_FAIL)

        self.assertEqual(response.status_code, 401, f"Expected 401 Unauthorized, got {response.status_code}. Response: {response.text}")
        printc("Test Get Deliveries (Unauthorized) PASSED.", COLOR_SUCCESS)
    
    # Test 8: Get Deliveries w/ Invalid Params (Bad Request)
    def test_8_get_deliveries_bad_request_missing_params(self):
        url = f"{BASE_API_URL}/deliveries"
        
        # Test missing powerunit
        printv(f"\n--- Attempting Get Deliveries (400 Bad Request - Missing Powerunit) ---", self.verbose, COLOR_SECONDARY)
        printv(f"  > GET {url} - Get Deliveries with mfstdate: {TODAY_DB_FORMAT}, no powerunit", self.verbose)
        response_missing_pu = self.session.get(url, params={"mfstdate": TODAY_DB_FORMAT}, verify=False)
        printv(f"  < Status: {response_missing_pu.status_code}", self.verbose)
        try:
            printv(f"  < Response: {json.dumps(response_missing_pu.json(), indent=2)}", self.verbose)
        except json.JSONDecodeError:
            if response_missing_pu.text:
                printv(f"  < Response (text): {response_missing_pu.text}", self.verbose)
        self.assertEqual(response_missing_pu.status_code, 400, f"Expected 400 for missing powerunit, got {response_missing_pu.status_code}. Response: {response_missing_pu.text}")
        
        # Test missing mfstdate
        printv(f"\n--- Attempting Get Deliveries (400 Bad Request - Missing MFSTDate) ---", self.verbose, COLOR_SECONDARY)
        printv(f"  > GET {url} - Get Deliveries with powerunit: { DEV_POWERUNIT}, no mfstdate", self.verbose)
        response_missing_date = self.session.get(url, params={"powerunit": DEV_POWERUNIT}, verify=False)
        printv(f"  < Status: {response_missing_date.status_code}", self.verbose)

        try:
            printv(f"  < Response: {json.dumps(response_missing_date.json(), indent=2)}", self.verbose)
        except json.JSONDecodeError:
            if response_missing_date.text:
                printv(f"  < Response (text): {response_missing_date.text}", self.verbose)
        self.assertEqual(response_missing_date.status_code, 400, f"Expected 400 for missing mfstdate, got {response_missing_date.status_code}. Response: {response_missing_date.text}")
        
        printc("Test Get Deliveries (Bad Request - Missing Params) PASSED.", COLOR_SUCCESS)
    
    # --- Test Cases for PUT /v1/deliveries/{MFSTKEY} ---
    # Test 9: Update Existing Delivery w/ Valid Data (Success)
    def test_9_update_delivery_success(self):        
        printv(f"\n--- Attempting Update Delivery (Success) ---", self.verbose, COLOR_SECONDARY)

        # generate delivery update data...
        update_data = dev_deliveryform_update(TEST_MFSTKEY_TO_BE_UPDATED, 1, TODAY_DB_FORMAT)
        response = update_delivery_api(
            self.session, 
            update_data["MFSTKEY"], 
            update_data, 
            self.verbose
        )
        self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}. Response: {response.text}")

        # assert delivery update success message...
        response_json = response.json()
        self.assertIn("message", response_json)
        self.assertEqual(response_json["message"], "Delivery updated successfully.")

        # fetch updated user to confirm update...
        printv(f"\n--- Attempting Get the Updated Delivery ---", self.verbose, COLOR_SECONDARY)
        get_response = get_deliveries_api(
            self.session, 
            DEV_POWERUNIT,
            TEST_MFSTKEY_TO_BE_UPDATED[4:7],
            self.verbose
        )
        self.assertEqual(get_response.status_code, 200, f"Expected 200 OK, got {get_response.status_code}. Response: {get_response.text}")
        get_response_json = get_response.json()
        self.assertIn("Delivered", get_response_json)
        self.assertIn("DLVDNOTE", get_response_json["Delivered"][0])
        self.assertEqual("internal update test", get_response_json["Delivered"][0]["DLVDNOTE"])

        printc("Test Update Delivery (Success) PASSED.", COLOR_SUCCESS)
    
    # Test 10: Update Delivery w/o Auth (Unauthorized)
    def test_10_update_delivery_unauthorized(self):
        printv(f"\n--- Attempting Update Delivery (Unauthorized) ---", self.verbose, COLOR_SECONDARY)
        session_no_auth = requests.Session()
        update_data = dev_deliveryform_update(TEST_MFSTKEY_TO_BE_UPDATED, 1, TODAY_DB_FORMAT)
        response = update_delivery_api(
            session_no_auth, 
            update_data["MFSTKEY"], 
            update_data, 
            self.verbose
        )
        self.assertEqual(response.status_code, 401, f"Expected 401 Unauthorized, got {response.status_code}. Response: {response.text}")
        printc("Test Update Delivery (Unauthorized) PASSED.", COLOR_SUCCESS)
    
    # Test 11: Update Delivery MFSTKEY Mismatch (Bad Request)
    def test_11_update_delivery_mfstkey_mismatch(self):
        printv(f"\n--- Attempting Update Delivery (MFSTKEY Mismatch) ---", self.verbose, COLOR_SECONDARY)
        url = f"{BASE_API_URL}/deliveries/{TEST_MFSTKEY_TO_CONFLICT}"
        update_data = dev_deliveryform_update(TEST_MFSTKEY_TO_BE_UPDATED, 1, TODAY_DB_FORMAT)

        # manually put to mismatched URL...
        printv(f"  > PUT {url} <--[conflict] - Update Delivery for MFSTKEY {TEST_MFSTKEY_TO_BE_UPDATED} with data {update_data}", self.verbose)
        response = self.session.put(url, data=update_data, verify=False)
        printv(f"  < Status: {response.status_code}", self.verbose)
        try:
            printv(f"  < Response: {json.dumps(response.json(), indent=2)}", self.verbose)
        except json.JSONDecodeError:
            if response.text:
                printv(f"  < Response (text): {response.text}", self.verbose)
        self.assertEqual(response.status_code, 400, f"Expected 400 Bad Request, got {response.status_code}. Response: {response.text}")

        # assert appropriate response message...
        response_json = response.json()
        self.assertIn("message", response_json)
        self.assertIn("MFSTKEY in URL must match MFSTKEY in request body.", response_json["message"])

        printc("Test Update Delivery (MFSTKEY Mismatch) PASSED.", COLOR_SUCCESS)

    def test_12_update_delivery_not_found(self):
        printv(f"\n--- Attempting Update Delivery (Not Found) ---", self.verbose, COLOR_SECONDARY)
        update_data = dev_deliveryform_update(TEST_MFSTKEY_TO_MISS, 1, TODAY_DB_FORMAT)

        response = update_delivery_api(
            self.session,
            update_data["MFSTKEY"],
            update_data,
            self.verbose
        )
        self.assertEqual(response.status_code, 500, f"Expected 500 Internal Server Error (or 404 if backend changes), got {response.status_code}. Response: {response.text}")
        printc("Test Update Delivery (Not Found/Service Failed) PASSED.", COLOR_SUCCESS)
    
    # --- Test Cases for GET /v1/deliveries/image/{fileName} ---
    # Test 13: Get Image w/ Valid Request (Success)
    def test_13_get_image_success(self):
        printv(f"\n--- Attempting Get Image (Success) ---", self.verbose, COLOR_SECONDARY)
        response = get_image_api(self.session, self.GENERATED_TEST_IMAGE_FILENAME, self.verbose)
        self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}. Response: {response.text}")

        self.assertIn(response.headers['Content-Type'], ['image/jpeg', 'image/png', 'application/octet-stream'], "Expected image content type")
        self.assertGreater(len(response.content), 0, "Expected image content to be non-empty")

        printc("Test Get Image (Success) PASSED.", COLOR_SUCCESS)
    
    # Test 14: Get Image w/o Auth (Unauthorized)
    def test_14_get_image_unauthorized(self):
        # start with clean session...
        session_no_auth = requests.Session()

        # attempt to fetch without auth...
        printv(f"\n--- Attempting Get Image (Unauthorized) ---", self.verbose, COLOR_SECONDARY)
        response = get_image_api(session_no_auth, self.GENERATED_TEST_IMAGE_FILENAME, self.verbose)
        self.assertEqual(response.status_code, 401, f"Expected 401 Unauthorized, got {response.status_code}. Response: {response.text}")

        printc("Test Get Image (Unauthorized) PASSED.", COLOR_SUCCESS)
    
    # Test 15: Get Non-Existent Image (Not Found)
    def test_15_get_image_not_found(self):
        # attempt to fetch non-existing image...
        printv(f"\n--- Attempting Get Image (Not Found) ---", self.verbose, COLOR_SECONDARY)
        response = get_image_api(self.session, "nonexistent_image.jpg", self.verbose)
        self.assertEqual(response.status_code, 404, f"Expected 404 Not Found, got {response.status_code}. Response: {response.text}")

        printc("Test Get Image (Not Found) PASSED.", COLOR_SUCCESS)
    
    # Test 16: Get Invalid Filename Image (Bad Request)
    # end point does not accept this...
    '''def test_16_get_image_bad_request_empty_filename(self):
        printv(f"\n--- Attempting Get Image (Bad Request - Empty Filename) ---", self.verbose, COLOR_SECONDARY)
        response = get_image_api(self.session, "", self.verbose)
        self.assertEqual(response.status_code, 400, f"Expected 400 Bad Request, got {response.status_code}. Response: {response.text}")
        printc("Test Get Image (Bad Request - Empty Filename) PASSED.", COLOR_SUCCESS)'''

# --- MAIN EXECUTION BLOCK ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run API tests for DeliveryManager Deliveries Controller.")
    parser.add_argument(
        '-v_test', '--verbose',
        action='store_true',
        help='Enable verbose output for API requests and responses (for custom printv). Use -v for unittest verbosity.'
    )
    
    args, unknown_args = parser.parse_known_args()

    if args.verbose:
        os.environ['API_TEST_VERBOSE'] = '1'
    else:
        os.environ['API_TEST_VERBOSE'] = '0'

    sys.argv = [sys.argv[0]] + unknown_args

    unittest.main()