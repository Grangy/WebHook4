const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { connectToDatabase } = require('./src/utils/db');
const leadRoutes = require('./src/routes/leadRoutes');
const { fillGiftUseField } = require('./src/utils/middleware');

const app = express();
const PORT = process.env.PORT || 5557;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Database Connection
connectToDatabase();

// Update giftUse field
fillGiftUseField();

// Routes
app.use('/api/leads', leadRoutes);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
