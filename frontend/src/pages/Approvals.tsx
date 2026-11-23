import React, { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle, XCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-slate-700" />
            Human-in-the-Loop Governance & Approval Desk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict enterprise safeguard: No AI agent recommendation can be committed to ERP without human signoff.
          </p>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {approvals.map((req) => (
          <Card key={req.id} className="hover:border-slate-300 transition-all">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      req.status === 'APPROVED'
                        ? 'success'
                        : req.status === 'REJECTED'
                        ? 'danger'
                        : req.status === 'REVISION_REQUESTED'
                        ? 'warning'
                        : 'purple'
                    }
                  >
                    {req.status}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    Requested by: {req.requested_by_name || 'AI Agent'} • {new Date(req.created_at).toLocaleString()}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{req.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {req.recommendation_summary}
                </p>

                {req.comments && (
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium pt-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reviewer Comment: "{req.comments}"</span>
                    <span className="text-slate-400 font-mono">({req.reviewed_by_name})</span>
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
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={() => openDecisionModal(req, 'APPROVED')}
                  >
                    Approve Strategy
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}

        {approvals.length === 0 && (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">No Pending Approvals</h4>
            <p className="text-xs text-slate-500 mt-1">
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
            <label className="font-semibold text-slate-700 block mb-1">Reviewer Executive Rationale</label>
            <textarea
              required
              rows={3}
              placeholder="Provide business justification or operational constraints..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="secondary" size="sm" onClick={() => setDecisionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decisionType === 'APPROVED' ? 'primary' : decisionType === 'REJECTED' ? 'danger' : 'outline'}
              size="sm"
              className={decisionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : ''}
            >
              Confirm {decisionType}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
