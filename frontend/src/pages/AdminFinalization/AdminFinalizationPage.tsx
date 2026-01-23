import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Settings, Lock, Check, Unlock } from 'lucide-react';
import { getApiErrorMessage } from '@/api/error';
import { useToast } from '@/context/ToastContext';
import { useMealSummaryQuery } from '@/query/hooks/useMealSummaryQuery';
import { useFinalizeMealMutation, useReopenVotingMutation } from '@/query/hooks/useAdminMealMutations';
import type { VoteSummary } from '@/types';
import { useFamily } from '@/context/FamilyContext'
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, PageShell } from '@/components/Layout';
import './AdminFinalizationPage.css';

function getStandingsColor(index: number) {
  if (index === 0) return 'var(--color-primary)';
  if (index === 1) return 'var(--btn-error)';
  return 'var(--btn-info)';
}

const AdminFinalizationPage: React.FC = () => {
  const navigate = useNavigate();
  const { mealId } = useParams();
  const toast = useToast();
  const { family } = useFamily()

  const [error, setError] = useState<string | null>(null);

  const mealSummaryQuery = useMealSummaryQuery(mealId);
  const finalizeMeal = useFinalizeMealMutation();
  const reopenVoting = useReopenVotingMutation();

  const mealSummary = mealSummaryQuery.data ?? null;
  const isLoading = mealSummaryQuery.isLoading;
  const isSaving = finalizeMeal.isPending || reopenVoting.isPending;

  const standings: VoteSummary[] = useMemo(() => mealSummary?.voteSummary ?? [], [mealSummary]);
  const totalVotes = useMemo(() => standings.reduce((sum, item) => sum + item.voteCount, 0), [standings]);
  const uniqueVoters = useMemo(() => {
    const meta = mealSummary as unknown as { uniqueVoters?: number; voterCount?: number; votersCount?: number } | null
    const reported = meta?.uniqueVoters ?? meta?.voterCount ?? meta?.votersCount
    if (typeof reported === 'number') return reported
    const counts = standings.map((s) => s.voteCount).filter((n) => typeof n === 'number')
    return counts.length > 0 ? Math.max(...counts) : 0
  }, [mealSummary, standings]);

  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [cookUserId, setCookUserId] = useState<string>('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    setSelectedWinner('');
    setReason('');
    setError(null);
  }, [mealId]);

  useEffect(() => {
    if (!mealSummary) return;
    const initial = mealSummary.finalDecision?.selectedProposalId ?? mealSummary.voteSummary[0]?.proposalId ?? '';
    if (!initial) return;
    setSelectedWinner((prev) => prev || initial);
  }, [mealSummary]);

  useEffect(() => {
    if (!mealSummary) return
    const initialCook =
      mealSummary.finalDecision?.cookUserId ??
      mealSummary.proposals?.find((p) => p.id === selectedWinner)?.userId ??
      family?.members?.[0]?.userId ??
      ''
    if (!initialCook) return
    setCookUserId((prev) => prev || initialCook)
  }, [family?.members, mealSummary, selectedWinner])

  const loadErrorMessage = useMemo(() => {
    const err = mealSummaryQuery.error;
    return err ? getApiErrorMessage(err, 'Failed to load admin data.') : null;
  }, [mealSummaryQuery.error]);

  const lastLoadErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!loadErrorMessage) return;
    if (lastLoadErrorRef.current === loadErrorMessage) return;
    lastLoadErrorRef.current = loadErrorMessage;
    toast.error(loadErrorMessage);
  }, [loadErrorMessage, toast]);

  const handleFinalize = async () => {
    if (!mealId) {
      toast.error('Missing meal id.');
      return;
    }
    if (!selectedWinner) {
      toast.error('Please select a winning proposal.');
      return;
    }
    if (!cookUserId) {
      toast.error('Please assign a cook.');
      return
    }

    setError(null);
    try {
      await finalizeMeal.mutateAsync({
        mealId,
        selectedProposalId: selectedWinner,
        cookUserId,
        reason: reason || undefined,
      });
      toast.success('Meal finalized.');
      navigate('/');
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to finalize meal.');
      setError(message);
      toast.error(message);
    }
  };

  const handleReopenVoting = async () => {
    if (!mealId) {
      toast.error('Missing meal id.');
      return;
    }
    setError(null);
    try {
      await reopenVoting.mutateAsync(mealId);
      toast.success('Voting reopened.');
      navigate(`/meals/${mealId}/vote`);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to reopen voting.');
      setError(message);
      toast.error(message);
    }
  };

  const statusLabel = mealSummary?.meal.status ?? 'PLANNING';
  const pageError = error ?? loadErrorMessage;

  return (
    <div className="admin-finalization-page">
      <PageShell>
        <PageHeader
          title="Admin Finalization"
          align="center"
          left={
            <Button variant="ghost" size="icon" className="btn-back" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft size={24} />
            </Button>
          }
          right={
            <Button variant="ghost" size="icon" aria-label="Admin settings">
              <Settings size={20} />
            </Button>
          }
        />
        {pageError && (
          <Card role="alert" className="mt-4">
            <CardContent className="p-4">
              <p style={{ margin: 0 }}>{pageError}</p>
            </CardContent>
          </Card>
        )}

        <section className="meal-header">
          <h2 className="meal-event-title">
            {mealSummary ? `${mealSummary.meal.mealType} Meal` : 'Meal'}
          </h2>
          <p className="meal-event-date">{mealSummary?.meal.scheduledFor ?? ''}</p>
        </section>

        <div className="vote-summary">
          <Card className="summary-card border-0 shadow-none">
            <div className="summary-label">TOTAL VOTES</div>
            <div className="summary-value">{isLoading ? '—' : totalVotes}</div>
          </Card>
          <Card className="summary-card border-0 shadow-none">
            <div className="summary-label">VOTERS</div>
            <div className="summary-value pending">{isLoading ? '—' : uniqueVoters}</div>
          </Card>
        </div>

        <section className="standings-section">
          <div className="section-header">
            <h3 className="section-title">Current Standings</h3>
            <Badge variant="outline" className="gap-1">
              <Lock size={12} />
              <span>{statusLabel}</span>
            </Badge>
          </div>
          <p className="section-subtitle">Results are in</p>

          <div className="standings-list">
            {standings.map((item, index) => {
              const percentage = totalVotes === 0 ? 0 : Math.round((item.voteCount / totalVotes) * 100);
              return (
              <div key={item.proposalId} className="standing-item">
                <div className="standing-info">
                  <span className="standing-emoji">🍽️</span>
                  <span className="standing-name">{item.dishName}</span>
                </div>
                <div className="standing-stats">
                  <span className="standing-votes">
                    {item.voteCount} votes ({percentage}%)
                  </span>
                  <div className="standing-bar" style={{ width: '100%', background: '#f0f0f0', borderRadius: '4px', height: '8px' }}>
                    <div
                      className="standing-fill"
                      style={{
                        width: `${percentage}%`,
                        background: getStandingsColor(index),
                        height: '100%',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            )})}
          </div>
        </section>

        <section className="winner-selection">
          <h3 className="section-title">Pick the Winner</h3>
          <p className="section-subtitle">Select the official choice (overrides votes if needed)</p>

          <div className="winner-options">
            {standings.map((item) => (
              <label key={item.proposalId} className={`winner-option ${selectedWinner === item.proposalId ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="winner"
                  value={item.proposalId}
                  checked={selectedWinner === item.proposalId}
                  onChange={(e) => setSelectedWinner(e.target.value)}
                  className="winner-radio"
                />
                <span className="winner-emoji">🍽️</span>
                <span className="winner-name">{item.dishName}</span>
                {selectedWinner === item.proposalId && (
                  <span className="selected-icon"><Check size={16} /></span>
                )}
              </label>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor="cook" className="form-label">
              Assign Cook
            </label>
            <select
              id="cook"
              value={cookUserId}
              onChange={(e) => setCookUserId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isSaving || isLoading}
            >
              <option value="" disabled>
                Select a cook…
              </option>
              {(family?.members ?? []).map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name || m.username || 'Member'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reason" className="form-label">
              Final Decision Reason
            </label>
            <Textarea
              id="reason"
              placeholder="Add a note for the family (optional)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </section>

        <div className="action-buttons">
          <Button size="lg" className="w-full" onClick={handleFinalize} disabled={isSaving || isLoading}>
            {isSaving ? <span className="spinner" aria-hidden="true" /> : <Check size={20} />}
            <span>Finalize Meal</span>
          </Button>
          <Button variant="secondary" size="lg" className="w-full" onClick={handleReopenVoting} disabled={isSaving || isLoading}>
            <Unlock size={20} />
            <span>Reopen Voting</span>
          </Button>
        </div>
      </PageShell>
    </div>
  );
};

export default AdminFinalizationPage;
