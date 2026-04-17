const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'inventory.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create Users table for Authentication
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`, (err) => {
            if (!err) {
                // Insert default admin user if not exists
                db.run(`INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'admin123')`);
            }
        });

        // Create Products table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            sku TEXT UNIQUE,
            category TEXT,
            stock_level INTEGER,
            price REAL,
            image_url TEXT
        )`, (err) => {
            if (!err) {
                // Seed initial data if table is empty
                db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
                    if (row && row.count === 0) {
                        const insert = 'INSERT INTO products (name, sku, category, stock_level, price, image_url) VALUES (?,?,?,?,?,?)';
                        db.run(insert, ['Logistics Pallet Jack', 'PJ-8821', 'Equipment', 45, 250.00, 'empty.png']);
                        db.run(insert, ['Industrial Shelving Unit', 'SH-1024', 'Storage', 120, 150.00, 'empty.png']);
                        db.run(insert, ['Standard Corrugated Boxes', 'CB-5500', 'Packaging', 15, 1.50, 'empty.png']);
                    }
                });
            }
        });
    }
});

module.exports = db;