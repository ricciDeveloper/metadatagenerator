import { NewJob } from './presentation/pages/NewJob';

export function App() {
  return (
    <div className="app-layout">
      <div className="bg-mesh" aria-hidden="true" />
      <header className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand"><div className="brand-icon">✦</div><span className="brand-name">SEO MetaAI</span><span className="brand-badge">Sessão local</span></div>
        </div>
      </header>
      <main className="main-content"><NewJob /></main>
      <footer className="app-footer"><span>SEO MetaAI</span><span>Processamento sem banco e sem armazenamento permanente</span></footer>
    </div>
  );
}
