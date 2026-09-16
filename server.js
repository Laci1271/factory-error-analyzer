require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseExcel, analyzeErrors } = require('./utils/excelParser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Upload folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Csak Excel fájlok engedélyezettek!'));
    }
  }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Szerver fut' });
});

// File upload és elemzés
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nincs fájl feltöltve' });
    }

    const filePath = path.join(uploadDir, req.file.filename);
    const machineName = req.body.machineName || 'Ismeretlen gép';

    // Excel feldolgozás
    const rawData = parseExcel(filePath);
    
    // Adatok elemzése
    const analysis = analyzeErrors(rawData, machineName);

    res.json({
      success: true,
      machine: machineName,
      fileName: req.file.originalname,
      uploadDate: new Date(),
      rawData: rawData,
      analysis: analysis
    });

  } catch (error) {
    console.error('Upload hiba:', error);
    res.status(500).json({ error: error.message });
  }
});

// Statisztikák lekérése
app.get('/api/statistics/:machine', (req, res) => {
  try {
    const { machine } = req.params;
    // Később adatbázisból lekéri az adatokat
    res.json({
      machine,
      totalErrors: 0,
      totalWarnings: 0,
      weeklyTrend: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Szerver hiba' });
});

// Server start
app.listen(PORT, () => {
  console.log(`🚀 Szerver fut: http://localhost:${PORT}`);
});
