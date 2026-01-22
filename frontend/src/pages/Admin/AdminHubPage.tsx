import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, Check } from 'lucide-react';
import { useFamily } from '@/context/FamilyContext';
import { useActiveMealQuery } from '@/query/hooks/useActiveMealQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader, PageShell } from '@/components/Layout';
import './AdminHubPage.css';

const AdminHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { familyId, family } = useFamily();
  const activeMealQuery = useActiveMealQuery(familyId);
  const meal = activeMealQuery.data ?? null;
  const isLoading = activeMealQuery.isLoading;
  const error = activeMealQuery.error ? String(activeMealQuery.error) : null;

  return (
    <div className="admin-hub-page">
      <PageShell>
        <PageHeader
          title="Admin"
          align="center"
          left={
            <Button variant="ghost" size="icon" className="btn-back" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft size={24} />
            </Button>
          }
          right={<div style={{ width: 40 }} />}
        />

        {error && (
          <Card role="alert" className="mt-4">
            <CardContent className="p-4">
              <p style={{ margin: 0 }}>{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mt-4">
          <CardContent className="p-4">
            <h2 className="t-section-title" style={{ marginBottom: '0.25rem' }}>
              Family
            </h2>
            <p style={{ margin: 0 }}>{family?.name ?? '—'}</p>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent className="p-4">
            <h2 className="t-section-title">Current Meal</h2>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span className="spinner" aria-label="Loading" />
              </div>
            ) : meal ? (
              <div className="admin-actions">
                <div className="admin-meal-meta">
                  <Badge variant="outline" className="gap-1">
                    {meal.status === 'PLANNING' ? <Unlock size={12} /> : <Lock size={12} />}
                    <span>{meal.status}</span>
                  </Badge>
                  <p style={{ margin: '0.5rem 0 0' }}>
                    {meal.mealType} • {meal.scheduledFor}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link to={`/admin/meals/${meal.id}/finalize`}>
                    <Check size={16} />
                    Finalize / Reopen
                  </Link>
                </Button>
              </div>
            ) : (
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>No meals found.</p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent className="p-4">
            <h2 className="t-section-title">Family Management</h2>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
              Coming soon: member list, invite code, role management.
            </p>
          </CardContent>
        </Card>
      </PageShell>
    </div>
  );
};

export default AdminHubPage;
