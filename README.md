﻿# Delivery Manager
This application was developed for a trucking logistics company looking for a solution for tracking driver/delivery information on a personal device. This application allows drivers to edit and maintain their personal driver logs from the convenience of their personal phone or device. 

This prevents the need to leave the cab and manually log the data with an on-dock computer, thus streamlining the logging process and enabling drivers to adjust their records anywhere and anytime.

## Basic Functionality
The following screenshots log an example of the application's workflow. Beginning with log-in credentials and delivery log validation, the application allows a driver to access their personal logs using their personal credentials while providing flexibility for accessing delivery information from previous dates and power units.

Verification is performed through an API which provides access to delivery information only when the provided delivery information is both valid and belonging to the corresponding driver.

### Login Credentials
The user is prompted to add valid credentials that are validated according to current database records. 

![Login Credentials](README_Assets/DriverApp_1.png)<br>*Figure 1.1: Login Credentials*

New drivers are assumed to be logged at the time of hiring, prior to interacting with this application, though the link below will connect the driver to the necessary party to amend the database accordingly.

### Delivery Verification
Once the user credentials are validated, a popup window prompts the driver to confirm the **delivery date** and **power unit** (truck ID) to query. 

The current date is assumed as most work through the application will be done same day, while the power unit is assumed to be the latest known truck associated with the driver in the database. 

![Delivery Verificaiton](README_Assets/DriverApp_2.png)<br>*Figure 1.1: Delivery Verification*

Allowing flexibility in these fields allows work to be completed/edited from previous days, or in cases where a driver's truck changes.

### Delivery Manifest
When the provided date and power unit are confirmed, a list of deliveries for that driver corresponding to the given day are pulled from the database and rendered as an interactive table. Undelivered shipments are shown at the top, while delivered shipments are shown lower down.

Both cases allow a driver to click/hover (depending on user device) and access additional information for the chosen delivery.

![Delivery Manifest](README_Assets/DriverApp_3.png)<br>*Figure 1.2: Delivery Manifest*

The mobile version truncates a couple less essential fields from the table, while the console/tablet version will include the hidden fields. In both cases, clicking on the table entry will navigate to a page with complete delivery information for review and manipulation.

![Expanded Delivery Manifest](README_Assets/DriverApp_3A.png)<br>*Figure 1.3: Expanded Delivery Manifest*

### Delivery Update
Upon selection of a specific delivery, additional information is revealed and the driver is prompted to populate the pertinent delivery information needed to process a delivery.

If the delivery was errantly selected, the driver can return to the previous screen and select a different delivery. If the information is correct, the driver fills out the needed information and submits the changes. Doing so edits the corresponding delivery in the database, ensuring all records up to date.

![Delivery Update](README_Assets/DriverApp_4.png)<br>*Figure 1.4: Delivery Update*

### Logout Prompt
Throughout the session, the user always has the opportunity to log out. Once the work is complete or a session is no longer needed, the user may opt to log out at anytime.

Clicking the logout button triggers a popout to confirm their intent before returning the user to the main menu.

![Logout Prompt](README_Assets/DriverApp_5.png)<br>*Figure 1.5: Logout Prompt*
