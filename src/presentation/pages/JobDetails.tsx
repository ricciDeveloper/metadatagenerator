import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft, Download, RefreshCw, ExternalLink, CheckCircle2,
  XCircle, Clock, Copy, Check
} from 'lucide-react';

interface JobDetailsProps {
  jobId: string;
  setCurrentTab: (tab: string) => void;
}

export const JobDetails: React.FC<JobDetailsProps> = ({ jobId, setCurrentTab }) => {
  const [job, setJob] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJob = async () => {
    try {
      const [jobRes, resultsRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}`).then(r => r.json()),
        fetch(`/api/jobs/${jobId}/results`).then(r => r.json()),
      ]);
      setJob(jobRes);
      setResults(Array.isArray(resultsRes) ? resultsRes : []);
      if (jobRes.status !== 'PROCESSING' && jobRes.status !== 'PENDING') {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError('Erro ao carregar dados do job.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    intervalRef.current = setInterval(fetchJob, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [jobId]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; dot: string; label: string }> = {
      COMPLETED: { cls: 'badge-success', dot: 'success', label: 'Concluído' },
      PROCESSING: { cls: 'badge-warning', dot: 'warning', label: 'Processando...' },
      PENDING:    { cls: 'badge-info',    dot: 'neutral', label: 'Aguardando' },
      FAILED:     { cls: 'badge-error',   dot: 'error',   label: 'Falhou' },
    };
    return map[status] || { cls: 'badge-neutral', dot: 'neutral', label: status };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)' }}>Carregando job...</span>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: 'var(--rose-400)', marginBottom: 16 }}>{error || 'Job não encontrado.'}</p>
        <button className="btn btn-secondary btn-md" onClick={() => setCurrentTab('jobs')}>
          <ArrowLeft size={15} /> Voltar
        </button>
      </div>
    );
  }

  const pct = job.totalUrls > 0 ? Math.round((job.processedUrls / job.totalUrls) * 100) : 0;
  const { cls, dot, label } = getStatusBadge(job.status);
  const isLive = job.status === 'PROCESSING' || job.status === 'PENDING';

  const successResults = results.filter(r => r.status === 'SUCCESS');
  const failedResults  = results.filter(r => r.status !== 'SUCCESS');

  const charClass = (len: number, min: number, max: number) => {
    if (len >= min && len <= max) return 'text-emerald';
    if (len < min) return 'text-amber';
    return 'text-rose';
  };

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="icon-btn" onClick={() => setCurrentTab('jobs')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 className="section-title" style={{ fontSize: 18 }}>Detalhes do Job</h1>
              <span className={`badge ${cls}`}>
                <span className={`status-dot ${dot}`} />
                {label}
              </span>
            </div>
            <code style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{jobId}</code>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isLive && (
            <button className="icon-btn" onClick={fetchJob} title="Atualizar">
              <RefreshCw size={15} style={{ animation: 'spin 2s linear infinite' }} />
            </button>
          )}
          {job.status === 'COMPLETED' && (
            <a
              href={`/api/jobs/${jobId}/export`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-md"
              style={{ textDecoration: 'none' }}
            >
              <Download size={16} />
              Exportar CSV
            </a>
          )}
        </div>
      </div>

      {/* Progress overview */}
      <div className="card p-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {pct}%
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {job.processedUrls} de {job.totalUrls} URLs processadas
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--emerald-400)' }}>{job.successCount}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>com sucesso</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: job.failedCount > 0 ? 'var(--rose-400)' : 'var(--text-muted)' }}>{job.failedCount}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>falhas</div>
            </div>
          </div>
        </div>
        <div className="progress-track" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        {isLive && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--amber-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="status-dot warning" />
            Atualizando automaticamente a cada 4 segundos...
          </div>
        )}
      </div>

      {/* Results table — successes */}
      {successResults.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} style={{ color: 'var(--emerald-400)' }} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Resultados com Sucesso ({successResults.length})
            </span>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th style={{ minWidth: 280 }}>Meta Title</th>
                  <th style={{ minWidth: 340 }}>Meta Description</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {successResults.map(r => {
                  const titleLen = (r.metaTitle || '').length;
                  const descLen  = (r.metaDescription || '').length;
                  const cfg = job.project?.seoConfig || {};
                  const titleMin = cfg.title?.minLength ?? 50;
                  const titleMax = cfg.title?.maxLength ?? 55;
                  const descMin  = cfg.description?.minLength ?? 150;
                  const descMax  = cfg.description?.maxLength ?? 155;

                  return (
                    <tr key={r.id}>
                      <td style={{ maxWidth: 180 }}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="url-cell-link"
                        >
                          {new URL(r.url).pathname || r.url}
                          <ExternalLink size={10} />
                        </a>
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 6 }}>
                          {r.metaTitle}
                        </div>
                        <span className={`char-count ok ${charClass(titleLen, titleMin, titleMax)}`}>
                          {titleLen} chars
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 6 }}>
                          {r.metaDescription}
                        </div>
                        <span className={`char-count ok ${charClass(descLen, descMin, descMax)}`}>
                          {descLen} chars
                        </span>
                      </td>
                      <td>
                        <button
                          className="icon-btn"
                          title="Copiar meta tags"
                          onClick={() => handleCopy(
                            `<title>${r.metaTitle}</title>\n<meta name="description" content="${r.metaDescription}">`,
                            r.id
                          )}
                        >
                          {copiedId === r.id ? <Check size={14} style={{ color: 'var(--emerald-400)' }} /> : <Copy size={14} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Failed results */}
      {failedResults.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <XCircle size={16} style={{ color: 'var(--rose-400)' }} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              URLs com Falha ({failedResults.length})
            </span>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Erro</th>
                  <th>Tentativas</th>
                </tr>
              </thead>
              <tbody>
                {failedResults.map(r => (
                  <tr key={r.id}>
                    <td>
                      <a href={r.url} target="_blank" rel="noreferrer" className="url-cell-link">
                        {r.url}
                        <ExternalLink size={10} />
                      </a>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: 'var(--rose-400)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {r.errorMessage || 'Erro desconhecido'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                        {r.retryCount ?? 0}/3
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !isLive && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Clock size={28} />
            </div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Nenhum resultado ainda
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              O processamento ainda não produziu resultados.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
