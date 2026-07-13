import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Resume Parser</h1>
        <p className="app-subtitle">Parsing analytics dashboard</p>
      </header>
      <main className="app-main">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
