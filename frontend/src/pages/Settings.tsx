import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  Key,
  Database,
  Server,
  LogOut,
  Calendar,
  Layers,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/date';

export const Settings: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-8">
      <Header
        title="Settings & Profile"
        subtitle="View authenticated developer profile, active credentials, and platform architecture"
      />

      <div className="px-8 space-y-6 max-w-4xl">
        {/* User Profile Card */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Developer Profile</h3>
                <p className="text-xs text-slate-400">Authenticated user identity</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-slate-800"
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign Out
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Full Name
              </span>
              <p className="text-sm font-medium text-slate-200">{user?.name || 'DevFlow Developer'}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                Email Address
              </span>
              <p className="text-sm font-mono text-slate-200">{user?.email || 'N/A'}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                User ID (UUID)
              </span>
              <p className="text-xs font-mono text-slate-300 truncate" title={user?.id}>
                {user?.id || 'N/A'}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Member Since
              </span>
              <p className="text-sm text-slate-200">
                {user?.created_at ? formatDate(user.created_at) : 'Active Session'}
              </p>
            </div>
          </div>
        </div>

        {/* Security & Session Info */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Security & Session</h3>
              <p className="text-xs text-slate-400">Session status and authentication credentials policy</p>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-300">Session Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                  isAuthenticated
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isAuthenticated ? 'ACTIVE (BEARER AUTH)' : 'NOT AUTHENTICATED'}
                </span>
              </div>
              <div className="p-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Authentication Scheme</span>
                <span className="font-mono text-slate-200">OAuth2 Bearer (JWT HS256)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Tokens automatically expire after 30 minutes. API requests include an Authorization header interceptor.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Architecture Card */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">DevFlow Architecture</h3>
              <p className="text-xs text-slate-400">Underlying cloud deployment platform components</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                API Service
              </div>
              <p className="text-slate-400 font-mono">FastAPI 0.115.0 (Python 3.12)</p>
              <p className="text-[11px] text-slate-400">Base URL: http://localhost:8000/api/v1</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                Database & ORM
              </div>
              <p className="text-slate-400 font-mono">PostgreSQL 15 + SQLAlchemy 2.0</p>
              <p className="text-[11px] text-slate-400">Managed via Alembic migrations</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Auth & Security
              </div>
              <p className="text-slate-400 font-mono">JWT HS256 + Passlib (Bcrypt)</p>
              <p className="text-[11px] text-slate-400">Strict ownership verification</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Frontend Client
              </div>
              <p className="text-slate-400 font-mono">React 18 + Vite + Tailwind CSS</p>
              <p className="text-[11px] text-slate-400">TypeScript strict mode</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
