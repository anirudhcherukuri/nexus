import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Shield, UserPlus, History } from 'lucide-react';
import api from '../api/client';
import { User, AuditLogItem } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const Settings: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('OperationsAnalyst');

  const loadData = async () => {
    try {
      const [profRes, userRes, logRes] = await Promise.all([
        api.get('/organizations/profile'),
        api.get<User[]>('/organizations/users'),
        api.get<AuditLogItem[]>('/organizations/audit-logs'),
      ]);
      setProfile(profRes.data);
      setUsers(userRes.data);
      setAuditLogs(logRes.data);
    } catch (err) {
      console.error('Failed to load settings data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/organizations/invite?email=${encodeURIComponent(inviteEmail)}&full_name=${encodeURIComponent(inviteName)}&role=${inviteRole}`);
      alert(`Invitation issued for ${inviteEmail}`);
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      loadData();
    } catch (err) {
      alert('Failed to invite user.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-slate-700" />
            Organization Governance & RBAC Security
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-tenant data isolation partition, role assignments, and immutable system audit log.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsInviteOpen(true)}
          icon={<UserPlus className="w-3.5 h-3.5" />}
        >
          Invite Team Member
        </Button>
      </div>

      {/* Organization Overview Card */}
      {profile && (
        <Card title="Tenant Organization Profile">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">Organization Name</span>
              <span className="font-bold text-slate-900 text-sm">{profile.name}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">Tenant Slug</span>
              <span className="font-bold text-slate-900 text-sm">{profile.slug}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">Industry Vertical</span>
              <span className="font-bold text-slate-900 text-sm">{profile.industry}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">SaaS Plan Tier</span>
              <span className="font-bold text-blue-600 text-sm">{profile.plan_tier}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Users & Team Members */}
      <Card title={`Active Organization Members (${users.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{u.full_name}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono">{u.email}</td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={u.is_active ? 'success' : 'danger'}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit Logs */}
      <Card title={`System Audit Trail (${auditLogs.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Entity</th>
                <th className="py-2 px-3">Actor Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-2 px-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{log.action}</td>
                  <td className="py-2 px-3 text-slate-600">{log.entity_type}</td>
                  <td className="py-2 px-3 text-slate-500">{log.user_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Organization Member"
        subtitle="Grant role-based operational permissions within this tenant partition."
      >
        <form onSubmit={handleInvite} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. David Vance"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Corporate Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. david.vance@apex-nexus.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Assigned Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
            >
              <option value="SupplyChainManager">Supply Chain Manager</option>
              <option value="ProcurementManager">Procurement Manager</option>
              <option value="OperationsAnalyst">Operations Analyst</option>
              <option value="Executive">Executive / Viewer</option>
              <option value="OrgAdmin">Organization Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
