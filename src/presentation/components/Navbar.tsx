import React from 'react';
import { Sparkles, FolderKanban, PlaySquare, LayoutDashboard, Plus } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projetos', icon: FolderKanban },
    { id: 'jobs', label: 'Jobs SEO', icon: PlaySquare },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => setCurrentTab('dashboard')}>
          <div className="brand-icon">
            <Sparkles size={18} color="#fff" />
          </div>
          <span className="brand-name">SEO MetaAI</span>
          <span className="brand-badge">v1.0</span>
        </div>

        {/* Navigation */}
        <nav className="navbar-nav">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = currentTab === id || currentTab.startsWith(`${id}/`);
            return (
              <button
                key={id}
                className={`nav-item${isActive ? ' active' : ''}`}
                onClick={() => setCurrentTab(id)}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="navbar-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setCurrentTab('jobs/new')}
          >
            <Plus size={14} />
            Novo Job SEO
          </button>
        </div>
      </div>
    </header>
  );
};
