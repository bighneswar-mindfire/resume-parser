import { useState } from 'react';
import Dashboard from './components/Dashboard';
import ResumeResults from './components/ResumeResults';
import InsightsCharts from './components/InsightsCharts';
import './App.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [insightsKey, setInsightsKey] = useState(0);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="text-2xl font-bold text-gray-900">Resume Parser</h1>
      </header>
      <main className="app-main">
        <Dashboard onUploadComplete={() => setRefreshKey((k) => k + 1)} />
        <ResumeResults
          refreshKey={refreshKey}
          onParsingSettled={() => setInsightsKey((k) => k + 1)}
        />
        <InsightsCharts refreshKey={refreshKey + insightsKey} />
      </main>
    </div>
  );
}

export default App;
