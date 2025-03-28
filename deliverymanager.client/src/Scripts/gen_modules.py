#!/usr/bin/env python3
import pyodbc

# initialize connection params...
ip = "192.168.1.33,1433"
username = "SA"
password = "Sql2023!"
db = "TCSWEB"

# establish connection to SQL server...
conn = pyodbc.connect(
    f'DRIVER={{ODBC Driver 17 for SQL Server}};'
    f'SERVER={ip}'
    f'DATABASE={db}'
    f'UID={username}'
    f'PWD={password}'
)

# create cursor object...
cursor = conn.cursor()

# generate and run the query...
cursor.execute('DROP TABLE MODULE')
cursor.execute('''CREATE TABLE MODULE (MODULEKEY VARCHAR(20) PRIMARY KEY,MODULENAME VARCHAR(30)''')

modules = {
    "admin": "Administrative Portal",
    "deliverymanager": "Delivery Manager",
    "warehouse": "Warehouse App",
}

for key,value in modules.items():
    query = "INSERT INTO dbo.MODULE(MODULEKEY,MODULENAME) VALUES (?,?);"
    print(f'Adding module URL: {key} for the {value} microservice')
    cursor.execute(query,key,value)

conn.commit()

conn.close()