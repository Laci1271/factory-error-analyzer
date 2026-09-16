import React, { useMemo } from 'react';
import './Analysis.css';

function Analysis({ data }) {
  const { rawData = [], machine, analysis } = data;

  // Biztonságos szám átalakítás
  const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;

    if (typeof value === 'number') {
      return value;
    }

    const normalized = String(value)
      .replace(',', '.')
      .replace(/[^\d.-]/g, '');

    const number = parseFloat(normalized);

    return isNaN(number) ? 0 : number;
  };

  // Dauer értékből másodpercet próbálunk számolni
  const parseDuration = (value) => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    // Ha szám, feltételezzük, hogy másodperc
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

    // Pl. "25 sec", "10 min", "1.5 h"
    const unitMatch = text.match(
      /([\d.,]+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hour|hours)/i
    );

    if (unitMatch) {
      const number = parseFloat(unitMatch[1].replace(',', '.'));
      const unit = unitMatch[2].toLowerCase();

      if (unit.startsWith('h')) {
        return number * 3600;
      }

      if (unit.startsWith('m')) {
        return number * 60;
      }

      return number;
    }

    // Ha csak egy szám
    const number = parseFloat(text.replace(',', '.'));

    return isNaN(number) ? 0 : number;
  };

  // Másodperc -> olvasható idő
  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) {
      return '0 mp';
    }

    const totalSeconds = Math.round(seconds);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours} ó ${minutes} p ${secs} mp`;
    }

    if (minutes > 0) {
      return `${minutes} p ${secs} mp`;
    }

    return `${secs} mp`;
  };

  // Hibatípusok összesítése
  const typeStatistics = useMemo(() => {
    const statistics = {};

    rawData.forEach((row) => {
      const type = row['Fehler-Typ'] || 'Ismeretlen';

      if (!statistics[type]) {
        statistics[type] = {
          type,
          rows: 0,
          errorCount: 0,
          duration: 0
        };
      }

      statistics[type].rows += 1;
      statistics[type].errorCount += toNumber(row['Fehler-Anzahl']);
      statistics[type].duration += parseDuration(row['Dauer']);
    });

    return Object.values(statistics).sort(
      (a, b) => b.rows - a.rows
    );
  }, [rawData]);

  // Hibák összesítése Fehler-Nr. + Fehlertext alapján
  const errorStatistics = useMemo(() => {
    const statistics = {};

    rawData.forEach((row) => {
      const errorNum = row['Fehler-Nr.'] || '-';
      const errorText = row['Fehlertext'] || 'Ismeretlen hiba';
      const type = row['Fehler-Typ'] || 'Ismeretlen';

      const key = `${errorNum}|||${errorText}`;

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
      statistics[key].errorCount += toNumber(row['Fehler-Anzahl']);
      statistics[key].duration += parseDuration(row['Dauer']);
    });

    return Object.values(statistics).sort(
      (a, b) =>
        b.errorCount - a.errorCount ||
        b.occurrences - a.occurrences
    );
  }, [rawData]);

  // Leghosszabb hibák
  const longestErrors = useMemo(() => {
    return rawData
      .map((row) => ({
        ...row,
        durationSeconds: parseDuration(row['Dauer'])
      }))
      .filter((row) => row.durationSeconds > 0)
      .sort((a, b) => b.durationSeconds - a.durationSeconds)
      .slice(0, 10);
  }, [rawData]);

  // Összes időtartam
  const totalDuration = useMemo(() => {
    return rawData.reduce(
      (sum, row) => sum + parseDuration(row['Dauer']),
      0
    );
  }, [rawData]);

  // Átlagos időtartam
  const averageDuration = useMemo(() => {
    const durations = rawData
      .map((row) => parseDuration(row['Dauer']))
      .filter((duration) => duration > 0);

    if (durations.length === 0) {
      return 0;
    }

    return (
      durations.reduce((sum, duration) => sum + duration, 0) /
      durations.length
    );
  }, [rawData]);

  // Leggyakoribb hiba
  const mostCommonError = errorStatistics[0];

  // Leggyakoribb hibatípus
  const mostCommonType = typeStatistics[0];

  return (
    <div className="analysis-container">

      {/* FEJLÉC */}
      <div className="analysis-header">
        <div>
          <h2>📊 Adatok Elemzése</h2>
          <p className="analysis-subtitle">
            Automatikus hibaelemzés és részletes kimutatás
          </p>
        </div>

        <div className="machine-info">
          <span className="badge">{machine || 'Ismeretlen gép'}</span>

          <span className="date">
            {data.uploadDate
              ? new Date(data.uploadDate).toLocaleDateString('hu-HU')
              : '-'}
          </span>
        </div>
      </div>

      {/* ALAP ÖSSZEFOGLALÁS */}
      <div className="summary-grid">

        <div className="summary-card error">
          <h3>❌ Hibák</h3>
          <p className="number">{analysis.totalErrors}</p>
        </div>

        <div className="summary-card warning">
          <h3>⚠️ Figyelmeztetések</h3>
          <p className="number">{analysis.totalWarnings}</p>
        </div>

        <div className="summary-card info">
          <h3>ℹ️ Összesen</h3>
          <p className="number">{analysis.totalRows}</p>
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
            {formatDuration(averageDuration)}
          </p>
        </div>

      </div>

      {/* GYORS ÁTTEKINTÉS */}
      <div className="section">

        <h3>⚡ Gyors áttekintés</h3>

        <div className="quick-info-grid">

          <div className="quick-info-card">
            <span className="quick-icon">🔴</span>

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
            <span className="quick-icon">📌</span>

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
                  {mostCommonType.rows} előfordulás
                </small>
              )}
            </div>
          </div>

          <div className="quick-info-card">
            <span className="quick-icon">⏱️</span>

            <div>
              <span className="quick-label">
                Leghosszabb hiba
              </span>

              <strong>
                {longestErrors.length > 0
                  ? formatDuration(longestErrors[0].durationSeconds)
                  : 'Nincs adat'}
              </strong>

              {longestErrors.length > 0 && (
                <small>
                  {longestErrors[0]['Fehlertext'] || 'Ismeretlen hiba'}
                </small>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* HIBÁK TÍPUSA SZERINTI BONTÁS */}
      <div className="section">

        <h3>📊 Hibák Típusa Szerinti Bontás</h3>

        <div className="type-breakdown">

          {Object.entries(analysis.errorTypes || {}).map(
            ([type, count]) => {

              const maxValue = Math.max(
                ...Object.values(analysis.errorTypes || {}),
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
                        width: `${percentage}%`
                      }}
                    />
                  </div>

                  <span className="count">
                    {count}
                  </span>
                </div>
              );
            }
          )}

        </div>
      </div>

      {/* HIBATÍPUS ÖSSZESÍTŐ TÁBLÁZAT */}
      <div className="section">

        <h3>📋 Hibatípusok összesítése</h3>

        <div className="table-wrapper">

          <table className="data-table statistics-table">

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

              {typeStatistics.map((item) => (

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
                    {formatDuration(item.duration)}
                  </td>

                  <td>
                    {formatDuration(
                      item.rows > 0
                        ? item.duration / item.rows
                        : 0
                    )}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      </div>

      {/* TOP 10 HIBÁK */}
      <div className="section">

        <h3>🔝 Top 10 Hiba</h3>

        <div className="top-errors">

          {(analysis.topErrors || []).map(
            (error, index) => (

              <div
                key={index}
                className="error-item"
              >

                <div className="error-rank">
                  #{index + 1}
                </div>

                <div className="error-details">

                  <h4>
                    {error.errorNum} - {error.errorText}
                  </h4>

                  <p className="error-type">
                    {error.errorType}
                  </p>

                </div>

                <div className="error-count">
                  {error.count}x
                </div>

              </div>

            )
          )}

        </div>
      </div>

      {/* HIBÁK ÖSSZESÍTŐ TÁBLÁZAT */}
      <div className="section">

        <h3>📊 Hibák részletes összesítése</h3>

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
                .map((error, index) => (

                  <tr
                    key={`${error.errorNum}-${index}`}
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
                      {formatDuration(error.duration)}
                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

        </div>

        {errorStatistics.length > 20 && (
          <p className="table-note">
            Az első 20 hibatípus megjelenítve a{' '}
            {errorStatistics.length} közül.
          </p>
        )}

      </div>

      {/* LEGHOSSZABB HIBÁK */}
      <div className="section">

        <h3>⏱️ Leghosszabb hibák</h3>

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

              {longestErrors.map((row, index) => (

                <tr
                  key={`longest-${index}`}
                  className={
                    row['Fehler-Typ']
                      ? String(row['Fehler-Typ']).toLowerCase()
                      : ''
                  }
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
                    {formatDuration(row.durationSeconds)}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      </div>

      {/* EREDETI RÉSZLETES ADATOK */}
      <div className="section">

        <h3>📋 Részletes Adatok</h3>

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

                  <tr
                    key={index}
                    className={
                      row['Fehler-Typ']
                        ? String(
                            row['Fehler-Typ']
                          ).toLowerCase()
                        : ''
                    }
                  >

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
