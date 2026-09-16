import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';
import FileUpload from './components/FileUpload';
import Analysis from './components/Analysis';
import Statistics from './components/Statistics';

function App() {
  const [uploadedData, setUploadedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleFileUpload = async (file, machineName) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('machineName', machineName);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedData(response.data);
      setActiveTab('analysis');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Feltöltési hiba történt!');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏭 Gépsor Hiba Elemzés</h1>
        <p>Excel adatok feldolgozása és kiértékelése</p>
      </header>

      <nav className="tabs">
        <button
          className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          📤 Feltöltés
        </button>
        {uploadedData && (
          <>
            <button
              className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              📊 Elemzés
            </button>
            <button
              className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
              onClick={() => setActiveTab('statistics')}
            >
              📈 Statisztikák
            </button>
          </>
        )}
      </nav>

      <main className="container">
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Feldolgozás folyamatban...</p>
          </div>
        )}

        {activeTab === 'upload' && <FileUpload onUpload={handleFileUpload} loading={loading} />}
        {activeTab === 'analysis' && uploadedData && <Analysis data={uploadedData} />}
        {activeTab === 'statistics' && uploadedData && <Statistics analysis={uploadedData.analysis} />}
      </main>
    </div>
  );
}

export default App;
