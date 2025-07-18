# Delivery Validation Microservice

---

## Project Overview

This repository contains a dedicated microservice focused on **delivery validation, manifest interaction, and real-time delivery updates** for a trucking logistics company. It forms a crucial part of a larger, microservices-based web application designed to streamline delivery tracking and driver log management.

### Repository Structure

This repository is organized into distinct projects:

* **`DeliveryManager.Client`**: The **React-based frontend** (JavaScript, CSS, HTML) responsible for the intuitive user interface.
* **`DeliveryManager.Server`**: The **.NET backend** (C#) that constitutes this specific microservice, handling secure and efficient database transactions related to delivery records.
* **`DeliveryManager.Server.Tests`**: Contains comprehensive **backend unit and integration tests** for the `DeliveryManager.Server` microservice.

---

## Architecture and Integration

This microservice operates within a broader ecosystem of services, notably interacting with a separate **Login Portal Microservice**.

* **Authentication & Authorization (SSO):** This service does *not* handle user login directly. Instead, it receives a validated session through the Login Portal Microservice. Requests to this service's protected endpoints expect a valid **JWT (JSON Web Token)** to be present, which is issued and managed by the Login Portal. **Single Sign-On (SSO)** is utilized to prevent compromising data with duplicate sessions on the same delivery manifest.
* **Token Validation:** This microservice includes its own `TokenService` to validate incoming JWTs against a shared secret key and configuration. This allows it to independently verify the authenticity and authorization of requests, including refreshing access tokens if the refresh token is valid and needs to be renewed.
* **Data Interaction:** It directly interfaces with each client's delivery manifest database, ensuring all delivery-related operations are performed securely and efficiently.

---

## Core Functionality & Workflow

This microservice powers the driver's interface for managing deliveries.

### UX/UI Workflow (Driver Process Flow)

The following figures illustrate the driver's interaction with the components managed by this microservice.

![Driver Interface](README_Assets/Mobile/DeliveryManager_UI_mobile.png)
*Figure 1.0: Driver Interface*

### 1. Delivery Validation and Manifest Identification

The initial step involves **delivery validation**, where a manifest date and power unit (vehicle ID) are used to identify a specific delivery manifest in the records. This microservice validates these inputs against the database.

* **Error Handling:** Errors during this validation process are handled with dynamic styling and clear prompts on the frontend, ensuring immediate user feedback.
* **SSO Enforcement:** The system ensures that only one active session can access a particular delivery manifest at a time, preventing data corruption from duplicate sessions.

![Delivery Manifest](README_Assets/Mobile/DM_DeliveryValidation_mobile.png)

*Figure 1.1: Delivery Validation*

### 2. Interactive Delivery Manifest

Once validated, the **delivery manifest is rendered as an interactive table** displaying a comprehensive list of the driver’s assigned deliveries, categorized into **undelivered** and **delivered** shipments. Undelivered deliveries are prioritized and displayed at the top for quick access, while delivered entries appear below.

#### Interactive Table Functionality

The manifest is designed to be highly interactive, enhancing usability across various devices:

* **Responsive Display:** The table dynamically adjusts its data to the width of the display, truncating non-essential fields on smaller screens (e.g., mobile devices held vertically) and rendering additional columns on wider displays (e.g., horizontal orientation, tablets/PCs).
* **Touch and Click Interaction:** Drivers can tap (on mobile) or click (on tablets/PCs) any row in the table to access detailed delivery information for editing.

![Delivery Manifest](README_Assets/Mobile/DM_DeliveryManifest_mobile.png)

*Figure 2.0: Delivery Manifest - Mobile*

![Delivery Manifest](README_Assets/Mobile/DM_DeliveryManifest_tablet.png)

*Figure 2.1: Delivery Manifest - Tablet*

### 3. Expanded Delivery Information & Updates

Users select deliveries from the manifest and are led to the **delivery form window** where they can make updates to the delivery records. This microservice processes all updates submitted from this view.

The **Expanded Delivery Information** page empowers drivers to input delivery details through text and number fields, while leveraging custom-built widgets for advanced functionalities like signature collection and image capture.

#### Update Capabilities:

* **Basic Details:** Update delivery date, time, and pieces delivered.
* **Exception Notes:** Add or modify notes for specific delivery exceptions.
* **Signature Collection:** Drivers can use the signature widget to digitally sign for deliveries, drawing by cursor or finger.
* **Package Location Image Collection:** Image files are uploaded through native device drivers (e.g., camera roll, file picker). Captured images are dynamically rendered as thumbnails immediately upon upload. Thumbnails also double as interactive buttons, allowing drivers to replace existing images with new uploads.

![Expanded Delivery Information](README_Assets/Mobile/DM_DeliveryForm_BatchEdit_mobile.png)

*Figure 3.0: Expanded Delivery Information*

#### Batch Updates and Filtering:

* If multiple deliveries share an address, the deliveries are intuitively filtered through checkbox selection, and **batch updates are supported** (with limited exception options).

![Expanded Delivery Information](README_Assets/Mobile/DM_DeliveryManifest_BatchEdit_mobile.png)

*Figure 3.1: Expanded Delivery Information*

#### Editing Flexibility:

* Users can choose to edit both **undelivered and delivered deliveries** alike.
* The system also supports **resetting deliveries** to their original status in cases of user error or unforeseen changes, providing robust error correction capabilities.

![Expanded Delivery Information](README_Assets/Mobile/DM_DeliveryForm_SingleEdit_mobile.png)

*Figure 3.2: Expanded Delivery Information*

#### Signature/Image Storage and Retrieval Workflow

This microservice implements the following workflow for images:

* The location and signature images are saved locally on the deployment server where this service is hosted.
* Their file names (paths) are stored in the database for efficient record management.
* Backend logic within this service handles image retrieval by accepting requests with valid file names/paths and returning the corresponding image data for rendering on client-side subsequent accesses.

![Signature Capture](README_Assets/Mobile/DM_DeliveryForm_Signature_mobile.png)

*Figure 3.3: Signature Capture*

![Image Thumbnails](README_Assets/Mobile/DM_DeliveryForm_SignatureThumbnail_mobile.png)

*Figure 3.4: Signature Thumbnail render*

![Post-Delivery Interface](README_Assets/Mobile/DM_DeliveryForm_LocationThumbnail_mobile.png)

*Figure 3.5: Signature and Location Thumbnails render*

---

## Visual Feedback for Database Changes

This microservice provides the data and status updates that drive the client-side visual feedback, using custom graphic icons and specific feedback messages to visually confirm the outcome of database interactions. This enhances the user experience by communicating the status of each operation, clearly and effectively.

### Success Icons

Processed responses from this service trigger success icons for successful database updates, ensuring users receive immediate confirmation.

![Success Iconography](README_Assets/Mobile/DM_DeliveryForm_UpdateSuccess_mobile.png)

*Figure 3.6: Success Iconography*

### Error Icons

Failed requests handled by this service result in error icons with accompanying messages to guide corrective actions.

![Fail Iconography](README_Assets/Mobile/DM_DeliveryForm_UpdateFail_mobile.png)

*Figure 3.7: Fail Iconography*

### Validation Icons

Input validation performed by this service (or related client-side logic) contributes to displaying icons indicating invalid or missing inputs for required fields, prompting users to address errors before proceeding.

![Form/Field Validation](README_Assets/Mobile/DM_DeliveryValidation_Error_mobile.png)

*Figure 3.8: Form/Field Validation*