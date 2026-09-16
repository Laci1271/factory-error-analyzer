import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './Statistics.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Statistics({ analysis }) {
  // Pie chart data - Hibák típusa szerinti megoszlás
  const pieChartData = {
    labels: Object.keys(analysis.errorTypes),
    datasets: [
      {
        data: Object.values(analysis.errorTypes),
        backgroundColor: ['#f5576c', '#fa709a', '#fee140', '#4facfe', '#00f2fe'],
        borderColor: ['#fff', '#fff', '#fff', '#fff', '#fff'],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Bar chart data - Top 10 hibák
  const topErrorsLabels = analysis.topErrors.slice(0, 10).map(e => `${e.errorNum}`);
  const topErrorsCounts = analysis.topErrors.slice(0, 10).map(e => e.count);

  const barChartData = {
    labels: topErrorsLabels,
    datasets: [
      {
        label: 'Hibák száma',
        data: topErrorsCounts,
        backgroundColor: 'rgba(102, 126, 234, 0.7)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: true,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  // Statisztikai adatok
  const stats = [
    { label: 'Teljes hibaszám', value: analysis.totalErrors, icon: '❌' },
    { label: 'Figyelmeztetések', value: analysis.totalWarnings, icon: '⚠️' },
    { label: 'Feldolgozott sorok', value: analysis.totalRows, icon: '📋' },
    { 
      label: 'Átlagos hibaszám/sor', 
      value: (analysis.totalErrors / Math.max(analysis.totalRows, 1)).toFixed(2),
      icon: '📊'
    },
  ];

  return (
    <div className="statistics-container">
      <h2>📈 Statisztikák és Grafikonok</h2>

      {/* KPI Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Pie Chart */}
        <div className="chart-container">
          <h3>Hibák típusa szerinti megoszlás</h3>
          <div className="chart-wrapper">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="chart-container">
          <h3>Top 10 Hiba</h3>
          <div className="chart-wrapper">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="detailed-stats">
        <h3>Részletes Statisztikák</h3>
        <div className="stats-table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Hiba Típus</th>
                <th>Darabszám</th>
                <th>Százalék</th>
                <th>Sávdiagram</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analysis.errorTypes).map(([type, count]) => {
                const total = Object.values(analysis.errorTypes).reduce((a, b) => a + b, 0);
                const percentage = ((count / total) * 100).toFixed(1);
                return (
                  <tr key={type}>
                    <td>{type}</td>
                    <td className="number">{count}</td>
                    <td className="number">{percentage}%</td>
                    <td>
                      <div className="mini-progress">
                        <div
                          className={`mini-progress-fill ${type.toLowerCase()}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
