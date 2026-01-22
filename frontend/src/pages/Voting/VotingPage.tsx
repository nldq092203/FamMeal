import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Info, Clock, GripVertical, Check, Image as ImageIcon, DollarSign, Timer } from 'lucide-react';
import { getApiErrorMessage } from '@/api/error';
import { useToast } from '@/context/ToastContext';
import { useMealSummaryQuery } from '@/query/hooks/useMealSummaryQuery';
import { useCastVotesMutation } from '@/query/hooks/useCastVotesMutation';
import type { ProposalWithStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader, PageShell } from '@/components/Layout';
import './VotingPage.css';

function getProposalImageUrl(proposal: ProposalWithStats) {
  return proposal.extra?.imageUrls?.[0] ?? null;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const VotingPage: React.FC = () => {
  const navigate = useNavigate();
  const { mealId } = useParams();
  const toast = useToast();

  const [rankedProposals, setRankedProposals] = useState<ProposalWithStats[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mealSummaryQuery = useMealSummaryQuery(mealId);
  const castVotes = useCastVotesMutation();

  const mealSummary = mealSummaryQuery.data ?? null;
  const isSubmitting = castVotes.isPending;

  const loadErrorMessage = useMemo(() => {
    const err = mealSummaryQuery.error;
    return err ? getApiErrorMessage(err, 'Failed to load voting data.') : null;
  }, [mealSummaryQuery.error]);

  const lastLoadErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!loadErrorMessage) return;
    if (lastLoadErrorRef.current === loadErrorMessage) return;
    lastLoadErrorRef.current = loadErrorMessage;
    toast.error(loadErrorMessage);
  }, [loadErrorMessage, toast]);

  const isLoading = mealSummaryQuery.isLoading;

  const mealConstraints = mealSummary?.meal.constraints
  const maxBudget = mealConstraints?.maxBudget ?? null
  const rawPrepTime = mealConstraints?.maxPrepTimeMinutes ?? mealConstraints?.maxPrepTime ?? null
  const budgetValue = useMemo(() => {
    if (maxBudget == null) return null
    return clampNumber(maxBudget, 10, 100)
  }, [maxBudget])

  const prepTimeValue = useMemo(() => {
    if (rawPrepTime == null) return null
    return clampNumber(rawPrepTime, 15, 120)
  }, [rawPrepTime])

  useEffect(() => {
    setRankedProposals([]);
    setDraggedIndex(null);
    setError(null);
  }, [mealId]);

  useEffect(() => {
    if (!mealSummary) return;
    if (rankedProposals.length > 0) return;

    const proposals = [...mealSummary.proposals];
    proposals.sort((a, b) => (b.voteStats.totalScore ?? 0) - (a.voteStats.totalScore ?? 0));

    setRankedProposals(proposals);
  }, [mealSummary, rankedProposals.length]);

  const handleDragStart = (index: number) => {
    if (isSubmitting) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (draggedIndex === null || draggedIndex === index) return;

    const newProposals = [...rankedProposals];
    const draggedItem = newProposals[draggedIndex];
    newProposals.splice(draggedIndex, 1);
    newProposals.splice(index, 0, draggedItem);

    setRankedProposals(newProposals);
    setDraggedIndex(index);
  };

  const handleSubmit = async () => {
    if (!mealId) {
      toast.error('Missing meal id.');
      return;
    }

    setError(null);
    try {
      await castVotes.mutateAsync({ mealId, rankedProposalIds: rankedProposals.map((p) => p.id) });
      toast.success('Votes submitted.');
      navigate('/');
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to submit votes.');
      setError(message);
      toast.error(message);
    }
  };

  const votingStatus = mealSummary?.meal.status ?? 'PLANNING';
  const pageError = error ?? loadErrorMessage;

  return (
    <div className="voting-page">
      <PageShell>
        <PageHeader
          title="Rank Your Favorites"
          align="center"
          left={
            <Button variant="ghost" size="icon" className="btn-back" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft size={24} />
            </Button>
          }
          right={
            <Button variant="ghost" size="icon" aria-label="Voting info">
              <Info size={20} />
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

        <section className="voting-hero">
          <h2 className="hero-title">Order by Preference</h2>
          <p className="hero-subtitle">
            Drag the handle <GripVertical size={16} className="drag-icon" /> to reorder. Top choice gets maximum points.
          </p>
        </section>

        <Card className="voting-timer">
          <div className="timer-label">
            <Clock size={16} className="timer-icon" />
            <span>{votingStatus === 'PLANNING' ? 'VOTING IS OPEN' : 'VOTING IS CLOSED'}</span>
          </div>
          <div className="timer-display">
            {isLoading ? (
              <div className="spinner" aria-label="Loading" />
            ) : (
              <div className="timer-unit">
                <div className="timer-value">{rankedProposals.length}</div>
                <div className="timer-text">PROPOSALS</div>
              </div>
            )}
          </div>
        </Card>

        {budgetValue != null || prepTimeValue != null ? (
          <Card className="constraints-card">
            <CardContent className="constraints-content">
              <div className="constraints-title">Meal Preferences</div>

              {budgetValue != null ? (
                <div className="constraint-block">
                  <div className="constraint-header">
                    <div className="constraint-label">
                      <DollarSign size={18} className="constraint-icon" aria-hidden="true" />
                      <span>Max Budget</span>
                    </div>
                    <span className="constraint-value">${budgetValue}/meal</span>
                  </div>

                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={budgetValue}
                    disabled
                    aria-label="Max budget"
                    className="constraint-range"
                    style={{
                      WebkitAppearance: 'none',
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((budgetValue - 10) / 90) * 100}%, hsl(var(--border)) ${((budgetValue - 10) / 90) * 100}%, hsl(var(--border)) 100%)`,
                    }}
                  />

                  <div className="constraint-scale" aria-hidden="true">
                    <span>$10</span>
                    <span>$50</span>
                    <span>$100+</span>
                  </div>
                </div>
              ) : null}

              {prepTimeValue != null ? (
                <div className="constraint-block">
                  <div className="constraint-header">
                    <div className="constraint-label">
                      <Timer size={18} className="constraint-icon" aria-hidden="true" />
                      <span>Max Prep Time</span>
                    </div>
                    <span className="constraint-value">{prepTimeValue} mins</span>
                  </div>

                  <input
                    type="range"
                    min={15}
                    max={120}
                    step={15}
                    value={prepTimeValue}
                    disabled
                    aria-label="Max prep time"
                    className="constraint-range"
                    style={{
                      WebkitAppearance: 'none',
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((prepTimeValue - 15) / 105) * 100}%, hsl(var(--border)) ${((prepTimeValue - 15) / 105) * 100}%, hsl(var(--border)) 100%)`,
                    }}
                  />

                  <div className="constraint-scale" aria-hidden="true">
                    <span>15m</span>
                    <span>60m</span>
                    <span>2h+</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="ranked-list">
          {rankedProposals.map((proposal, index) => {
            const imageUrl = getProposalImageUrl(proposal);
            return (
              <Card
                key={proposal.id}
                className="ranked-item"
                draggable={!isSubmitting}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
              >
                <div className="rank-badge">{index + 1}</div>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={proposal.dishName}
                    className="ranked-image"
                    loading="lazy"
                  />
                ) : (
                  <div className="ranked-image flex items-center justify-center bg-muted border border-border">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
                <div className="ranked-info">
                  <h3 className="ranked-title">{proposal.dishName}</h3>
                  <p className="ranked-description">{proposal.notes || proposal.ingredients || ''}</p>
                </div>
                <Button variant="ghost" size="icon" className="btn-drag" aria-label="Drag to reorder">
                  <GripVertical size={20} />
                </Button>
              </Card>
            );
          })}
        </div>

        <Button
          size="lg"
          className="btn-submit w-full"
          onClick={handleSubmit}
          disabled={isSubmitting || isLoading || rankedProposals.length === 0 || votingStatus !== 'PLANNING'}
        >
          {isSubmitting ? <span className="spinner" aria-hidden="true" /> : <Check size={20} />}
          <span>{isSubmitting ? 'Submitting…' : 'Cast My Votes'}</span>
        </Button>
      </PageShell>
    </div>
  );
};

export default VotingPage;
