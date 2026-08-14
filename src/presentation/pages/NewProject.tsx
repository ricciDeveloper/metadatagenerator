import React, { useState } from 'react';
import {
  ArrowLeft, Sparkles, ShoppingCart, BookOpen, Building2,
  Target, Sliders, Check, Info
} from 'lucide-react';
import { SEO_PRESETS, SeoConfig } from '../../domain/value-objects/SeoConfig';

interface NewProjectProps {
  setCurrentTab: (tab: string) => void;
}

const PRESETS_META = [
  {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: ShoppingCart,
    desc: 'Title comercial atrativo com CTA, Description otimizada para conversão em produtos e categorias.',
    color: '#34d399',
  },
  {
    id: 'blog',
    name: 'Blog / Conteúdo',
    icon: BookOpen,
    desc: 'Title informativo com intenção de busca, Description voltada para engajamento e leitura.',
    color: '#818cf8',
  },
  {
    id: 'institucional',
    name: 'Institucional',
    icon: Building2,
    desc: 'Title corporativo claro, Description focada em autoridade e apresentação de serviços.',
    color: '#fbbf24',
  },
  {
    id: 'landing_page',
    name: 'Landing Page',
    icon: Target,
    desc: 'Title direto orientado a lead, Description com CTA forte para maximizar conversão.',
    color: '#fb7185',
  },
  {
    id: 'custom',
    name: 'Personalizado',
    icon: Sliders,
    desc: 'Configure manualmente todos os limites e comportamentos de geração.',
    color: '#94a3b8',
  },
];

export const NewProject: React.FC<NewProjectProps> = ({ setCurrentTab }) => {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('ecommerce');
  const [seoConfig, setSeoConfig] = useState<SeoConfig>({ ...SEO_PRESETS.ecommerce });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePresetSelect = (id: string) => {
    setSelectedPreset(id);
    if (id !== 'custom' && SEO_PRESETS[id]) {
      setSeoConfig({ ...SEO_PRESETS[id] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !domain.trim()) {
      setError('Nome do projeto e domínio são obrigatórios.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), domain: domain.trim(), description: description.trim(), presetName: selectedPreset, seoConfig }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erro ao criar projeto');
      }
      setCurrentTab('projects');
    } catch (err: any) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 820, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button className="icon-btn" onClick={() => setCurrentTab('projects')}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="section-title">Criar Novo Projeto</h1>
          <p className="section-subtitle">Configure as regras de SEO que serão aplicadas a todos os jobs deste domínio</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="card p-6">
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 24, background: 'rgba(99,102,241,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 12, fontWeight: 700 }}>1</span>
              Dados do Projeto
            </h2>
            <div className="grid grid-2 gap-4">
              <div className="form-group">
                <label className="form-label">Nome do Projeto *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Loja Virtual de Eletrônicos"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Domínio Oficial *</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://meusite.com.br"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Descrição do Projeto</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Descreva brevemente o tipo de site e seu público-alvo"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="card p-6">
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 24, background: 'rgba(99,102,241,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 12, fontWeight: 700 }}>2</span>
              Preset de Geração de Metadados
            </h2>

            <div className="grid grid-3 gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {PRESETS_META.map(p => {
                const Icon = p.icon;
                const isSelected = selectedPreset === p.id;
                return (
                  <div
                    key={p.id}
                    className={`preset-card${isSelected ? ' selected' : ''}`}
                    onClick={() => handlePresetSelect(p.id)}
                  >
                    {isSelected && (
                      <div className="preset-check">
                        <Check size={11} color="#fff" />
                      </div>
                    )}
                    <div className="preset-card-icon">
                      <Icon size={18} />
                    </div>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginBottom: 6 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                      {p.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEO Config */}
          <div className="card p-6">
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 24, background: 'rgba(99,102,241,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 12, fontWeight: 700 }}>3</span>
              Configuração de Caracteres
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20 }}>
              O sistema valida deterministicamente cada saída da IA — se fora dos limites, reprocessa automaticamente (até 3 tentativas).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Title */}
              <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#818cf8', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, background: '#818cf8', borderRadius: '50%' }} />
                  Meta Title
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Mínimo</label>
                    <input
                      type="number"
                      className="form-input font-mono"
                      value={seoConfig.title.minLength}
                      onChange={e => setSeoConfig({ ...seoConfig, title: { ...seoConfig.title, minLength: +e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Máximo</label>
                    <input
                      type="number"
                      className="form-input font-mono"
                      value={seoConfig.title.maxLength}
                      onChange={e => setSeoConfig({ ...seoConfig, title: { ...seoConfig.title, maxLength: +e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#c084fc', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, background: '#c084fc', borderRadius: '50%' }} />
                  Meta Description
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Mínimo</label>
                    <input
                      type="number"
                      className="form-input font-mono"
                      value={seoConfig.description.minLength}
                      onChange={e => setSeoConfig({ ...seoConfig, description: { ...seoConfig.description, minLength: +e.target.value } })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Máximo</label>
                    <input
                      type="number"
                      className="form-input font-mono"
                      value={seoConfig.description.maxLength}
                      onChange={e => setSeoConfig({ ...seoConfig, description: { ...seoConfig.description, maxLength: +e.target.value } })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={seoConfig.avoidH1}
                  onChange={e => setSeoConfig({ ...seoConfig, avoidH1: e.target.checked })}
                />
                <span style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>Evitar H1 idêntico</strong>
                  Impede que o Title seja igual ao H1 da página
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={seoConfig.useCta}
                  onChange={e => setSeoConfig({ ...seoConfig, useCta: e.target.checked })}
                />
                <span style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>Exigir CTA</strong>
                  Inclui chamada para ação na Description
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-md"
              onClick={() => setCurrentTab('projects')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} />Salvando...</> : <><Sparkles size={16} />Salvar Projeto</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
