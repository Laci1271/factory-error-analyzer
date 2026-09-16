const XLSX = require('xlsx');
const fs = require('fs');

/**
 * Excel fájl feldolgozása
 * @param {string} filePath - Fájl útvonala
 * @returns {Array} Feldolgozott adatok
 */
function parseExcel(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Adatok JSON-á konvertálása
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Adatok tisztítása és feldolgozása
    const processedData = data.map((row, index) => {
      return {
        rowIndex: index + 1,
        'Zeile-Nr.': row['Zeile-Nr.'] || '',
        'Von': row['Von'] || '',
        'Bis': row['Bis'] || '',
        'Dauer': row['Dauer'] || '',
        'Maschine': row['Maschine'] || '',
        'Fehler-Nr.': row['Fehler-Nr.'] || '',
        'Fehlertext': row['Fehlertext'] || '',
        'Fehler-Typ': row['Fehler-Typ'] || '',
        'Fehler-Klasse': row['Fehler-Klasse'] || '',
        'Fehler-Komponente': row['Fehler-Komponente'] || '',
        'Fehler-Anzahl': row['Fehler-Anzahl'] || 0
      };
    });

    return processedData;
  } catch (error) {
    throw new Error(`Excel feldolgozási hiba: ${error.message}`);
  }
}

/**
 * Hibák és figyelmeztetések elemzése
 * @param {Array} data - Feldolgozott adatok
 * @param {string} machineName - Gép neve
 * @returns {Object} Elemzési eredmények
 */
function analyzeErrors(data, machineName) {
  const analysis = {
    totalRows: data.length,
    totalErrors: 0,
    totalWarnings: 0,
    errorTypes: {},
    errorClasses: {},
    errorComponents: {},
    errorsByTime: {},
    topErrors: [],
    summary: {
      warningCount: 0,
      errorCount: 0,
      infoCount: 0
    }
  };

  data.forEach((row) => {
    const errorType = row['Fehler-Typ'] || 'Ismeretlen';
    const errorClass = row['Fehler-Klasse'] || 'Nincs osztály';
    const errorComponent = row['Fehler-Komponente'] || 'Nincs komponens';
    const errorCount = parseInt(row['Fehler-Anzahl']) || 1;

    // Típus szerinti számlálás
    if (errorType === 'Warnung') {
      analysis.totalWarnings += errorCount;
      analysis.summary.warningCount++;
    } else if (errorType === 'Fehler') {
      analysis.totalErrors += errorCount;
      analysis.summary.errorCount++;
    } else {
      analysis.summary.infoCount++;
    }

    // Hiba típusok
    analysis.errorTypes[errorType] = (analysis.errorTypes[errorType] || 0) + errorCount;

    // Hiba osztályok
    analysis.errorClasses[errorClass] = (analysis.errorClasses[errorClass] || 0) + errorCount;

    // Hiba komponensek
    if (errorComponent) {
      analysis.errorComponents[errorComponent] = (analysis.errorComponents[errorComponent] || 0) + errorCount;
    }

    // Top hibák
    const errorKey = `${row['Fehler-Nr.']} - ${row['Fehlertext']}`;
    const existingError = analysis.topErrors.find(e => e.errorKey === errorKey);
    if (existingError) {
      existingError.count += errorCount;
    } else {
      analysis.topErrors.push({
        errorKey,
        errorNum: row['Fehler-Nr.'],
        errorText: row['Fehlertext'],
        errorType,
        count: errorCount
      });
    }

    // Idő szerinti csoportosítás
    const timeKey = row['Von'] ? row['Von'].substring(0, 10) : 'Ismeretlen';
    analysis.errorsByTime[timeKey] = (analysis.errorsByTime[timeKey] || 0) + errorCount;
  });

  // Top 10 hiba
  analysis.topErrors = analysis.topErrors
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return analysis;
}

module.exports = {
  parseExcel,
  analyzeErrors
};
