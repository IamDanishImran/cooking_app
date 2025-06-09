require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
const port = process.env.PORT || 3002;

// Middleware
app.use(express.urlencoded({ extended: true })); // For form data
app.use(express.json()); // For JSON data
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api', require('./routes/api'));

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});