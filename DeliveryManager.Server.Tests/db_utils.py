import pyodbc
import os
import uuid
from datetime import datetime, timedelta

from utils import (
    printc, printv,
    COLOR_FAIL, COLOR_SUCCESS, COLOR_PRIMARY, COLOR_SECONDARY, COLOR_DEFAULT,
)

# --- Database Configuration ---
# IMPORTANT: Configure these for your *test* SQL Server instance and database.
# You can set these as environment variables or define them here.
# For production, consider using a configuration management system.
DB_SERVER = os.environ.get("DM_TEST_DB_SERVER", "localhost") # e.g., "your_sql_server_instance"
DB_NAME = os.environ.get("DM_TEST_DB_NAME", "TCSWEB") # <--- Your actual development database name

IMG_UPLOAD_DIR = os.path.join(os.getcwd(), "..", "DeliveryManager.Server", "wwwroot", "uploads")

# --- Connection Helper ---
def get_db_connection():
    """Establishes and returns a pyodbc connection to the test database."""
    conn_str = (
        f'DRIVER={{ODBC Driver 17 for SQL Server}};'
        f'SERVER={DB_SERVER};'
        f'DATABASE={DB_NAME};'
        'TRUSTED_CONNECTION=yes;' # Use this if you're using Windows Authentication
        # Or, for SQL Server Authentication:
        # 'UID=your_db_username;'
        # 'PWD=your_db_password;'
    )
    try:
        conn = pyodbc.connect(conn_str)
        return conn
    except pyodbc.Error as ex:
        sqlstate = ex.args[0]
        print(f"ERROR: Could not connect to database '{DB_NAME}' on server '{DB_SERVER}'.")
        print(f"SQLSTATE: {sqlstate} - Error: {ex.args[1]}")
        raise # Re-raise the exception to stop the test execution

