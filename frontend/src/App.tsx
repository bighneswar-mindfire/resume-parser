import { useState } from 'react';
import Dashboard from './components/Dashboard';
import ResumeResults from './components/ResumeResults';
import './App.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Resume Parser</h1>
        <p className="app-subtitle">Parsing analytics dashboard</p>
      </header>
      <main className="app-main">
        <Dashboard onUploadComplete={() => setRefreshKey((k) => k + 1)} />
        <ResumeResults refreshKey={refreshKey} />
      </main>
    </div>
  );
}

export default App;
