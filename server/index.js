const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const seedUser = require('./seed');
const initStorage = require('./initStorage');
const checkConnectivity = require('./utils/networkCheck');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for HTTPS detection in production
app.set('trust proxy', true);

// Middleware
app.use(cors({
    origin: true, // Allow all for dev
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Fallback for SPA (if we use client-side routing)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Server and Seed Default User
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);

        // Run network diagnostic
        checkConnectivity();

        // Seed default user and init storage on startup (non-blocking)
        if (process.env.NODE_ENV !== 'test') {
            seedUser().catch(err => console.error('Startup Seed Error:', err));
            initStorage().catch(err => console.error('Startup Storage Error:', err));
        }
    });
}

module.exports = app;



