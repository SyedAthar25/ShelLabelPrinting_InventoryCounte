import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8080;

// Enable CORS
app.use(cors());
app.use(express.json());

// Sample master data
const sampleItems = [
  {
    id: '1',
    itemCode: 'ITEM001',
    barcode: '1234567890123',
    itemNameEng: 'Sample Product 1',
    itemNameArabic: 'منتج تجريبي 1',
    price: '25.50',
    category: 'Electronics'
  },
  {
    id: '2',
    itemCode: 'ITEM002',
    barcode: '1234567890124',
    itemNameEng: 'Sample Product 2',
    itemNameArabic: 'منتج تجريبي 2',
    price: '15.75',
    category: 'Clothing'
  },
  {
    id: '3',
    itemCode: 'ITEM003',
    barcode: '1234567890125',
    itemNameEng: 'Sample Product 3',
    itemNameArabic: 'منتج تجريبي 3',
    price: '45.00',
    category: 'Home & Garden'
  },
  {
    id: '4',
    itemCode: 'ITEM004',
    barcode: '1234567890126',
    itemNameEng: 'Sample Product 4',
    itemNameArabic: 'منتج تجريبي 4',
    price: '32.25',
    category: 'Books'
  },
  {
    id: '5',
    itemCode: 'ITEM005',
    barcode: '1234567890127',
    itemNameEng: 'Sample Product 5',
    itemNameArabic: 'منتج تجريبي 5',
    price: '18.90',
    category: 'Sports'
  }
];

// API Routes
app.get('/api/items', (req, res) => {
  console.log('GET /api/items - Returning sample items');
  res.json(sampleItems);
});

app.post('/api/counts', (req, res) => {
  console.log('POST /api/counts - Received count session:', req.body);
  res.json({ 
    success: true, 
    message: 'Count session received successfully',
    sessionId: req.body.id 
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    itemsCount: sampleItems.length 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test API Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  /api/items - Get master data (${sampleItems.length} items)`);
  console.log(`   POST /api/counts - Upload count sessions`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`\n🔗 To test master data import:`);
  console.log(`   1. Set API URL to: http://localhost:${PORT}`);
  console.log(`   2. Go to Sync tab and click "Download Master Data"`);
});
