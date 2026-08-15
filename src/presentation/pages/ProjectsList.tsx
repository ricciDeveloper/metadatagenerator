import React, { useEffect, useState } from 'react';
import { FolderKanban, Plus, Settings, Trash2, ExternalLink, ArrowRight } from 'lucide-react';

interface ProjectsListProps {
  setCurrentTab: (tab: string) => void;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({ setCurrentTab }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Excluir projeto "${name}"? Esta ação removerá todos os jobs associados.`)) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    fetchProjects();
  };

  const presetColors: Record<string, { badge: string; dot: string }> = {
    ecommerce:    { badge: 'badge-success', dot: '#34d399' },
    blog:         { badge: 'badge-info',    dot: '#818cf8' },
    institucional:{ badge: 'badge-warning', dot: '#fbbf24' },
    landing_page: { badge: 'badge-error',   dot: '#fb7185' },
    custom:       { badge: 'badge-neutral', dot: '#64748b' },
  };

  const presetLabels: Record<string, string> = {
    ecommerce: 'E-commerce',
    blog: 'Blog',
    institucional: 'Institucional',
    landing_page: 'Landing Page',
    custom: 'Personalizado',
  };

  return (
    <div className="fade-in space-y-6">
      <div className="section-header">
        <div>
          <h1 className="section-title">Projetos SEO</h1>
          <p className="section-subtitle">Configure domínios com regras personalizadas de geração de metadados</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setCurrentTab('projects/new')}>
          <Plus size={15} />
          Novo Projeto
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12 }}>
          <div className="spinner" />
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando projetos...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FolderKanban size={30} />
            </div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              Nenhum projeto cadastrado
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', maxWidth: 380 }}>
              Crie seu primeiro projeto escolhendo um preset otimizado para e-commerce, blog, institucional ou landing page.
            </p>
            <button className="btn btn-primary btn-md" onClick={() => setCurrentTab('projects/new')}>
              <Plus size={15} />
              Criar Primeiro Projeto
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-3 gap-4">
          {projects.map(proj => {
            const cfg = proj.seoConfig || {};
            const preset = cfg.presetName || 'custom';
            const { badge, dot } = presetColors[preset] || presetColors.custom;

            return (
              <div key={proj.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 20px 0' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                    <span className={`badge ${badge}`}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                      {presetLabels[preset] || 'Personalizado'}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="icon-btn"
                        onClick={() => setCurrentTab(`projects/${proj.id}`)}
                        title="Editar"
                      >
                        <Settings size={14} />
                      </button>
                      <button
                        className="icon-btn btn-danger"
                        onClick={() => handleDelete(proj.id, proj.name)}
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px', marginBottom: 6 }}>
                    {proj.name}
                  </h3>

                  <a
                    href={proj.domain}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--indigo-400)', textDecoration: 'none', marginBottom: 12 }}
                    onClick={e => e.stopPropagation()}
                  >
                    {proj.domain.replace(/^https?:\/\//, '')}
                    <ExternalLink size={11} />
                  </a>

                  {proj.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.55 }} className="line-clamp-2">
                      {proj.description}
                    </p>
                  )}

                  {/* SEO Config Summary */}
                  <div style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    marginBottom: 20,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Meta Title</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#818cf8', fontSize: 11.5 }}>
                        {cfg.title?.minLength ?? 50}–{cfg.title?.maxLength ?? 55} chars
                      </span>
                    </div>
                    <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Meta Description</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa', fontSize: 11.5 }}>
                        {cfg.description?.minLength ?? 150}–{cfg.description?.maxLength ?? 155} chars
                      </span>
                    </div>
                    <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                      {cfg.avoidH1 && <span style={{ color: 'var(--emerald-400)' }}>✓ Evita H1</span>}
                      {cfg.useCta && <span style={{ color: 'var(--emerald-400)' }}>✓ CTA Ativo</span>}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 'auto', padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setCurrentTab(`jobs/new?project=${proj.id}`)}
                  >
                    Novo Job
                  </button>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => setCurrentTab(`projects/${proj.id}`)}
                  >
                    Configurar <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
