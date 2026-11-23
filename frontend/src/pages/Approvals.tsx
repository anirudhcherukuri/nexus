import React, { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle, MessageSquare } from 'lucide-react';
import api from '../api/client';
import { ApprovalRequest } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const Approvals: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState<ApprovalRequest | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED'>('APPROVED');
  const [comments, setComments] = useState('');

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApprovalRequest[]>('/approvals');
      setApprovals(res.data);
    } catch (err) {
      console.error('Failed to load approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const openDecisionModal = (req: ApprovalRequest, type: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED') => {
    setActiveRequest(req);
    setDecisionType(type);
    setComments('');
    setDecisionModalOpen(true);
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    try {
      await api.post(`/approvals/${activeRequest.id}/decide`, {
        status: decisionType,
        comments: comments,
      });
      setDecisionModalOpen(false);
      loadApprovals();
    } catch (err) {
      alert('Failed to submit approval decision.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-card p-4">
        <div>
          <h2 className="text-base font-bold text-[#f4f2ff] tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#35d6a0]" />
            Human-in-the-Loop Governance & Approval Desk
          </h2>
          <p className="text-xs text-[#a6a4c3] mt-0.5">
            Strict enterprise safeguard: No AI agent recommendation can be committed to ERP without human signoff.
          </p>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {approvals.map((req) => (
          <Card key={req.id} className="hover:border-[#9875ff]/35 transition-all">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      req.status === 'APPROVED'
                        ? 'success'
                        : req.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {req.status}
                  </Badge>
                  <span className="font-mono text-xs text-[#a6a4c3]">
                    Ref: {req.id.substring(0, 8)}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#f4f2ff]">{req.title}</h4>
                <p className="text-xs text-[#a6a4c3] leading-relaxed max-w-3xl">
                  {req.recommendation_summary}
                </p>

                <div className="pt-2 flex items-center gap-4 text-xs font-mono text-[#a6a4c3]">
                  <span>Requested By: {req.requested_by_name || 'System Analyst'}</span>
                  <span>Submitted: {new Date(req.created_at).toLocaleDateString()}</span>
                </div>

                {req.comments && (
                  <div className="mt-2 text-xs p-2.5 rounded-lg bg-[#080817]/70 border border-[rgba(160,140,255,0.14)] text-[#a6a4c3] flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#9875ff] mt-0.5 flex-shrink-0" />
                    <span>Reviewer Rationale: {req.comments}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending Items */}
              {req.status === 'PENDING' && (
                <div className="flex items-center gap-2 flex-shrink-0 self-end lg:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDecisionModal(req, 'REVISION_REQUESTED')}
                  >
                    Request Revision
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => openDecisionModal(req, 'REJECTED')}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openDecisionModal(req, 'APPROVED')}
                    className="!bg-gradient-to-r !from-[#059669] !to-[#35d6a0] !border-[#35d6a0]/40 text-white"
                  >
                    Approve Strategy
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}

        {approvals.length === 0 && (
          <div className="p-8 text-center glass-card">
            <CheckCircle className="w-8 h-8 text-[#35d6a0] mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-[#f4f2ff]">No Pending Approvals</h4>
            <p className="text-xs text-[#a6a4c3] mt-1">
              Submit a strategy from the Mitigation Planner or launch an AI Agent investigation to stage an approval.
            </p>
          </div>
        )}
      </div>

      {/* Decision Dialog Modal */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={`Confirm Decision: ${decisionType}`}
        subtitle="This action will be committed to the enterprise immutable audit trail."
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#f4f2ff] block mb-1">Reviewer Executive Rationale</label>
            <textarea
              required
              rows={3}
              placeholder="Provide business justification or operational constraints..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-3 py-2 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-1 focus:ring-[#9875ff] focus:border-[#9875ff]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(160,140,255,0.12)]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setDecisionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decisionType === 'APPROVED' ? 'primary' : decisionType === 'REJECTED' ? 'danger' : 'outline'}
              size="sm"
              className={decisionType === 'APPROVED' ? '!bg-gradient-to-r !from-[#059669] !to-[#35d6a0] !border-[#35d6a0]/40 text-white' : ''}
            >
              Confirm {decisionType}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
