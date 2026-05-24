const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoSanitize = require('express-mongo-sanitize');
const { generalLimiter } = require('./middleware/rateLimiter');
const { connectDB, getMongoStatus } = require('./config/db');
const { isMLAvailable } = require('./utils/mlClient');

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sanitize user input — prevent NoSQL injection attacks
app.use(mongoSanitize());

// Rate limiting — prevent API abuse
app.use('/api/', generalLimiter);

// Import routes
const phishingRoutes = require('./routes/phishingRoutes');
const malwareRoutes = require('./routes/malwareRoutes');
const breachRoutes = require('./routes/breachRoutes');
const wifiRoutes = require('./routes/wifiRoutes');
const alertRoutes = require('./routes/alertRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const passwordRoutes = require('./routes/passwordRoutes');

// Mount routes
app.use('/api/phishing', phishingRoutes);
app.use('/api/malware', malwareRoutes);
app.use('/api/breach', breachRoutes);
app.use('/api/wifi', wifiRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/password', passwordRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CyberGuard AI API is running',
    version: '2.0.0',
    mongoConnected: getMongoStatus(),
    mlServiceAvailable: isMLAvailable() ?? false,
    timestamp: new Date().toISOString()
  });
});

// Delete all scans endpoint (for Settings page)
app.delete('/api/scans/all', async (req, res) => {
  try {
    const ScanResult = require('./models/ScanResult');
    const Alert = require('./models/Alert');
    const BreachLog = require('./models/BreachLog');
    await ScanResult.deleteMany({});
    await Alert.deleteMany({});
    await BreachLog.deleteMany({});
    res.json({ success: true, message: 'All scan history cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server (connect to MongoDB first, then listen)
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 CyberGuard AI Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️  MongoDB: ${getMongoStatus() ? 'Connected' : 'In-Memory Fallback'}`);
    console.log(`🧠 ML Service: ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}`);
    console.log(`🌐 Client: http://localhost:3000\n`);
  });
};

startServer();

module.exports = app;
