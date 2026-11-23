import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    organization_name: '',
    industry: 'Automotive & Industrial Components',
    full_name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please check parameters.');
    } finally {
      setLoading(false);
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
          Enterprise Tenant Onboarding
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-200/80 sm:px-10 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          <form className="space-y-3.5 text-xs" onSubmit={handleSubmit}>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Organization Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Global Dynamics"
                value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Industry Vertical</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="Automotive & Industrial Components">Automotive & Industrial Components</option>
                <option value="Semiconductors & High-Tech Electronics">Semiconductors & High-Tech Electronics</option>
                <option value="Aerospace & Defense Systems">Aerospace & Defense Systems</option>
                <option value="Pharmaceuticals & Medical Devices">Pharmaceuticals & Medical Devices</option>
                <option value="Heavy Machinery & Energy Equipment">Heavy Machinery & Energy Equipment</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Administrator Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Mercer"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Email Address</label>
              <input
                type="email"
                required
                placeholder="alex.mercer@apex-dynamics.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full mt-3"
            >
              Initialize Tenant & Control Tower
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <Link to="/login" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Already have an enterprise account? Sign In &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
