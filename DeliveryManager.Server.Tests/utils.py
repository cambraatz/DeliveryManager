import requests
import json
import uuid
import urllib3
import urllib.parse # For unquoting cookie values
from datetime import datetime, timedelta

# Suppress the InsecureRequestWarning that comes with verify=False
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Define colors for console output
COLOR_DEFAULT = "\033[0m"
COLOR_SUCCESS = "\033[92m" # Green
COLOR_FAIL = "\033[91m"    # Red
COLOR_PRIMARY = "\033[93m" # Yellow
COLOR_SECONDARY = "\033[36m" # Cyan
COLOR_WARN = "\033[95m"    # Magenta

# --- CONFIGURATION ---
BASE_API_URL = "https://localhost:7200/v1"
SESSION_USERNAME = "cbraatz"

unique_id = uuid.uuid4().hex[:8]
DEV_USERNAME = f"testUser_{unique_id}"
DEV_PASSWORD = "password"
DEV_POWERUNIT = f"{unique_id[:3]}"
DEV_COMPANIES = ["BRAUNS", "NTS"]
DEV_MODULES = ["admin", "deliverymanager"]

DEV_COMPANY = "TCS" # Default company for dev login
DEV_COMPANY_NAME = "Brauns Express Inc"

def dev_deliveryform_update(mfstkey, stop, dlvddate):
    unique_id = uuid.uuid4().hex[:8]
    i = 1
    return {
        "MFSTKEY": mfstkey + str(stop),
        "STATUS": "1",
        "LASTUPDATE": datetime.now().strftime("%Y%m%d%H%M%S"),
        "MFSTNUMBER": mfstkey[:10],
        "POWERUNIT": DEV_POWERUNIT,
        "STOP": str(i),
        "MFSTDATE": mfstkey[4:7],
        "PRONUMBER": unique_id,
        "PRODATE": mfstkey[4:7],
        "SHIPNAME":"STANTON CARPET",
        "CONSNAME": "ACE FLOORING DISTRIBUTORS INC",
        "CONSADD1": "HOMEDEPOT.COM",
        "CONSADD2": "9 CRANFORD DR",
        "CONSCITY": "NEW CITY",
        "CONSSTATE": "CO",
        "CONSZIP": "80209",
        "TTLPCS": 3,
        "TTLYDS": 333,
        "TTLWGT": 999,
        "DLVDDATE": dlvddate,
        "DLVDTIME": "1200",
        "DLVDPCS": 3,
        "DLVDSIGN": "",
        "DLVDNOTE": "internal update test",
        "DLVDIMGFILELOCN": "",
        "DLVDIMGFILESIGN": "",
        "signature_string": "",
        "location_string": ""
    }

def printc(message, color=COLOR_DEFAULT):
    """Prints a message with the specified color."""
    print(f"{color}{message}{COLOR_DEFAULT}")

def printv(message, verbose=False, color=COLOR_DEFAULT):
    """Prints a message only if verbose is True."""
    if verbose:
        printc(message, color)

def log_header(message):
    formatted = f"--- {message} ---"
    printc("\n" + len(formatted)*"-", COLOR_PRIMARY)
    printc(f"{formatted}", COLOR_PRIMARY)
    printc(len(formatted)*"-", COLOR_PRIMARY)

def get_authenticated_session_delivery_manager(username, company, verbose=False):
    """
    Authenticates with the DeliveryManager.Server's dev-login endpoint
    and returns a requests.Session object with authentication cookies.
    """
    session = requests.Session()
    session.cookies.clear() # Start with a clean slate

    dev_login_url = f"{BASE_API_URL}/sessions/dev-login?username={username}&company={company}"
    printv(f"\n--- Attempting dev-login to: {dev_login_url} ---", verbose, COLOR_SECONDARY)

    try:
        # The dev-login endpoint returns a 302 Redirect. requests.Session handles this automatically
        # by default, but we'll explicitly allow it. The important part is that the cookies
        # are set in the response headers of the initial 302 or the final 200.
        printv(f"  > GET {dev_login_url} - Dev Login Valid session", verbose)
        response = session.get(dev_login_url, verify=False, allow_redirects=True)
        printv(f"  < Status: {response.status_code}", verbose)
        #printv(f"Dev-login response status after redirects: {response.status_code}", verbose)

        # After a successful dev-login, the session should have the access_token cookie.
        if session.cookies.get("access_token"):
            printv("Successfully authenticated session via dev-login.", verbose, COLOR_SUCCESS)
            return session
        else:
            # If access_token cookie is not found, it's a failure.
            # Log response text for debugging if available.
            error_message = f"Dev-login failed. No access_token cookie found. Status: {response.status_code}"
            if response.text:
                try:
                    error_json = response.json()
                    error_message += f", Response: {json.dumps(error_json, indent=2)}"
                except json.JSONDecodeError:
                    error_message += f", Response (text): {response.text}"
            printv(error_message, verbose, COLOR_FAIL)
            return None
    except requests.exceptions.RequestException as e:
        printc(f"Error during dev-login: {e}", COLOR_FAIL)
        return None
    
def logout_via_api(session, verbose=False):
    """Helper to call POST /v1/sessions/logout and return the response."""
    url = f"{BASE_API_URL}/sessions/logout"
    printv(f"  > POST {url} - Logging out current session", verbose)
    response = session.post(url, verify=False) # Logout doesn't need a body
    printv(f"  < Status: {response.status_code}", verbose)
    try:
        printv(f"  < Response: {json.dumps(response.json(), indent=2)}", verbose)
    except json.JSONDecodeError:
        if response.text:
            printv(f"  < Response (text): {response.text}", verbose)
    return response