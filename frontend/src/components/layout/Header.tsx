import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import axios from 'axios';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const rootUrl = import.meta.env.VITE_API_BASE_URL
          ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')
          : 'http://localhost:8000';
        const res = await axios.get(`${rootUrl}/health`, { timeout: 3000 });
        setBackendHealthy(res.status === 200);
      } catch {
        setBackendHealthy(false);
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0B0F19]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Backend Connectivity Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900 border border-slate-800">
          <span
            className={`w-2 h-2 rounded-full ${
              backendHealthy === true
                ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                : backendHealthy === false
                ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span className="text-slate-300 font-mono text-[11px]">
            {backendHealthy === true
              ? 'API Online'
              : backendHealthy === false
              ? 'API Offline'
              : 'Connecting...'}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Terminal className="w-3 h-3 text-cyan-400" />
            FastAPI 0.115
          </span>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};
