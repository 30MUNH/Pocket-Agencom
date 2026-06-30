const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: "UP", message: "Pocket Agencom API is healthy!" });
});

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the Pocket Agencom API!" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
