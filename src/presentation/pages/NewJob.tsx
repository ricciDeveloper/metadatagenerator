import React, { useEffect, useState } from 'react';
import {
  Key, FileText, Plus, Trash2, ShieldCheck,
  Play, AlertCircle, Info, ChevronDown, ChevronUp
} from 'lucide-react';

interface NewJobProps {
  setCurrentTab: (tab: string) => void;
  initialProjectId?: string;
}

export const NewJob: React.FC<NewJobProps> = ({ setCurrentTab, initialProjectId }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [apiKeys, setApiKeys] = useState<string[]>(['']);
  const [urlInput, setUrlInput] = useState('');
  const [model, setModel] = useState('gemini-3.1-flash-lite');
  const [concurrency, setConcurrency] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
          if (!selectedProjectId && data.length > 0) setSelectedProjectId(data[0].id);
        }
      });
  }, []);

  const addKey = () => setApiKeys([...apiKeys, '']);
  const updateKey = (i: number, v: string) => { const k = [...apiKeys]; k[i] = v; setApiKeys(k); };
  const removeKey = (i: number) => { if (apiKeys.length > 1) setApiKeys(apiKeys.filter((_, idx) => idx !== i)); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      if (text) setUrlInput(prev => prev ? `${prev}\n${text}` : text);
    };
    reader.readAsText(file);
  };

  const rawList = urlInput.split('\n').map(u => u.trim()).filter(Boolean);
  const uniqueUrls = Array.from(new Set(rawList));
  const overLimit = uniqueUrls.length > 200;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) { setError('Selecione um projeto.'); return; }
    const validKeys = apiKeys.map(k => k.trim()).filter(Boolean);
    if (!validKeys.length) { setError('Insira pelo menos uma Gemini API Key válida.'); return; }
    if (!uniqueUrls.length) { setError('Insira pelo menos uma URL.'); return; }
    if (overLimit) { setError(`Limite excedido: ${uniqueUrls.length} URLs (máx 200).`); return; }

    setLoading(true);
    setError('');
    try {
      const createRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId, urls: uniqueUrls }),
      });
      if (!createRes.ok) {
        const d = await createRes.json();
        throw new Error(d.error || 'Erro ao criar job.');
      }
      const { job } = await createRes.json();

      // Trigger first batch (fire-and-forget)
      fetch(`/api/jobs/${job.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys: validKeys, concurrency, model }),
      }).catch(() => {});

      sessionStorage.setItem(`job_keys_${job.id}`, JSON.stringify(validKeys));
      setCurrentTab(`jobs/${job.id}`);
    } catch (err: any) {
      setError(err.message || 'Falha ao iniciar job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="section-title">Novo Job de SEO</h1>
        <p className="section-subtitle">Configure sua lista de URLs e API Keys para iniciar a geração em lote</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Step 1: Project */}
          <div className="card p-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 24, height: 24, background: 'rgba(99,102,241,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 12, fontWeight: 700 }}>1</span>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Projeto SEO</span>
            </div>
            {projects.length === 0 ? (
              <div className="alert alert-warning">
                <Info size={16} />
                <span>Nenhum projeto encontrado. <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fbbf24', fontWeight: 600 }} onClick={() => setCurrentTab('projects/new')}>Crie um projeto</button> primeiro.</span>
              </div>
            ) : (
              <select
                className="form-select"
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.domain.replace(/^https?:\/\//, '')} ({p.seoConfig?.presetName || 'custom'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 2: API Keys */}
          <div className="card p-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, background: 'rgba(99,102,241,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 12, fontWeight: 700 }}>2</span>
                <div>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Gemini API Keys</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Rotação automática em caso de rate limit (429)</span>
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addKey}>
                <Plus size={14} />Adicionar Chave
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {apiKeys.map((k, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Key size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      type="password"
                      className="form-input font-mono"
                      style={{ paddingLeft: 36 }}
                      placeholder={`Chave Gemini #${i + 1} — AIza...`}
                      value={k}
                      onChange={e => updateKey(i, e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  {apiKeys.length > 1 && (
                    <button type="button" className="icon-btn btn-danger" onClick={() => removeKey(i)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="alert alert-info" style={{ marginTop: 14 }}>
              <ShieldCheck size={15} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12.5 }}>
                <strong>Segurança:</strong> Suas chaves nunca são salvas no banco. São transmitidas via HTTPS e mantidas apenas na memória durante o processamento.
              </span>
            </div>
          </div>

          {/* Step 3: URLs */}
          <div className="card p-6">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, background: 'rgba(99,102,241,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 12, fontWeight: 700 }}>3</span>
                <div>
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Lista de URLs</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>Uma URL por linha — máximo 200 URLs por job</span>
                </div>
              </div>
              <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                <FileText size={14} />
                Importar .TXT
                <input type="file" accept=".txt,.csv" onChange={handleFile} style={{ display: 'none' }} />
              </label>
            </div>

            <textarea
              rows={10}
              className="form-textarea font-mono"
              style={{ fontSize: 12.5 }}
              placeholder={'https://exemplo.com.br/produto-1\nhttps://exemplo.com.br/produto-2\nhttps://exemplo.com.br/categoria/calcados'}
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Únicas: <strong style={{ color: overLimit ? 'var(--rose-400)' : 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {uniqueUrls.length} / 200
                  </strong>
                </span>
                {rawList.length !== uniqueUrls.length && (
                  <span style={{ color: 'var(--emerald-400)' }}>
                    ✓ {rawList.length - uniqueUrls.length} duplicatas removidas automaticamente
                  </span>
                )}
              </div>
              {overLimit && (
                <span style={{ color: 'var(--rose-400)', fontWeight: 600 }}>⚠ Limite excedido</span>
              )}
            </div>
          </div>

          {/* Step 4: Advanced Settings */}
          <div className="card">
            <button
              type="button"
              style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, background: 'rgba(99,102,241,0.10)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 12, fontWeight: 700 }}>4</span>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Configurações Avançadas</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Modelo de IA, concorrência</span>
              </span>
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAdvanced && (
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Modelo Gemini</label>
                    <select className="form-select font-mono" value={model} onChange={e => setModel(e.target.value)}>
                      <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite ⚡ (Rápido)</option>
                      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro 🔬 (Preciso)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Concorrência (max 5)</label>
                    <input
                      type="number"
                      min={1} max={5}
                      className="form-input font-mono"
                      value={concurrency}
                      onChange={e => setConcurrency(+e.target.value)}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Recomendado: 3 (respeita limites da API)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || overLimit || uniqueUrls.length === 0}
              style={{ minWidth: 240 }}
            >
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16 }} />Iniciando processamento...</>
                : <><Play size={17} style={{ fill: 'currentColor' }} />Iniciar {uniqueUrls.length} URLs</>
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
