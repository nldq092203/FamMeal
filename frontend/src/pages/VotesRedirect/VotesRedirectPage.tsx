import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useActiveMealQuery } from '@/query/hooks/useActiveMealQuery';

const VotesRedirectPage: React.FC = () => {
  const navigate = useNavigate();
  const { familyId, isLoading: isFamilyLoading } = useFamily();
  const activeMealQuery = useActiveMealQuery(familyId);
  const meal = activeMealQuery.data ?? null;
  const isMealLoading = activeMealQuery.isLoading;

  useEffect(() => {
    if (!meal) return;
    navigate(`/meals/${meal.id}/vote`, { replace: true });
  }, [meal, navigate]);

  if (isFamilyLoading || isMealLoading) {
    return (
      <div className="app-frame app-content flex justify-center">
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  if (!familyId) return <Navigate to="/" replace />;
  if (!meal) return <Navigate to="/" replace />;

  return null;
};

export default VotesRedirectPage;
