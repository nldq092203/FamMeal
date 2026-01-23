import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Vote, History, Settings, Shield, Plus } from 'lucide-react';
import { useFamily } from '@/context/FamilyContext';
import { useActiveMealQuery } from '@/query/hooks/useActiveMealQuery';
import { Button } from '@/components/ui/button';
import './BottomNav.css';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { role, familyId } = useFamily();
  const activeMealQuery = useActiveMealQuery(familyId);
  const activeMeal = activeMealQuery.data ?? null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Vote, label: 'Votes', path: '/votes' },
    { icon: History, label: 'History', path: '/history' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    ...(role === 'ADMIN' ? [{ icon: Shield, label: 'Admin', path: '/admin' }] : []),
  ];

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);
  const createHref = activeMeal ? `/meals/${activeMeal.id}/new-proposal` : null;

  return (
    <nav className="bottom-nav">
      {leftItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.path === '/admin'
            ? location.pathname.startsWith('/admin')
            : location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} strokeWidth={2} />
            <span className="nav-label">{item.label}</span>
          </Link>
        );
      })}

      {createHref ? (
        <Button asChild className="nav-fab" size="icon" aria-label="Create proposal">
          <Link to={createHref}>
            <Plus size={26} strokeWidth={2.5} />
          </Link>
        </Button>
      ) : (
        <Button className="nav-fab" size="icon" aria-label="Create proposal (unavailable)" disabled>
          <Plus size={26} strokeWidth={2.5} />
        </Button>
      )}

      {rightItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.path === '/admin'
            ? location.pathname.startsWith('/admin')
            : location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} strokeWidth={2} />
            <span className="nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
