import React, { useEffect, useState } from 'react';
import { PlaySquare, Plus, RefreshCw, Download } from 'lucide-react';

interface JobsListProps {
  setCurrentTab: (tab: string) => void;
}

export const JobsList: React.FC<JobsListProps> = ({ setCurrentTab }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const getBadge = (status: string) => {
    const map: Record<string, { cls: string; dot: string }> = {
      COMPLETED: { cls: 'badge-success', dot: 'success' },
      PROCESSING: { cls: 'badge-warning', dot: 'warning' },
      PENDING:    { cls: 'badge-info',    dot: 'neutral' },
      FAILED:     { cls: 'badge-error',   dot: 'error' },
    };
    return map[status] || { cls: 'badge-neutral', dot: 'neutral' };
  };

  return (
    <div className="fade-in space-y-6">
      <div className="section-header">
        <div>
          <h1 className="section-title">Histórico de Jobs</h1>
          <p className="section-subtitle">Acompanhe e exporte os resultados de todos os processamentos SEO</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="icon-btn" onClick={fetchJobs} title="Atualizar lista">
            <RefreshCw size={15} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <button className="btn btn-primary btn-md" onClick={() => setCurrentTab('jobs/new')}>
            <Plus size={15} />
            Novo Job SEO
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12 }}>
          <div className="spinner" />
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <PlaySquare size={28} />
            </div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              Nenhum job executado
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', maxWidth: 360 }}>
              Selecione um projeto, configure suas API Keys e envie uma lista de URLs para começar.
            </p>
            <button className="btn btn-primary btn-md" onClick={() => setCurrentTab('jobs/new')}>
              <Plus size={15} />
              Iniciar Primeiro Job
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Status</th>
                  <th>Progresso</th>
                  <th>URLs</th>
                  <th>Sucesso</th>
                  <th>Falhas</th>
                  <th>Criado em</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => {
                  const pct = job.totalUrls > 0 ? Math.round((job.processedUrls / job.totalUrls) * 100) : 0;
                  const { cls, dot } = getBadge(job.status);
                  return (
                    <tr key={job.id}>
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: 'var(--text-muted)' }}>
                          {job.id.slice(0, 8)}…
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
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                          {job.processedUrls}/{job.totalUrls}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>{job.successCount}</span>
                      </td>
                      <td>
                        <span style={{ color: job.failedCount > 0 ? 'var(--rose-400)' : 'var(--text-muted)', fontWeight: job.failedCount > 0 ? 600 : 400 }}>
                          {job.failedCount}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(job.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setCurrentTab(`jobs/${job.id}`)}
                          >
                            Detalhes
                          </button>
                          {job.status === 'COMPLETED' && (
                            <a
                              href={`/api/jobs/${job.id}/export`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                            >
                              <Download size={13} />
                              CSV
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
