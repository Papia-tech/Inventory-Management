# Full-Stack Inventory Management System

A modernized, monochromatic logistics and inventory management system powered by a fully fledged REST API backend.

## Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.

## Setup & Initialization

1. **Install Dependencies**
   Navigate to the project root directory where `package.json` is located and install the required modules:
   ```bash
   npm install
   ```

2. **Start the Express Server**
   Start the backend application which will automatically build out your SQLite database tables and seed them with initial stock entries:
   ```bash
   node server/server.js
   ```

3. **Access the Application**
   Once the server starts running, open your browser and navigate directly to:

## Default Admin Credentials
You can use the following credentials to securely bypass the Enterprise Login:
- **Access ID / Username:** `admin`
- **System Password:** `admin123`

## Project Structure
- `/public`: Contains all static assets (HTML, customized monochromatic CSS, generated logistics illustrations, client-side JS).
- `/server/server.js`: The Express.js routing controller and static file server.
- `/server/database.js`: The SQLite driver and table definitions.
