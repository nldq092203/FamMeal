import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Vote, History, Settings, Shield, Plus } from 'lucide-react';
import { useFamily } from '@/context/FamilyContext';
import { useActiveMealQuery } from '@/query/hooks/useActiveMealQuery';
import { useAuth } from '@/context/AuthContext';
import { getAvatarSrc } from '@/assets/avatars';
import { Button } from '@/components/ui/button';
import './SidebarNav.css';

const SidebarNav: React.FC = () => {
  const location = useLocation();
  const { role, familyId } = useFamily();
  const activeMealQuery = useActiveMealQuery(familyId);
  const meal = activeMealQuery.data ?? null;
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Vote, label: 'Votes', path: '/votes' },
    { icon: History, label: 'History', path: '/history' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    ...(role === 'ADMIN' ? [{ icon: Shield, label: 'Admin', path: '/admin' }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname.startsWith('/admin');
    }
    return location.pathname === path;
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">FamMeal</h1>
        <p className="sidebar-subtitle">Family Meal Planning</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${active ? 'active' : ''}`}
            >
              <Icon size={20} strokeWidth={2} />
              <span className="sidebar-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {meal && (
        <div className="sidebar-actions">
          <Button asChild style={{ width: '100%', justifyContent: 'center' }}>
            <Link to={`/meals/${meal.id}/new-proposal`}>
              <Plus size={20} />
              <span>New Proposal</span>
            </Link>
          </Button>
        </div>
      )}

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar avatar-sm">
            <img src={getAvatarSrc(user?.avatarId)} alt="User" />
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || user?.username || 'Account'}</div>
            <div className="sidebar-user-role">{role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarNav;
