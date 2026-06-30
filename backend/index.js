const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const { success } = require('./src/utils/response');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  success(res, { status: 'UP', message: 'Pocket Agencom API is healthy!' });
});

app.get('/', (req, res) => {
  success(res, { message: 'Welcome to the Pocket Agencom API!' });
});

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { message: 'Route not found' },
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
