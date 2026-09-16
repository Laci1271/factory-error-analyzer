import React from 'react';
import './Analysis.css';

function Analysis({ data }) {
  const { rawData, machine, analysis } = data;

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <h2>📊 Adatok Elemzése</h2>
        <div className="machine-info">
          <span className="badge">{machine}</span>
          <span className="date">{new Date(data.uploadDate).toLocaleDateString('hu-HU')}</span>
        </div>
      </div>

      {/* Összefoglalás */}
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
      </div>

      {/* Hibák típusa szerinti bontás */}
      <div className="section">
        <h3>Hibák Típusa Szerinti Bontás</h3>
        <div className="type-breakdown">
          {Object.entries(analysis.errorTypes).map(([type, count]) => (
            <div key={type} className="breakdown-item">
              <span className="type-label">{type}</span>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${type.toLowerCase()}`}
                  style={{
                    width: `${(count / Math.max(...Object.values(analysis.errorTypes))) * 100}%`
                  }}
                ></div>
              </div>
              <span className="count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top 10 hibák */}
      <div className="section">
        <h3>🔝 Top 10 Hiba</h3>
        <div className="top-errors">
          {analysis.topErrors.map((error, index) => (
            <div key={index} className="error-item">
              <div className="error-rank">#{index + 1}</div>
              <div className="error-details">
                <h4>{error.errorNum} - {error.errorText}</h4>
                <p className="error-type">{error.errorType}</p>
              </div>
              <div className="error-count">{error.count}x</div>
            </div>
          ))}
        </div>
      </div>

      {/* Adatok táblázata */}
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
              {rawData.slice(0, 50).map((row, index) => (
                <tr key={index} className={row['Fehler-Typ'].toLowerCase()}>
                  <td>{row.rowIndex}</td>
                  <td>{row['Fehler-Nr.']}</td>
                  <td className="error-text">{row['Fehlertext']}</td>
                  <td>{row['Fehler-Typ']}</td>
                  <td>{row['Von']}</td>
                  <td>{row['Bis']}</td>
                  <td>{row['Dauer']}</td>
                  <td>{row['Fehler-Anzahl']}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rawData.length > 50 && (
            <p className="table-note">Az első 50 sor megjelenítve a {rawData.length} közül</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analysis;
