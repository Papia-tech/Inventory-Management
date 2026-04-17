const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('./database');

const JWT_SECRET = 'invento-secret-key-123';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Set index.html as explicitly served at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Authentication Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Check database for matching user
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            // Generate JWT Token
            const token = jwt.sign({ id: row.id, username: row.username }, JWT_SECRET, { expiresIn: '8h' });
            res.json({ success: true, token, redirect: '/dashboard.html', message: 'Authentication successful' });
        } else {
            // Failure
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied: No token provided' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

// Fetch all inventory items
app.get('/api/inventory', authenticateToken, (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});

// Add a new inventory item
app.post('/api/inventory', authenticateToken, (req, res) => {
    const { name, sku, category, stock_level, price, image_url } = req.body;
    const insert = 'INSERT INTO products (name, sku, category, stock_level, price, image_url) VALUES (?,?,?,?,?,?)';
    
    db.run(insert, [name, sku, category, stock_level, price || 0.0, image_url || 'empty.png'], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ 
            success: true, 
            message: 'Product added successfully',
            data: { id: this.lastID, name, sku, category, stock_level, price, image_url }
        });
    });
});

// Update an existing inventory item
app.put('/api/inventory/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    const { name, sku, category, stock_level, price, image_url } = req.body;
    
    const update = 'UPDATE products SET name = ?, sku = ?, category = ?, stock_level = ?, price = ?, image_url = ? WHERE id = ?';
    db.run(update, [name, sku, category, stock_level, price || 0.0, image_url || 'empty.png', id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ success: true, message: 'Item updated successfully' });
    });
});

// Delete an inventory item
app.delete('/api/inventory/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM products WHERE id = ?', id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ success: true, message: 'Item permanently deleted' });
    });
});
// Bulk Import Products
app.post('/api/inventory/bulk', authenticateToken, (req, res) => {
    const products = req.body.products;

    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty bulk data' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const stmt = db.prepare(
            'INSERT INTO products (name, sku, category, stock_level, price, image_url) VALUES (?, ?, ?, ?, ?, ?)'
        );

        try {
            for (let p of products) {
                // ✅ skip invalid rows
                if (!p.name || !p.sku) continue;

                stmt.run([
                    p.name,
                    p.sku,
                    p.category || 'General',
                    p.stock_level || 0,
                    p.price || 0.0,
                    p.image_url || 'empty.png'
                ]);
            }

            stmt.finalize();

            db.run('COMMIT');
            res.status(201).json({
                success: true,
                message: `Bulk import successful`
            });

        } catch (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: 'Bulk insert failed' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`[Server] Running tightly on http://localhost:${PORT}`);
});