# Helper to format values for SQL INSERT, handling NULLs and quoting strings
def sql_value(val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    
    escaped_val = str(val).replace("'", "''")
    return f"'{escaped_val}'"

# data insertion for a single user...
def insert_test_user(
        username, password, powerunit,
        companies, modules, permissions=None, verbose=False
):
    """
    Inserts a single test user into USERS
    """
    def safe_get(lst, index, fallback=None):
        return lst[index] if index < len(lst) else fallback
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # generate SQL query and set params...
    query = f"""
    INSERT INTO dbo.USERS (USERNAME, PASSWORD, PERMISSIONS, POWERUNIT,
    COMPANYKEY01, COMPANYKEY02, COMPANYKEY03, COMPANYKEY04, COMPANYKEY05,
    MODULE01, MODULE02, MODULE03, MODULE04, MODULE05,
    MODULE06, MODULE07, MODULE08, MODULE09, MODULE10)
    VALUES (
        {sql_value(username)}, {sql_value(password)}, {sql_value(permissions)}, {sql_value(powerunit)},
        {sql_value(safe_get(companies, 0))}, {sql_value(safe_get(companies, 1))}, {sql_value(safe_get(companies, 2))}, {sql_value(safe_get(companies, 3))}, {sql_value(safe_get(companies, 4))},
        {sql_value(safe_get(modules, 0))}, {sql_value(safe_get(modules, 1))}, {sql_value(safe_get(modules, 2))}, {sql_value(safe_get(modules, 3))}, {sql_value(safe_get(modules, 4))},
        {sql_value(safe_get(modules, 5))}, {sql_value(safe_get(modules, 6))}, {sql_value(safe_get(modules, 7))}, {sql_value(safe_get(modules, 8))}, {sql_value(safe_get(modules, 9))}
    );
    """
    try:
        printv(f"--- DB_UTIL: Inserting user: {username} (Powerunit: {powerunit})", verbose, COLOR_SECONDARY)
        printv(f"\n\tcredentials: {username}, {password}, {permissions}, {powerunit}, {companies}, {modules}", verbose)
        cursor.execute(query)
        conn.commit()
        printc(f"--- DB_UTIL: User '{username}' inserted successfully.", COLOR_DEFAULT)
    except Exception as e:
        conn.rollback()
        printc(f"--- DB_UTIL: Error inserting user '{username}': {e}", COLOR_FAIL)
        # Check for primary key violation specifically, as it's common in this scenario
        if "Violation of PRIMARY KEY constraint" in str(e):
            printc(f"--- DB_UTIL: User '{username}' likely already exists (Primary Key Violation).", COLOR_FAIL)
        raise
    finally:
        conn.close()

# data deletion for a single user...
def delete_test_user(usernames_to_delete, verbose=False):
    """
    Deletes a list of specific delivery manifest records from DMFSTDAT by MFSTKEY.
    """
    if not usernames_to_delete:
        printv("--- DB_UTIL: No specific manifests to delete. Skipping cleanup.", verbose, COLOR_SECONDARY)
        return

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Build the IN clause for the WHERE statement
        # Ensure proper quoting and escaping for each key
        quoted_usernames = [sql_value(username) for username in usernames_to_delete]
        keys_in_clause = ",".join(quoted_usernames)

        printv(f"--- DB_UTIL: Deleting specific users: {', '.join(usernames_to_delete)}", verbose)
        cursor.execute(f"DELETE FROM dbo.USERS WHERE USERNAME = ({keys_in_clause});")
        conn.commit()
        printc(f"--- DB_UTIL: Specified users deleted successfully.", COLOR_DEFAULT)
    except Exception as e:
        conn.rollback()
        printc(f"--- DB_UTIL: Error deleting specified users: {e}", COLOR_FAIL)
        raise
    finally:
        conn.close()
    

# --- Data Insertion for a Single Record ---
def insert_test_delivery_manifest(
    mfstkey, status='0', lastupdate=None, mfstnumber=None, powerunit="TESTPU", 
    stop=1, mfstdate=None, pronumber=None, prodate=None, shipname="Test Shipper", 
    consname="Test Consignee", consadd1="123 Test St", consadd2=None, 
    conscity="Denver", consstate="CO", conszip="80202", ttlpcs=1, ttlyds=1, 
    ttlwgt=1, dlvddate=None, dlvdtime=None, dlvdpcs=None, dlvdsign=None, 
    dlvdnote=None, dlvdimgfilelocn=None, dlvdimgfilesign=None, verbose=False
):
    """
    Inserts a single delivery manifest record into DMFSTDAT.
    Defaults are provided for convenience.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Generate default values if not provided
    if lastupdate is None:
        lastupdate = datetime.now().strftime("%Y%m%d%H%M%S")
    if mfstnumber is None:
        mfstnumber = mfstkey[:10] if len(mfstkey) >= 10 else mfstkey # Use part of mfstkey
    if mfstdate is None:
        mfstdate = datetime.now().strftime("%Y%m%d")
    if prodate is None:
        prodate = datetime.now().strftime("%Y%m%d")
    if dlvdnote is None:
        dlvdnote = "db_util default note"

    query = f"""
    INSERT INTO dbo.DMFSTDAT (MFSTKEY, STATUS, LASTUPDATE, MFSTNUMBER, POWERUNIT, STOP, MFSTDATE,
                              PRONUMBER, PRODATE, SHIPNAME, CONSNAME, CONSADD1, CONSADD2, CONSCITY,
                              CONSSTATE, CONSZIP, TTLPCS, TTLYDS, TTLWGT, DLVDDATE, DLVDTIME, DLVDPCS,
                              DLVDSIGN, DLVDNOTE, DLVDIMGFILELOCN, DLVDIMGFILESIGN)
    VALUES (
        {sql_value(mfstkey)}, {sql_value(status)}, {sql_value(lastupdate)}, {sql_value(mfstnumber)},
        {sql_value(powerunit)}, {sql_value(stop)}, {sql_value(mfstdate)}, {sql_value(pronumber)},
        {sql_value(prodate)}, {sql_value(shipname)}, {sql_value(consname)}, {sql_value(consadd1)},
        {sql_value(consadd2)}, {sql_value(conscity)}, {sql_value(consstate)}, {sql_value(conszip)},
        {sql_value(ttlpcs)}, {sql_value(ttlyds)}, {sql_value(ttlwgt)}, {sql_value(dlvddate)},
        {sql_value(dlvdtime)}, {sql_value(dlvdpcs)}, {sql_value(dlvdsign)}, {sql_value(dlvdnote)},
        {sql_value(dlvdimgfilelocn)}, {sql_value(dlvdimgfilesign)}
    );
    """
    try:
        printv(f"--- DB_UTIL: Inserting manifest: {mfstkey} (Powerunit: {powerunit}, Date: {mfstdate})", verbose)
        #printv(f"\n\tmfstkey: {mfstkey}, status: {status}, lastupdate:{lastupdate}, mfstnumber: {mfstnumber}", verbose)
        #printv(f"\tpowerunit: {powerunit}, stop: {stop}, mfstdate:{mfstdate}, pronumber: {pronumber}", verbose)
        cursor.execute(query)
        conn.commit()
        printc(f"--- DB_UTIL: Manifest '{mfstkey}' inserted successfully.", COLOR_SUCCESS)
    except Exception as e:
        conn.rollback()
        printc(f"--- DB_UTIL: Error inserting manifest '{mfstkey}': {e}", COLOR_FAIL)
        # Check for primary key violation specifically, as it's common in this scenario
        if "Violation of PRIMARY KEY constraint" in str(e):
            printc(f"--- DB_UTIL: Manifest '{mfstkey}' likely already exists (Primary Key Violation).", COLOR_FAIL)
        raise
    finally:
        conn.close()

# --- Data Cleanup (Specific Record Deletion) ---
def delete_test_delivery_manifests(mfst_keys_to_delete, verbose=False):
    """
    Deletes a list of specific delivery manifest records from DMFSTDAT by MFSTKEY.
    """
    if not mfst_keys_to_delete:
        printv("--- DB_UTIL: No specific manifests to delete. Skipping cleanup.", verbose)
        return

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Build the IN clause for the WHERE statement
        # Ensure proper quoting and escaping for each key
        quoted_keys = [sql_value(key) for key in mfst_keys_to_delete]
        keys_in_clause = ",".join(quoted_keys)

        printv(f"--- DB_UTIL: Deleting specific manifests: {', '.join(mfst_keys_to_delete)}", verbose)
        cursor.execute(f"DELETE FROM dbo.DMFSTDAT WHERE MFSTKEY IN ({keys_in_clause});")
        conn.commit()
        printc(f"--- DB_UTIL: Specified manifests deleted successfully.", COLOR_SUCCESS)
    except Exception as e:
        conn.rollback()
        printc(f"--- DB_UTIL: Error deleting specified manifests: {e}", COLOR_FAIL)
        raise
    finally:
        conn.close()

# --- Image File Management ---
def create_test_image_file(image_content_bytes, original_filename_with_ext="test_image.png"):
    """
    Creates a dummy image file in the configured upload directory.
    Returns the generated unique filename (e.g., 'guid.png').
    """
    if not os.path.exists(IMG_UPLOAD_DIR):
        os.makedirs(IMG_UPLOAD_DIR)
        print(f"--- DB_UTIL: Created image upload directory: {IMG_UPLOAD_DIR}")

    # Simulate C# ImageService's filename generation: Guid.NewGuid().ToString().Substring(0,23) + Path.GetExtension(imageFile.FileName)
    base_name = uuid.uuid4().hex[:23] + os.path.splitext(original_filename_with_ext)[1]
    file_path = os.path.join(IMG_UPLOAD_DIR, base_name)

    try:
        with open(file_path, 'wb') as f:
            f.write(image_content_bytes)
        print(f"--- DB_UTIL: Created test image file: {base_name}")
        return base_name
    except Exception as e:
        print(f"--- DB_UTIL: Error creating test image file '{base_name}': {e}")
        raise

def delete_test_image_file(file_name):
    """
    Deletes a specific test image file from the configured upload directory.
    """
    file_path = os.path.join(IMG_UPLOAD_DIR, file_name)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f"--- DB_UTIL: Deleted test image file: {file_name}")
        except Exception as e:
            print(f"--- DB_UTIL: Error deleting test image file '{file_name}': {e}")
            # Don't re-raise in cleanup unless critical, just log
    else:
        print(f"--- DB_UTIL: Test image file '{file_name}' not found for deletion (already gone?).")

# Example Usage (for direct execution of db_utils.py for manual testing)
if __name__ == "__main__":
    from datetime import timedelta
    try:
        print("Running example usage of db_utils.py (INSERT/DELETE only)...")
        
        # Define some example keys to insert
        test_key_1 = "EXAMPLE_TEMP_001"
        test_key_2 = "EXAMPLE_TEMP_002"

        # Insert a few test records
        today_db_format = datetime.now().strftime("%Y%m%d")

        insert_test_delivery_manifest(
            mfstkey=test_key_1, powerunit="EXPU01", mfstdate=today_db_format,
            consname="Example Customer A (Temp)"
        )
        insert_test_delivery_manifest(
            mfstkey=test_key_2, powerunit="EXPU02", mfstdate=today_db_format,
            consname="Example Customer B (Temp)", status='1'
        )
        
        print("\nExample temporary records inserted. You can check your database.")
        
        input("Press Enter to delete these temporary records...")

        # Clean up the specific records we just inserted
        delete_test_delivery_manifests([test_key_1, test_key_2])
        print("\nExample temporary records deleted.")

    except Exception as e:
        print(f"Example script failed: {e}")