import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-[#080817] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#7957e8]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-[#42d9e8]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#7957e8] to-[#9875ff] flex items-center justify-center font-bold text-white mx-auto shadow-[0_0_25px_rgba(152,117,255,0.4)] mb-3 border border-[#9875ff]/40">
          <Zap className="w-6 h-6 fill-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#f4f2ff] font-mono drop-shadow-sm">NEXUS</h2>
        <p className="mt-1 text-xs text-[#a6a4c3] font-mono tracking-wider uppercase">
          Enterprise Tenant Onboarding
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-card py-8 px-6 sm:px-10 space-y-5 border border-[rgba(160,140,255,0.25)] shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(152,117,255,0.15)]">
          {error && (
            <div className="p-3 bg-[#ff718a]/10 border border-[#ff718a]/30 rounded-lg text-xs text-[#ff718a]">
              {error}
            </div>
          )}

          <form className="space-y-3.5 text-xs" onSubmit={handleSubmit}>
            <div>
              <label className="block font-semibold text-[#f4f2ff] mb-1">Company / Organization Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Global Dynamics"
                value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-2 focus:ring-[#9875ff] focus:border-[#9875ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#f4f2ff] mb-1">Industry Vertical</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-2 focus:ring-[#9875ff] focus:border-[#9875ff] focus:outline-none"
              >
                <option value="Automotive & Industrial Components">Automotive & Industrial Components</option>
                <option value="Semiconductors & High-Tech Electronics">Semiconductors & High-Tech Electronics</option>
                <option value="Aerospace & Defense Systems">Aerospace & Defense Systems</option>
                <option value="Pharmaceuticals & Medical Devices">Pharmaceuticals & Medical Devices</option>
                <option value="Heavy Machinery & Energy Equipment">Heavy Machinery & Energy Equipment</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#f4f2ff] mb-1">Executive Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Elena Rostova"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-2 focus:ring-[#9875ff] focus:border-[#9875ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#f4f2ff] mb-1">Corporate Email Address</label>
              <input
                type="email"
                required
                placeholder="elena.rostova@apex-nexus.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-2 focus:ring-[#9875ff] focus:border-[#9875ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#f4f2ff] mb-1">Master Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-2 focus:ring-[#9875ff] focus:border-[#9875ff] focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full mt-3"
            >
              Initialize Tenant Organization
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-[rgba(160,140,255,0.12)]">
            <Link to="/login" className="text-xs text-[#9875ff] hover:text-[#9875ff]/80 font-medium">
              Already have an enterprise account? Sign In &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
