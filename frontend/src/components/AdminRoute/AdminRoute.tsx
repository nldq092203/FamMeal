import React from 'react';
import { Navigate } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { role, isLoading } = useFamily();

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: '2rem', display: 'flex', justifyContent: 'center' }}>
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  if (role !== 'ADMIN') return <Navigate to="/" replace />;

  return <>{children}</>;
}
