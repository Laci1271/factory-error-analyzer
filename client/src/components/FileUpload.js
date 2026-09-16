import React, { useState } from 'react';
import './FileUpload.css';

function FileUpload({ onUpload, loading }) {
  const [file, setFile] = useState(null);
  const [machineName, setMachineName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || !machineName) {
      alert('Kérjük válassz fájlt és gépet!');
      return;
    }
    onUpload(file, machineName);
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2>📤 Excel Fájl Feltöltése</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="machine">Gép Kiválasztása:</label>
            <select
              id="machine"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Válassz gépet --</option>
              <option value="RendszerDiagnózis">RendszerDiagnózis</option>
              <option value="Gép 1">Gép 1</option>
              <option value="Gép 2">Gép 2</option>
              <option value="Gép 3">Gép 3</option>
              <option value="Gép 4">Gép 4</option>
              <option value="Gép 5">Gép 5</option>
              <option value="Gép 6">Gép 6</option>
              <option value="Gép 7">Gép 7</option>
              <option value="Gép 8">Gép 8</option>
            </select>
          </div>

          <div
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-input"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="drop-label">
              <div className="drop-icon">📁</div>
              <p>Húzd ide az Excel fájlt vagy kattints a kiválasztáshoz</p>
              <small>Támogatott: .xlsx, .xls</small>
            </label>
          </div>

          {file && (
            <div className="file-preview">
              <p>✅ Kiválasztott fájl: <strong>{file.name}</strong></p>
              <p>Méret: {(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={!file || !machineName || loading}
          >
            {loading ? '⏳ Feldolgozás...' : '🚀 Feltöltés és Elemzés'}
          </button>
        </form>
      </div>

      <div className="info-box">
        <h3>ℹ️ Instrukcióink</h3>
        <ul>
          <li>Válassz egy gépet a listából</li>
          <li>Töltsd fel az Excel fájlt (drag & drop vagy kattintás)</li>
          <li>A fájl automatikusan feldolgozásra kerül</li>
          <li>Nézd meg az eredményeket az Elemzés fülön</li>
        </ul>
      </div>
    </div>
  );
}

export default FileUpload;
