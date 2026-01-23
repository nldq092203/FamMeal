import React from 'react';
import { NavLink } from 'react-router-dom';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { getAvatarSrc } from '@/assets/avatars';
import { primaryNavItems } from '@/components/Navigation/navItems';
import './SidebarNav.css';

const SidebarNav: React.FC = () => {
  const { role } = useFamily();
  const { user } = useAuth();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">FamMeal</h1>
        <p className="sidebar-subtitle">Family Meal Planning</p>
      </div>

      <nav className="sidebar-nav">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} strokeWidth={2} />
              <span className="sidebar-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

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
