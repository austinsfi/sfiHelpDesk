# **Slack Alerter & Messenger: Technical Reference & User Guide**

This document provides a comprehensive overview of the Slack Alerter & Messenger application, detailing its functionality, architecture, and user workflow.

## **1. Core Functionality**

This application serves as a centralized helpdesk interface for employees to submit IT support requests directly to a designated Slack channel.

### **1.1. Architecture**

*   **Frontend:** A single-page web application ([`public/index.html`](public/index.html:1)) built with HTML, TailwindCSS, and vanilla JavaScript. It provides the user interface and captures all user input.
*   **Backend:** A Node.js server ([`server.js`](server.js:1)) using the Express.js framework. It receives requests from the frontend, processes them, and communicates with the Slack API.

### **1.2. Core Features**

*   **Slack Integration:** The backend uses the `@slack/web-api` to send messages, alerts, and file uploads.
*   **File Uploads:** Users can attach screenshots or other files (up to 20MB) via a file selector or by pasting from the clipboard. The backend handles `multipart/form-data` using `multer`.
*   **Dynamic Interface:** The UI can be customized for different departments using a `mill` URL parameter (e.g., `?mill=Heat-Treat`), which alters the available quick-action buttons and displayed text.

## **2. User Workflow and UI Components**

### **2.1. User Workflow Diagram**

```mermaid
graph TD
    A[User opens helpdesk URL] --> B{URL has 'mill' parameter?};
    B -- Yes --> C[UI customizes for the specific mill];
    B -- No --> D[UI shows default view];
    C --> E{User chooses action};
    D --> E;
    E -- Clicks Quick Help Request --> F[sendToSlack() called with urgent message];
    E -- Clicks Custom Mill Button --> G[sendToSlack() called with pre-defined message];
    E -- Types message and clicks Send --> H[handleSendMessage() called];
    E -- Attaches file --> I[File preview is shown];
    I -- Types message and clicks Send --> H;
    H --> F;
    G --> F;
    F --> J[Message sent to Slack API];
    J --> K[UI shows confirmation];
```

### **2.2. UI Components**

*   **Header (`#header-title`):** Displays a title that is dynamically updated based on the `mill` URL parameter.
*   **Quick Alert Button (`#send-alert-btn`):** Sends a pre-formatted, high-priority alert. The button's text dynamically includes the `millId`.
*   **Custom Department Buttons (`#heat-treat-buttons`):** A container for buttons specific to a department, hidden by default and shown via URL parameter.
*   **Message Input (`#message-input`):** Text field for detailed issue descriptions. Supports pasting images.
*   **Attach File Button (`#attach-file-btn`):** Opens the system's file selection dialog and turns green when a file is attached.
*   **Send Message Button (`#send-message-btn`):** Submits the message and any attached file.

## **3. Backend and API**

### **3.1. Server Architecture (`server.js`)**

*   **Framework:** Express.js
*   **Dependencies:** `express`, `path`, `multer`, `@slack/web-api`.
*   **Configuration:** Runs on port `8080` (configurable via `PORT` env var). Requires `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID` environment variables.

### **3.2. API Endpoint: `POST /api/send`**

*   **Function:** Receives all helpdesk requests from the frontend.
*   **Middleware:** `multer` middleware processes file uploads from a field named `screenshot`.
*   **Request Body:**
    *   `message`: (string) The user's message.
    *   `mill`: (string) The location identifier.
    *   `isAlert`: (string, 'true' or 'false') Flag for high-priority alerts.
*   **Logic:**
    1.  Constructs a message, adding a `🚨` icon if `isAlert` is true.
    2.  If a file is attached, it uses `slackClient.files.uploadV2`.
    3.  If no file is attached, it uses `slackClient.chat.postMessage`.
    4.  Returns a `200 OK` on success or a `500 Internal Server Error` on failure.

## **4. Business Logic and Customization**

### **4.1. URL-Based Customization**

*   The application uses the `mill` URL query parameter to tailor the UI. The `DOMContentLoaded` event listener in the frontend JavaScript reads this parameter and updates the UI accordingly.

### **4.2. Conditional UI Rendering**

*   The JavaScript contains an `if/else` block that checks the `millId`. For example, if `millId === 'Heat-Treat'`, it shows the `#heat-treat-buttons` and hides the generic `#send-alert-btn`. This structure is extensible for other departments.

### **4.3. Button Data Attributes**

*   Custom buttons use HTML `data-message` and `data-alert` attributes to store their specific content and alert status, making them easy to configure directly in the HTML.