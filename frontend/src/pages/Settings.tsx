import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, UserPlus, History } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-card p-4">
        <div>
          <h2 className="text-base font-bold text-[#f4f2ff] tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#9875ff]" />
            Organization Governance & RBAC Security
          </h2>
          <p className="text-xs text-[#a6a4c3] mt-0.5">
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
            <div className="p-3.5 bg-[#080817]/70 rounded-xl border border-[rgba(160,140,255,0.14)]">
              <span className="text-[#a6a4c3] block text-[10px] uppercase">Organization Name</span>
              <span className="font-bold text-[#f4f2ff] text-sm mt-0.5 block">{profile.name}</span>
            </div>
            <div className="p-3.5 bg-[#080817]/70 rounded-xl border border-[rgba(160,140,255,0.14)]">
              <span className="text-[#a6a4c3] block text-[10px] uppercase">Tenant Slug</span>
              <span className="font-bold text-[#9875ff] text-sm mt-0.5 block">{profile.slug}</span>
            </div>
            <div className="p-3.5 bg-[#080817]/70 rounded-xl border border-[rgba(160,140,255,0.14)]">
              <span className="text-[#a6a4c3] block text-[10px] uppercase">Primary Domain</span>
              <span className="font-bold text-[#f4f2ff] text-sm mt-0.5 block">{profile.domain || 'apex-nexus.com'}</span>
            </div>
            <div className="p-3.5 bg-[#080817]/70 rounded-xl border border-[rgba(160,140,255,0.14)]">
              <span className="text-[#a6a4c3] block text-[10px] uppercase">Active Plan</span>
              <span className="font-bold text-[#35d6a0] text-sm mt-0.5 block">{profile.plan_tier || 'ENTERPRISE'}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Team Members List */}
      <Card title={`Organization Members & Role Assignments (${users.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#080817]/70 text-[#a6a4c3] font-mono uppercase text-[11px] border-b border-[rgba(160,140,255,0.15)]">
              <tr>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(160,140,255,0.08)]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#f4f2ff]">{u.full_name}</td>
                  <td className="py-2.5 px-3 text-[#a6a4c3] font-mono">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#7957e8]/15 text-[#9875ff] border border-[#7957e8]/30">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={u.is_active ? 'success' : 'default'}>
                      {u.is_active ? 'ACTIVE' : 'INVITED'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-[#a6a4c3] font-mono">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* System Audit Logs */}
      <Card title={`Immutable Security Audit Trail (${auditLogs.length} events)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#080817]/70 text-[#a6a4c3] uppercase text-[11px] border-b border-[rgba(160,140,255,0.15)]">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Entity</th>
                <th className="py-2 px-3">Actor Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(160,140,255,0.08)] text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.03]">
                  <td className="py-2 px-3 text-[#a6a4c3]">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-2 px-3 font-semibold text-[#f4f2ff]">{log.action}</td>
                  <td className="py-2 px-3 text-[#9875ff]">{log.entity_type}</td>
                  <td className="py-2 px-3 text-[#a6a4c3]">{log.user_email}</td>
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
            <label className="font-semibold text-[#f4f2ff] block mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. David Vance"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-1 focus:ring-[#9875ff] focus:border-[#9875ff]"
            />
          </div>
          <div>
            <label className="font-semibold text-[#f4f2ff] block mb-1">Corporate Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. david.vance@apex-nexus.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-1 focus:ring-[#9875ff] focus:border-[#9875ff]"
            />
          </div>
          <div>
            <label className="font-semibold text-[#f4f2ff] block mb-1">Assigned Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-1 focus:ring-[#9875ff] focus:border-[#9875ff]"
            >
              <option value="SupplyChainManager">Supply Chain Manager</option>
              <option value="ProcurementManager">Procurement Manager</option>
              <option value="OperationsAnalyst">Operations Analyst</option>
              <option value="Executive">Executive / Viewer</option>
              <option value="OrgAdmin">Organization Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(160,140,255,0.12)]">
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
