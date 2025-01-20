import pyodbc
import csv

# connect to SQL server...
#
#conn = pyodbc.connect('Data Source=Lenovo_CB;Initial Catalog=TCSWEB;Integrated Security=True')
conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};'
                      'SERVER=localhost;'
                      'DATABASE=TCSWEB;'
                      'TRUSTED_CONNECTION=yes;')

# create cursor object...
cursor = conn.cursor()

# create an SQL table...
cursor.execute('''CREATE TABLE USERS (USERNAME VARCHAR(30) PRIMARY KEY,
               PASSWORD VARCHAR(30),
               PERMISSIONS VARCHAR(10),
               POWERUNIT VARCHAR(10),
               COMPANYKEY01 VARCHAR(10),
               COMPANYKEY02 VARCHAR(10),
               COMPANYKEY03 VARCHAR(10),
               COMPANYKEY04 VARCHAR(10),
               COMPANYKEY05 VARCHAR(10),
               MODULE01 VARCHAR(10),
               MODULE02 VARCHAR(10),
               MODULE03 VARCHAR(10),
               MODULE04 VARCHAR(10),
               MODULE05 VARCHAR(10),
               MODULE06 VARCHAR(10),
               MODULE07 VARCHAR(10),
               MODULE08 VARCHAR(10),
               MODULE09 VARCHAR(10),
               MODULE10 VARCHAR(10))''')

# generate query string...
#
# open CSV file...
with open('dmfstdat.csv','r') as f:
    reader = csv.reader(f)

    # skip headers, maintain just in case...
    headers = next(reader)

    # skip buffer...
    next(reader)

    # initialize int columns...
    int_col = [5,16,17,18,21]
    
    # iterate each CSV row and build query string from contents...
    for row in reader:
        col_index = 0
        query = "("
        for col in row:
            # column is INT data...
            if col_index in int_col:
                query += row[col_index].strip()

            # column is NULL data...
            elif row[col_index].strip() == "NULL":
                query += row[col_index].strip()
            
            # column is empty...
            elif len(row[col_index].strip()) == 0:
                query += "NULL"

            # column is VARCHAR/Non-NULL data...
            else:
                query += "'" + row[col_index].strip() + "'"

            if col_index < len(row)-1:
                query += ","

            col_index += 1
            
        # end row query line...
        query += ");"

        # insert data into table...
        cursor.execute('INSERT INTO dbo.DMFSTDAT VALUES' + query)

# close CSV file...
f.close()

# insert data manually or as group (limit of 1000 row entries)...
#
#cursor.execute('INSERT INTO dbo.DMFSTDAT values' + query)
'''
cursor.execute(INSERT INTO dbo.DMFSTDAT values('045X021624001','0','20240201123000','045X021624',
               '045',1,'02162024','41750686','02152024','DOOLITTLE CARPET & PAINT','MOHAWK WHSE/MENDOTA HEIGHTS',
               '2359 WATERS DRIVE',NULL,'MENDOTA HEIGHTS','MN','55120',NULL,NULL,NULL,NULL,NULL,NULL,
               NULL,NULL,NULL,NULL))
'''

# commit changes...
conn.commit()

# close connection...
conn.close()