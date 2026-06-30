import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Server, Layout, Database, Activity, RefreshCw, ChevronRight, CheckCircle } from 'lucide-react';
import { useStore } from './store/useStore';
import './App.css';

// Navbar Component
const Navbar = () => (
  <nav className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex justify-between items-center">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/30">
        PA
      </div>
      <div>
        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Pocket Agencom
        </span>
        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
          Monorepo
        </span>
      </div>
    </div>
    <div className="flex space-x-6 text-sm font-medium">
      <Link to="/" className="text-slate-300 hover:text-white transition-colors duration-200">
        Home
      </Link>
      <Link to="/tech-stack" className="text-slate-300 hover:text-white transition-colors duration-200">
        Tech Stack
      </Link>
    </div>
  </nav>
);

// Home View
const Home = () => {
  const { count, increaseCount, resetCount } = useStore();
  const [apiStatus, setApiStatus] = useState('connecting');
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/')
      .then((res) => res.json())
      .then((data) => {
        setApiStatus('online');
        setApiMessage(data.message);
      })
      .catch(() => {
        setApiStatus('offline');
        setApiMessage('Backend server is not reachable.');
      });
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 md:p-12 text-left">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Next-Gen Full-Stack <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Monorepo Architecture
            </span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Welcome to your pre-configured monorepo workspace. This setup binds a lightning-fast React + Vite frontend with an Express API and database schemas powered by Prisma ORM.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="#zustand-demo"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all duration-200"
            >
              Try Zustand Store
            </a>
            <Link
              to="/tech-stack"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-all duration-200 inline-flex items-center gap-2"
            >
              Explore Tech Stack <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Frontend Status */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-left space-y-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Layout size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Frontend Service</h3>
            <p className="text-slate-400 text-sm mt-1">React client rendering via Vite. Tailwind configuration active.</p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400 bg-sky-500/10 w-fit px-2.5 py-1 rounded-full border border-sky-500/20">
            <Activity size={12} className="animate-pulse" />
            <span>Vite Port: 5173</span>
          </div>
        </div>

        {/* Backend Status */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-left space-y-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <Server size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Backend API</h3>
            <p className="text-slate-400 text-sm mt-1">Express API handler. CORS enabled. Dotenv environment loaded.</p>
          </div>
          <div className="flex items-center space-x-2">
            {apiStatus === 'online' ? (
              <span className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle size={12} />
                <span>API Online (Port 5000)</span>
              </span>
            ) : apiStatus === 'connecting' ? (
              <span className="flex items-center space-x-2 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <RefreshCw size={12} className="animate-spin" />
                <span>Checking API...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                <span>API Offline</span>
              </span>
            )}
          </div>
        </div>

        {/* Database layer */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-left space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Database ORM</h3>
            <p className="text-slate-400 text-sm mt-1">Prisma Client mapped for database schemas and migrations.</p>
          </div>
          <div className="text-xs font-semibold text-amber-400 bg-amber-500/10 w-fit px-2.5 py-1 rounded-full border border-amber-500/20">
            PostgreSQL Ready
          </div>
        </div>
      </div>

      {/* API Message Callout */}
      {apiStatus === 'online' && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left flex items-start space-x-3">
          <CheckCircle className="text-emerald-400 mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-emerald-400 font-semibold text-sm">Successfully Connected to Backend</p>
            <p className="text-slate-300 text-sm mt-0.5">{apiMessage}</p>
          </div>
        </div>
      )}

      {/* Zustand Demo Section */}
      <div id="zustand-demo" className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-left space-y-6">
        <h2 className="text-2xl font-bold text-white">Zustand Global State Store</h2>
        <p className="text-slate-400">
          This counter is hooked directly to a global Zustand store. If you navigate between pages, the state will persist seamlessly.
        </p>
        <div className="flex items-center space-x-4">
          <div className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-xl font-mono text-2xl text-white">
            Count: {count}
          </div>
          <button
            onClick={increaseCount}
            className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition duration-200"
          >
            Increment Count
          </button>
          <button
            onClick={resetCount}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition duration-200"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

// Tech Stack View
const TechStack = () => (
  <div className="space-y-8 text-left">
    <div>
      <h2 className="text-3xl font-extrabold text-white">Project Tech Stack</h2>
      <p className="text-slate-400 mt-2">The architecture is designed to support scalable full-stack development.</p>
    </div>

    <div className="grid md:grid-cols-2 gap-8">
      {/* Frontend Details */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-2">Frontend Layer</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0"></div>
            <div>
              <span className="font-semibold text-white">React & Vite:</span>
              <p className="text-slate-400 text-sm">Provides Hot Module Replacement (HMR) for ultra-fast interface rendering and updates.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0"></div>
            <div>
              <span className="font-semibold text-white">Tailwind CSS:</span>
              <p className="text-slate-400 text-sm">Utility-first CSS framework configuration mapped inside root configurations.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0"></div>
            <div>
              <span className="font-semibold text-white">Zustand Store:</span>
              <p className="text-slate-400 text-sm">Extremely lightweight hooks-based state management that is easy to declare and configure.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0"></div>
            <div>
              <span className="font-semibold text-white">React Router v6:</span>
              <p className="text-slate-400 text-sm">Standard declarative route handling across different views.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Details */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-2">Backend & Database Layer</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
            <div>
              <span className="font-semibold text-white">Node & Express API:</span>
              <p className="text-slate-400 text-sm">Standard routing handler with built-in CORS configurations to easily communicate with local API requests.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
            <div>
              <span className="font-semibold text-white">Prisma ORM Client:</span>
              <p className="text-slate-400 text-sm">Automated type-safe database queries mapped through database migration pipelines.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
            <div>
              <span className="font-semibold text-white">PostgreSQL Configuration:</span>
              <p className="text-slate-400 text-sm">Configurable database connection URL inside isolated environment variables.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="pt-6">
      <Link
        to="/"
        className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-all duration-200 inline-block"
      >
        Back to Dashboard
      </Link>
    </div>
  </div>
);

// Main App component wrapping router
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-violet-500/30 selection:text-violet-200">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tech-stack" element={<TechStack />} />
          </Routes>
        </main>
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 text-center py-6 text-sm">
          <p>© {new Date().getFullYear()} Pocket Agencom. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
