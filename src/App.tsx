import { useState } from 'react';
import { Navbar } from './presentation/components/Navbar';
import { Dashboard } from './presentation/pages/Dashboard';
import { ProjectsList } from './presentation/pages/ProjectsList';
import { NewProject } from './presentation/pages/NewProject';
import { JobsList } from './presentation/pages/JobsList';
import { NewJob } from './presentation/pages/NewJob';
import { JobDetails } from './presentation/pages/JobDetails';

export function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const renderContent = () => {
    if (currentTab === 'dashboard') return <Dashboard setCurrentTab={setCurrentTab} />;
    if (currentTab === 'projects') return <ProjectsList setCurrentTab={setCurrentTab} />;
    if (currentTab === 'projects/new') return <NewProject setCurrentTab={setCurrentTab} />;
    if (currentTab.startsWith('projects/')) return <ProjectsList setCurrentTab={setCurrentTab} />;
    if (currentTab === 'jobs') return <JobsList setCurrentTab={setCurrentTab} />;
    if (currentTab.startsWith('jobs/new')) {
      const match = currentTab.match(/project=([^&]+)/);
      const initialProjId = match ? match[1] : undefined;
      return <NewJob setCurrentTab={setCurrentTab} initialProjectId={initialProjId} />;
    }
    if (currentTab.startsWith('jobs/')) {
      const jobId = currentTab.replace('jobs/', '');
      return <JobDetails jobId={jobId} setCurrentTab={setCurrentTab} />;
    }
    return <Dashboard setCurrentTab={setCurrentTab} />;
  };

  return (
    <div className="app-layout">
      {/* Animated mesh background */}
      <div className="bg-mesh" aria-hidden="true" />

      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="main-content">
        {renderContent()}
      </main>

      <footer className="app-footer">
        <span>© 2026 SEO MetaAI — Gerador de Metadados em Escala</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
          Gemini 3.1 Flash Lite • Clean Architecture • Vercel Ready
        </span>
      </footer>
    </div>
  );
}
