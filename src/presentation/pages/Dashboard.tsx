import React, { useEffect, useState } from 'react';
import {
  FolderKanban, PlaySquare, CheckCircle2, ArrowRight, Sparkles,
  Plus, RefreshCw, TrendingUp, Zap
} from 'lucide-react';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentTab }) => {
  const [stats, setStats] = useState({
    projectsCount: 0,
    jobsCount: 0,
    totalUrls: 0,
    successUrls: 0,
    failedUrls: 0,
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, jobsRes] = await Promise.all([
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/jobs').then(r => r.json()),
      ]);

      const projects = Array.isArray(projRes) ? projRes : [];
      const jobs = Array.isArray(jobsRes) ? jobsRes : [];
      let totalUrls = 0, successUrls = 0, failedUrls = 0;
      jobs.forEach(j => {
        totalUrls += j.totalUrls || 0;
        successUrls += j.successCount || 0;
        failedUrls += j.failedCount || 0;
      });
      setStats({ projectsCount: projects.length, jobsCount: jobs.length, totalUrls, successUrls, failedUrls });
      setRecentJobs(jobs.slice(0, 6));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const successRate = stats.totalUrls > 0 ? Math.round((stats.successUrls / stats.totalUrls) * 100) : 100;

  const statCards = [
    {
      label: 'Projetos Ativos',
      value: stats.projectsCount,
      icon: FolderKanban,
      iconClass: 'indigo',
      action: () => setCurrentTab('projects'),
      actionLabel: 'Ver todos',
    },
    {
      label: 'Jobs Executados',
      value: stats.jobsCount,
      icon: PlaySquare,
      iconClass: 'purple',
      action: () => setCurrentTab('jobs'),
      actionLabel: 'Histórico',
    },
    {
      label: 'URLs Processadas',
      value: stats.totalUrls,
      icon: CheckCircle2,
      iconClass: 'emerald',
      sub: stats.successUrls > 0 ? `${stats.successUrls} com sucesso` : undefined,
    },
    {
      label: 'Taxa de Sucesso',
      value: `${successRate}%`,
      icon: TrendingUp,
      iconClass: 'amber',
      progress: successRate,
    },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'badge-success',
      PROCESSING: 'badge-warning',
      PENDING: 'badge-info',
      FAILED: 'badge-error',
    };
    const dotMap: Record<string, string> = {
      COMPLETED: 'success',
      PROCESSING: 'warning',
      PENDING: 'neutral',
      FAILED: 'error',
    };
    return { cls: map[status] || 'badge-neutral', dot: dotMap[status] || 'neutral' };
  };

  return (
    <div className="fade-in space-y-8">
      {/* Hero Banner */}
      <div className="hero-banner card-glow">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span className="badge badge-info">
              <Zap size={11} />
              Gemini 3.1 Flash Lite
            </span>
            <span className="badge badge-neutral">Pronto para produção</span>
          </div>

          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 'clamp(24px, 4vw, 36px)',
            fontWeight: 800,
            color: '#f1f5f9',
            letterSpacing: '-0.5px',
            lineHeight: 1.15,
            maxWidth: 680,
          }}>
            Geração Automatizada de{' '}
            <span style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Meta Titles & Descriptions
            </span>
            {' '}em Escala
          </h1>

          <p style={{
            marginTop: 14,
            fontSize: 15,
            color: '#94a3b8',
            maxWidth: 580,
            lineHeight: 1.7,
          }}>
            Processe até 200 URLs por execução com validação estrita de caracteres, rotação automática de API Keys e exportação CSV — tudo com segurança e rastreabilidade.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => setCurrentTab('jobs/new')}>
              <Sparkles size={17} />
              Iniciar Novo Job SEO
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => setCurrentTab('projects/new')}>
              <Plus size={17} />
              Criar Projeto
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-4 gap-4 fade-in fade-in-delay-1">
        {statCards.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className={`card stat-card card-hover${s.action ? '' : ''}`} onClick={s.action}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div className={`stat-icon ${s.iconClass}`}>
                  <Icon size={20} />
                </div>
                {s.action && (
                  <button
                    onClick={e => { e.stopPropagation(); s.action!(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {s.actionLabel} <ArrowRight size={11} />
                  </button>
                )}
              </div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label" style={{ marginTop: 4 }}>{s.label}</div>
                {s.sub && <div style={{ fontSize: 11, color: 'var(--emerald-400)', marginTop: 4 }}>{s.sub}</div>}
              </div>
              {s.progress !== undefined && (
                <div className="progress-track" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: `${s.progress}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Jobs Table */}
      <div className="card fade-in fade-in-delay-2" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h2 className="section-title" style={{ fontSize: 16 }}>Jobs Recentes</h2>
            <p className="section-subtitle" style={{ fontSize: 12.5, marginTop: 2 }}>Progresso em tempo real dos últimos processamentos</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn" onClick={fetchData} title="Atualizar">
              <RefreshCw size={15} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setCurrentTab('jobs/new')}>
              <Plus size={13} />Novo Job
            </button>
          </div>
        </div>

        {recentJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <PlaySquare size={28} />
            </div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Nenhum job executado ainda
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360 }}>
              Crie um projeto, adicione suas API Keys e processe sua primeira lista de URLs.
            </p>
            <button className="btn btn-primary btn-md" onClick={() => setCurrentTab('jobs/new')}>
              <Sparkles size={15} />Iniciar Primeiro Job
            </button>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Status</th>
                  <th>Progresso</th>
                  <th>Resultados</th>
                  <th>Criado em</th>
                  <th style={{ textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map(job => {
                  const pct = job.totalUrls > 0 ? Math.round((job.processedUrls / job.totalUrls) * 100) : 0;
                  const { cls, dot } = getStatusBadge(job.status);
                  return (
                    <tr key={job.id}>
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: 'var(--text-muted)' }}>
                          {job.id.slice(0, 12)}…
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${cls}`}>
                          <span className={`status-dot ${dot}`} />
                          {job.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 140 }}>
                          <div className="progress-track" style={{ flex: 1, height: 5 }}>
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {job.processedUrls}/{job.totalUrls}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>{job.successCount}✓</span>
                        {job.failedCount > 0 && (
                          <span style={{ color: 'var(--rose-400)', fontWeight: 600, marginLeft: 8 }}>{job.failedCount}✗</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(job.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--indigo-400)', fontWeight: 600 }}
                          onClick={() => setCurrentTab(`jobs/${job.id}`)}
                        >
                          Ver Detalhes →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
