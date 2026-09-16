import React, { useMemo } from 'react';
import './Analysis.css';
import * as XLSX from 'xlsx';

function Analysis({ data }) {
  const { rawData = [], machine, analysis } = data;

  // =========================
  // SEGÉDFÜGGVÉNYEK
  // =========================

  const toNumber = (value) => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    const normalized = String(value)
      .replace(',', '.')
      .replace(/[^\d.-]/g, '');

    const number = parseFloat(normalized);

    return isNaN(number) ? 0 : number;
  };

  const parseDuration = (value) => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    const text = String(value).trim();

    // HH:MM:SS
    const hms = text.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);

    if (hms) {
      return (
        parseInt(hms[1], 10) * 3600 +
        parseInt(hms[2], 10) * 60 +
        parseInt(hms[3], 10)
      );
    }

    // MM:SS
    const ms = text.match(/^(\d+):(\d{1,2})$/);

    if (ms) {
      return (
        parseInt(ms[1], 10) * 60 +
        parseInt(ms[2], 10)
      );
    }

    // Pl. 25 sec / 10 min / 1.5 h
    const unitMatch = text.match(
      /([\d.,]+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hour|hours)/i
    );

    if (unitMatch) {
      const number = parseFloat(
        unitMatch[1].replace(',', '.')
      );

      const unit = unitMatch[2].toLowerCase();

      if (unit.startsWith('h')) {
        return number * 3600;
      }

      if (unit.startsWith('m')) {
        return number * 60;
      }

      return number;
    }

    const number = parseFloat(
      text.replace(',', '.')
    );

    return isNaN(number) ? 0 : number;
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) {
      return '0 mp';
    }

    const totalSeconds = Math.round(seconds);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours} ó ${minutes} p ${secs} mp`;
    }

    if (minutes > 0) {
      return `${minutes} p ${secs} mp`;
    }

    return `${secs} mp`;
  };

  // =========================
  // HIBATÍPUS STATISZTIKA
  // =========================

  const typeStatistics = useMemo(() => {
    const statistics = {};

    rawData.forEach((row) => {
      const type =
        row['Fehler-Typ'] || 'Ismeretlen';

      if (!statistics[type]) {
        statistics[type] = {
          type,
          rows: 0,
          errorCount: 0,
          duration: 0
        };
      }

      statistics[type].rows += 1;

      statistics[type].errorCount +=
        toNumber(row['Fehler-Anzahl']);

      statistics[type].duration +=
        parseDuration(row['Dauer']);
    });

    return Object.values(statistics).sort(
      (a, b) => b.rows - a.rows
    );
  }, [rawData]);

  // =========================
  // HIBA STATISZTIKA
  // =========================

  const errorStatistics = useMemo(() => {
    const statistics = {};

    rawData.forEach((row) => {
      const errorNum =
        row['Fehler-Nr.'] || '-';

      const errorText =
        row['Fehlertext'] ||
        'Ismeretlen hiba';

      const type =
        row['Fehler-Typ'] ||
        'Ismeretlen';

      const key =
        `${errorNum}|||${errorText}`;

      if (!statistics[key]) {
        statistics[key] = {
          errorNum,
          errorText,
          type,
          occurrences: 0,
          errorCount: 0,
          duration: 0
        };
      }

      statistics[key].occurrences += 1;

      statistics[key].errorCount +=
        toNumber(row['Fehler-Anzahl']);

      statistics[key].duration +=
        parseDuration(row['Dauer']);
    });

    return Object.values(statistics).sort(
      (a, b) =>
        b.errorCount - a.errorCount ||
        b.occurrences - a.occurrences
    );
  }, [rawData]);

  // =========================
  // LEGHOSSZABB HIBÁK
  // =========================

  const longestErrors = useMemo(() => {
    return rawData
      .map((row) => ({
        ...row,
        durationSeconds:
          parseDuration(row['Dauer'])
      }))
      .filter(
        (row) => row.durationSeconds > 0
      )
      .sort(
        (a, b) =>
          b.durationSeconds -
          a.durationSeconds
      )
      .slice(0, 10);
  }, [rawData]);

  // =========================
  // IDŐ STATISZTIKA
  // =========================

  const totalDuration = useMemo(() => {
    return rawData.reduce(
      (sum, row) =>
        sum + parseDuration(row['Dauer']),
      0
    );
  }, [rawData]);

  const averageDuration = useMemo(() => {
    const durations = rawData
      .map((row) =>
        parseDuration(row['Dauer'])
      )
      .filter(
        (duration) => duration > 0
      );

    if (durations.length === 0) {
      return 0;
    }

    return (
      durations.reduce(
        (sum, duration) =>
          sum + duration,
        0
      ) / durations.length
    );
  }, [rawData]);

  const mostCommonError =
    errorStatistics[0];

  const mostCommonType =
    typeStatistics[0];

  // =========================
  // EXCEL EXPORT
  // =========================

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // -------------------------
    // 1. ÖSSZEFOGLALÓ
    // -------------------------

    const summaryData = [
      ['FACTORY ERROR ANALYZER'],
      [],
      ['Gép', machine || 'Ismeretlen'],
      [
        'Elemzés dátuma',
        data.uploadDate
          ? new Date(
              data.uploadDate
            ).toLocaleDateString('hu-HU')
          : '-'
      ],
      [],
      ['Mutató', 'Érték'],
      ['Hibák', analysis.totalErrors],
      [
        'Figyelmeztetések',
        analysis.totalWarnings
      ],
      ['Összes sor', analysis.totalRows],
      [
        'Összes idő',
        formatDuration(totalDuration)
      ],
      [
        'Átlagos idő',
        formatDuration(averageDuration)
      ],
      [
        'Leggyakoribb hiba',
        mostCommonError
          ? `${mostCommonError.errorNum} - ${mostCommonError.errorText}`
          : '-'
      ],
      [
        'Leggyakoribb hibatípus',
        mostCommonType
          ? mostCommonType.type
          : '-'
      ]
    ];

    const summarySheet =
      XLSX.utils.aoa_to_sheet(
        summaryData
      );

    summarySheet['!cols'] = [
      { wch: 30 },
      { wch: 60 }
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      'Összefoglaló'
    );

    // -------------------------
    // 2. HIBATÍPUSOK
    // -------------------------

    const typeData = [
      [
        'Hibatípus',
        'Előfordulás',
        'Hibaszám',
        'Összes idő',
        'Átlagos idő'
      ]
    ];

    typeStatistics.forEach((item) => {
      typeData.push([
        item.type,
        item.rows,
        item.errorCount,
        formatDuration(item.duration),
        formatDuration(
          item.rows > 0
            ? item.duration / item.rows
            : 0
        )
      ]);
    });

    const typeSheet =
      XLSX.utils.aoa_to_sheet(
        typeData
      );

    typeSheet['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      typeSheet,
      'Hibatípusok'
    );

    // -------------------------
    // 3. HIBÁK ÖSSZESÍTÉSE
    // -------------------------

    const errorData = [
      [
        '#',
        'Fehler-Nr.',
        'Fehlertext',
        'Fehler-Typ',
        'Előfordulás',
        'Hibaszám',
        'Összes idő'
      ]
    ];

    errorStatistics.forEach(
      (error, index) => {
        errorData.push([
          index + 1,
          error.errorNum,
          error.errorText,
          error.type,
          error.occurrences,
          error.errorCount,
          formatDuration(
            error.duration
          )
        ]);
      }
    );

    const errorSheet =
      XLSX.utils.aoa_to_sheet(
        errorData
      );

    errorSheet['!cols'] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 50 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      errorSheet,
      'Hibák összesítése'
    );

    // -------------------------
    // 4. LEGHOSSZABB HIBÁK
    // -------------------------

    const longestData = [
      [
        '#',
        'Fehler-Nr.',
        'Fehlertext',
        'Fehler-Typ',
        'Von',
        'Bis',
        'Időtartam'
      ]
    ];

    longestErrors.forEach(
      (row, index) => {
        longestData.push([
          index + 1,
          row['Fehler-Nr.'],
          row['Fehlertext'],
          row['Fehler-Typ'],
          row['Von'],
          row['Bis'],
          formatDuration(
            row.durationSeconds
          )
        ]);
      }
    );

    const longestSheet =
      XLSX.utils.aoa_to_sheet(
        longestData
      );

    longestSheet['!cols'] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 50 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      longestSheet,
      'Leghosszabb hibák'
    );

    // -------------------------
    // 5. TELJES RÉSZLETES ADAT
    // -------------------------

    const detailedData = [
      [
        'Sor',
        'Fehler-Nr.',
        'Fehlertext',
        'Fehler-Typ',
        'Von',
        'Bis',
        'Dauer',
        'Fehler-Anzahl'
      ]
    ];

    rawData.forEach((row) => {
      detailedData.push([
        row.rowIndex,
        row['Fehler-Nr.'],
        row['Fehlertext'],
        row['Fehler-Typ'],
        row['Von'],
        row['Bis'],
        row['Dauer'],
        row['Fehler-Anzahl']
      ]);
    });

    const detailedSheet =
      XLSX.utils.aoa_to_sheet(
        detailedData
      );

    detailedSheet['!cols'] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 50 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 18 }
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      detailedSheet,
      'Részletes adatok'
    );

    // -------------------------
    // FÁJL MENTÉSE
    // -------------------------

    const safeMachine =
      String(machine || 'ismeretlen')
        .replace(/[\\/:*?"<>|]/g, '_');

    const date =
      new Date()
        .toISOString()
        .slice(0, 10);

    XLSX.writeFile(
      workbook,
      `Hibaelemzes_${safeMachine}_${date}.xlsx`,
      {
        compression: true
      }
    );
  };

  // =========================
  // PDF EXPORT
  // =========================

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="analysis-container">

      {/* =========================
          FEJLÉC
      ========================= */}

      <div className="analysis-header">

        <div>
          <h2>📊 Adatok Elemzése</h2>

          <p className="analysis-subtitle">
            Automatikus hibaelemzés és
            részletes kimutatás
          </p>
        </div>

        <div className="machine-info">

          <span className="badge">
            {machine || 'Ismeretlen gép'}
          </span>

          <span className="date">
            {data.uploadDate
              ? new Date(
                  data.uploadDate
                ).toLocaleDateString(
                  'hu-HU'
                )
              : '-'}
          </span>

        </div>
      </div>

      {/* =========================
          EXPORT GOMBOK
      ========================= */}

      <div className="export-panel">

        <div>
          <strong>
            📤 Elemzés exportálása
          </strong>

          <span>
            A teljes elemzés mentése
            Excelbe vagy PDF-be
          </span>
        </div>

        <div className="export-buttons">

          <button
            className="export-button excel"
            onClick={exportToExcel}
          >
            📊 Excel export
          </button>

          <button
            className="export-button pdf"
            onClick={exportToPDF}
          >
            📄 PDF export
          </button>

        </div>

      </div>

      {/* =========================
          ÖSSZEFOGLALÁS
      ========================= */}

      <div className="summary-grid">

        <div className="summary-card error">
          <h3>❌ Hibák</h3>
          <p className="number">
            {analysis.totalErrors}
          </p>
        </div>

        <div className="summary-card warning">
          <h3>⚠️ Figyelmeztetések</h3>
          <p className="number">
            {analysis.totalWarnings}
          </p>
        </div>

        <div className="summary-card info">
          <h3>ℹ️ Összesen</h3>
          <p className="number">
            {analysis.totalRows}
          </p>
        </div>

        <div className="summary-card purple">
          <h3>⏱️ Összes idő</h3>
          <p className="number">
            {formatDuration(totalDuration)}
          </p>
        </div>

        <div className="summary-card green">
          <h3>📈 Átlagos idő</h3>
          <p className="number">
            {formatDuration(
              averageDuration
            )}
          </p>
        </div>

      </div>

      {/* =========================
          GYORS ÁTTEKINTÉS
      ========================= */}

      <div className="section">

        <h3>⚡ Gyors áttekintés</h3>

        <div className="quick-info-grid">

          <div className="quick-info-card">

            <span className="quick-icon">
              🔴
            </span>

            <div>

              <span className="quick-label">
                Leggyakoribb hiba
              </span>

              <strong>
                {mostCommonError
                  ? `${mostCommonError.errorNum} - ${mostCommonError.errorText}`
                  : 'Nincs adat'}
              </strong>

              {mostCommonError && (
                <small>
                  {mostCommonError.errorCount} db
                </small>
              )}

            </div>
          </div>

          <div className="quick-info-card">

            <span className="quick-icon">
              📌
            </span>

            <div>

              <span className="quick-label">
                Leggyakoribb hibatípus
              </span>

              <strong>
                {mostCommonType
                  ? mostCommonType.type
                  : 'Nincs adat'}
              </strong>

              {mostCommonType && (
                <small>
                  {mostCommonType.rows}
                  {' '}előfordulás
                </small>
              )}

            </div>
          </div>

          <div className="quick-info-card">

            <span className="quick-icon">
              ⏱️
            </span>

            <div>

              <span className="quick-label">
                Leghosszabb hiba
              </span>

              <strong>
                {longestErrors.length > 0
                  ? formatDuration(
                      longestErrors[0]
                        .durationSeconds
                    )
                  : 'Nincs adat'}
              </strong>

              {longestErrors.length > 0 && (
                <small>
                  {longestErrors[0]
                    ['Fehlertext'] ||
                    'Ismeretlen hiba'}
                </small>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* =========================
          HIBATÍPUS BONTÁS
      ========================= */}

      <div className="section">

        <h3>
          📊 Hibák Típusa Szerinti Bontás
        </h3>

        <div className="type-breakdown">

          {Object.entries(
            analysis.errorTypes || {}
          ).map(([type, count]) => {

            const maxValue =
              Math.max(
                ...Object.values(
                  analysis.errorTypes || {}
                ),
                1
              );

            const percentage =
              (count / maxValue) * 100;

            return (
              <div
                key={type}
                className="breakdown-item"
              >

                <span className="type-label">
                  {type}
                </span>

                <div className="progress-bar">

                  <div
                    className={`progress-fill ${type
                      .toLowerCase()
                      .replace(/\s/g, '')}`}
                    style={{
                      width:
                        `${percentage}%`
                    }}
                  />

                </div>

                <span className="count">
                  {count}
                </span>

              </div>
            );
          })}

        </div>
      </div>

      {/* =========================
          HIBATÍPUS ÖSSZESÍTÉS
      ========================= */}

      <div className="section">

        <h3>
          📋 Hibatípusok összesítése
        </h3>

        <div className="table-wrapper">

          <table className="data-table">

            <thead>
              <tr>
                <th>Hibatípus</th>
                <th>Előfordulás</th>
                <th>Hibaszám</th>
                <th>Összes idő</th>
                <th>Átlagos idő</th>
              </tr>
            </thead>

            <tbody>

              {typeStatistics.map(
                (item) => (
                  <tr key={item.type}>

                    <td>
                      <span className="type-badge">
                        {item.type}
                      </span>
                    </td>

                    <td>
                      {item.rows}
                    </td>

                    <td>
                      <strong>
                        {item.errorCount}
                      </strong>
                    </td>

                    <td>
                      {formatDuration(
                        item.duration
                      )}
                    </td>

                    <td>
                      {formatDuration(
                        item.rows > 0
                          ? item.duration /
                            item.rows
                          : 0
                      )}
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* =========================
          TOP 10
      ========================= */}

      <div className="section">

        <h3>🔝 Top 10 Hiba</h3>

        <div className="top-errors">

          {(analysis.topErrors || [])
            .map((error, index) => (

              <div
                key={index}
                className="error-item"
              >

                <div className="error-rank">
                  #{index + 1}
                </div>

                <div className="error-details">

                  <h4>
                    {error.errorNum}
                    {' - '}
                    {error.errorText}
                  </h4>

                  <p className="error-type">
                    {error.errorType}
                  </p>

                </div>

                <div className="error-count">
                  {error.count}x
                </div>

              </div>

            ))}

        </div>
      </div>

      {/* =========================
          HIBÁK ÖSSZESÍTÉSE
      ========================= */}

      <div className="section">

        <h3>
          📊 Hibák részletes összesítése
        </h3>

        <div className="table-wrapper">

          <table className="data-table">

            <thead>
              <tr>
                <th>#</th>
                <th>Fehler-Nr.</th>
                <th>Fehlertext</th>
                <th>Fehler-Typ</th>
                <th>Előfordulás</th>
                <th>Hibaszám</th>
                <th>Összes idő</th>
              </tr>
            </thead>

            <tbody>

              {errorStatistics
                .slice(0, 20)
                .map(
                  (error, index) => (

                    <tr
                      key={
                        `${error.errorNum}-${index}`
                      }
                    >

                      <td>
                        <strong>
                          {index + 1}
                        </strong>
                      </td>

                      <td>
                        {error.errorNum}
                      </td>

                      <td className="error-text">
                        {error.errorText}
                      </td>

                      <td>
                        <span className="type-badge">
                          {error.type}
                        </span>
                      </td>

                      <td>
                        {error.occurrences}
                      </td>

                      <td>
                        <strong>
                          {error.errorCount}
                        </strong>
                      </td>

                      <td>
                        {formatDuration(
                          error.duration
                        )}
                      </td>

                    </tr>
                  )
                )}

            </tbody>

          </table>

        </div>

        {errorStatistics.length > 20 && (
          <p className="table-note">
            Az első 20 hibatípus megjelenítve
            a {errorStatistics.length} közül.
          </p>
        )}

      </div>

      {/* =========================
          LEGHOSSZABB HIBÁK
      ========================= */}

      <div className="section">

        <h3>
          ⏱️ Leghosszabb hibák
        </h3>

        <div className="table-wrapper">

          <table className="data-table">

            <thead>
              <tr>
                <th>#</th>
                <th>Fehler-Nr.</th>
                <th>Fehlertext</th>
                <th>Fehler-Typ</th>
                <th>Von</th>
                <th>Bis</th>
                <th>Időtartam</th>
              </tr>
            </thead>

            <tbody>

              {longestErrors.map(
                (row, index) => (

                  <tr
                    key={`longest-${index}`}
                  >

                    <td>
                      <strong>
                        {index + 1}
                      </strong>
                    </td>

                    <td>
                      {row['Fehler-Nr.']}
                    </td>

                    <td className="error-text">
                      {row['Fehlertext']}
                    </td>

                    <td>
                      {row['Fehler-Typ']}
                    </td>

                    <td>
                      {row['Von']}
                    </td>

                    <td>
                      {row['Bis']}
                    </td>

                    <td className="duration-cell">
                      {formatDuration(
                        row.durationSeconds
                      )}
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* =========================
          EREDETI RÉSZLETES ADATOK
      ========================= */}

      <div className="section">

        <h3>
          📋 Részletes Adatok
        </h3>

        <div className="table-wrapper">

          <table className="data-table">

            <thead>
              <tr>
                <th>Sor</th>
                <th>Fehler-Nr.</th>
                <th>Fehlertext</th>
                <th>Fehler-Typ</th>
                <th>Von</th>
                <th>Bis</th>
                <th>Dauer</th>
                <th>Fehler-Anzahl</th>
              </tr>
            </thead>

            <tbody>

              {rawData
                .slice(0, 50)
                .map((row, index) => (

                  <tr key={index}>

                    <td>
                      {row.rowIndex}
                    </td>

                    <td>
                      {row['Fehler-Nr.']}
                    </td>

                    <td className="error-text">
                      {row['Fehlertext']}
                    </td>

                    <td>
                      {row['Fehler-Typ']}
                    </td>

                    <td>
                      {row['Von']}
                    </td>

                    <td>
                      {row['Bis']}
                    </td>

                    <td>
                      {row['Dauer']}
                    </td>

                    <td>
                      {row['Fehler-Anzahl']}
                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

          {rawData.length > 50 && (
            <p className="table-note">
              Az első 50 sor megjelenítve a{' '}
              {rawData.length} közül
            </p>
          )}

        </div>
      </div>

    </div>
  );
}

export default Analysis;
