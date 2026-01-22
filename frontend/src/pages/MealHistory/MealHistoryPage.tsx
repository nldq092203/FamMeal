import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Search, ChevronDown, Check, Plus, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useFamily } from '@/context/FamilyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader, PageShell } from '@/components/Layout';
import { useFamilyHistoryQuery } from '@/query/hooks/useFamilyHistoryQuery'
import './MealHistoryPage.css';

const MealHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { familyId, isLoading: isFamilyLoading, error: familyError } = useFamily();
  const { error: showErrorToast } = useToast();

  const historyQuery = useFamilyHistoryQuery(familyId, { limit: 10, offset: 0 })
  const history = historyQuery.data ?? []

  useEffect(() => {
    if (historyQuery.error) showErrorToast('Failed to load meal history.')
  }, [historyQuery.error, showErrorToast])

  const headerText = useMemo(() => {
    if (isFamilyLoading || historyQuery.isLoading) return 'Loading…';
    if (!history.length) return 'No history yet';
    return `${history.length} past meals`;
  }, [history.length, isFamilyLoading, historyQuery.isLoading]);

  return (
    <div className="meal-history-page">
      <PageShell>
        <PageHeader
          title="Meal History"
          align="center"
          left={
            <Button variant="ghost" size="icon" className="btn-back" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft size={24} />
            </Button>
          }
          right={
            <Button variant="ghost" size="icon" aria-label="Calendar">
              <Calendar size={20} />
            </Button>
          }
        />
        {(familyError || historyQuery.error) && (
          <Card role="alert" className="mt-4">
            <CardContent className="p-4">
              <p style={{ margin: 0 }}>{familyError || 'Failed to load meal history.'}</p>
            </CardContent>
          </Card>
        )}

        <div className="search-bar" aria-label="Search past meals">
          <Search size={20} className="search-icon" />
          <Input
            type="text"
            className="search-input border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto"
            placeholder="Search past meals..."
            disabled
          />
        </div>

        <div className="filter-bar" aria-label="Filters">
          <Button variant="secondary" size="sm" className="filter-chip active" disabled>
            <span>Cuisine</span>
            <ChevronDown size={12} />
          </Button>
          <Button variant="secondary" size="sm" className="filter-chip" disabled>
            <span>Winner</span>
            <ChevronDown size={12} />
          </Button>
          <Button variant="secondary" size="sm" className="filter-chip" disabled>
            <span>Date Range</span>
            <ChevronDown size={12} />
          </Button>
        </div>

        <section className="history-section">
          <div className="section-header">
            <h3 className="t-section-title">Meal History</h3>
            <span className="view-all-link" aria-label="History summary">
              {headerText}
            </span>
          </div>

          {isFamilyLoading || historyQuery.isLoading ? (
            <Card style={{ display: 'flex', justifyContent: 'center' }}>
              <CardContent className="p-4">
                <span className="spinner" aria-label="Loading" />
              </CardContent>
            </Card>
          ) : (
            <div className="history-list">
              {history.map((meal) => (
                <Card key={meal.id} className="history-card">
                  <div className="history-image flex items-center justify-center bg-muted border border-border">
                    <ImageIcon size={18} className="text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="history-info">
                    <div className="history-header">
                      <div className="history-date">
                        <span>{meal.date}</span>
                        <span className="date-dot">•</span>
                        <span>{meal.mealType}</span>
                      </div>
                      {meal.status === 'COMPLETED' && (
                        <Badge variant="secondary" className="gap-1">
                          <Check size={12} /> COMPLETED
                        </Badge>
                      )}
                      {meal.status !== 'COMPLETED' && (
                        <Badge variant={meal.status === 'LOCKED' ? 'outline' : 'default'}>{meal.status}</Badge>
                      )}
                    </div>
                    <h3 className="history-title">{meal.mealType} meal</h3>
                    <p className="history-meta">
                      {meal.proposalCount} proposals • {meal.voteCount} votes
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </PageShell>

      <Button size="icon" className="fab" onClick={() => navigate('/')} aria-label="Back to home">
        <Plus size={24} />
      </Button>
    </div>
  );
};

export default MealHistoryPage;
