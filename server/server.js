const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
}

// Setup multer for file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Upload and analyze Excel file
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nincs fájl feltöltve' });
    }

    const machineName = req.body.machineName;
    if (!machineName) {
      return res.status(400).json({ error: 'Gép neve szükséges' });
    }

    // Read Excel file
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    // Analyze data
    const analysis = analyzeData(rawData);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Send response
    res.json({
      machine: machineName,
      uploadDate: new Date().toISOString(),
      rawData: rawData,
      analysis: analysis,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Feldolgozási hiba: ' + error.message });
  }
});

// Analyze data function
function analyzeData(data) {
  const errorTypes = {};
  const topErrors = {};
  let totalErrors = 0;
  let totalWarnings = 0;

  data.forEach((row, index) => {
    const errorType = row['Fehler-Typ'];
    const errorNum = row['Fehler-Nr.'];
    const errorText = row['Fehlertext'];
    const errorCount = parseInt(row['Fehler-Anzahl']) || 1;

    row.rowIndex = index + 1;

    // Count by type
    errorTypes[errorType] = (errorTypes[errorType] || 0) + errorCount;

    // Track top errors
    const key = `${errorNum} - ${errorText}`;
    if (!topErrors[key]) {
      topErrors[key] = { errorNum, errorText, errorType, count: 0 };
    }
    topErrors[key].count += errorCount;

    // Count totals
    if (errorType === 'Fehler') {
      totalErrors += errorCount;
    } else if (errorType === 'Warnung') {
      totalWarnings += errorCount;
    }
  });

  // Get top 10 errors
  const topErrorsArray = Object.values(topErrors)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    errorTypes,
    topErrors: topErrorsArray,
    totalErrors,
    totalWarnings,
    totalRows: data.length,
  };
}

// Serve React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
