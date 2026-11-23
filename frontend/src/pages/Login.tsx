import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, quickStartDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setQuickLoading(true);
    setError('');
    try {
      await quickStartDemo();
      navigate('/');
    } catch (err) {
      setError('Failed to launch quick demo environment.');
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-white mx-auto shadow-lg shadow-blue-500/20 mb-3">
          <Zap className="w-6 h-6 fill-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-mono">NEXUS</h2>
        <p className="mt-1 text-xs text-slate-400 font-mono tracking-wider uppercase">
          AI Supply Network Intelligence & Disruption Simulator
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-200/80 sm:px-10 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* 1-Click Instant Demo Login Banner */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Instant Enterprise Demonstration</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Explore <b>Apex Manufacturing Group</b> (30 multi-tier suppliers, 5 plants, BOM trees, and semiconductor disruption scenario) with zero setup.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleQuickDemo}
              isLoading={quickLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              One-Click Demo Launch
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-mono">
              <span className="bg-white px-2 text-slate-400">Or sign in with corporate credentials</span>
            </div>
          </div>

          {/* Standard Login Form */}
          <form className="space-y-4 text-xs" onSubmit={handleLogin}>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Email Address</label>
              <input
                type="email"
                required
                placeholder="executive@apex-nexus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full mt-2"
            >
              Sign In to Control Tower
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <Link to="/register" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Register a New Enterprise Organization &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
