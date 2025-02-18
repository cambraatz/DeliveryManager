import pyodbc

# connect to SQL server...
#
#conn = pyodbc.connect('Data Source=Lenovo_CB;Initial Catalog=TCSWEB;Integrated Security=True')
conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};'
                      'SERVER=localhost;'
                      'DATABASE=TCSWEB;'
                      'TRUSTED_CONNECTION=yes;')

# create cursor object...
cursor = conn.cursor()

cursor.execute("DROP TABLE COMPANY")

# create an SQL table...
cursor.execute('''CREATE TABLE COMPANY (COMPANYKEY VARCHAR(10) PRIMARY KEY,COMPANYNAME VARCHAR(50),[DATABASE] VARCHAR(10))''')

users = {
    "COMPANY01": ["BRAUNS","Brauns Express Inc"],
    "COMPANY02": ["NTS","Normandin Trucking Services"],
    "COMPANY03": ["TCSWEB","Transportaion Computer Support, LLC"]
}

for key,value in users.items():
    query = "INSERT INTO dbo.COMPANY(COMPANYKEY,COMPANYNAME) VALUES (?,?);"

    # Prepare parameters
    params = (value[0], value[1])

    print(f"{key}: {value[1]} (DB: {value[0]})")
    cursor.execute(query,params)

# commit changes...
conn.commit()

# close connection...
conn.close()