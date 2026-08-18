import React, { useState } from 'react';
import { AlertCircle, Download, FileText, Key, Play, Plus, ShieldCheck, Trash2 } from 'lucide-react';

const DEFAULT_PROMPT = `Você é um especialista em SEO internacional e copywriting técnico.

Analise a página informada e gere um Meta Title e uma Meta Description relevantes, claros e persuasivos.
- Escreva em Português do Brasil.
- O Meta Title deve ter entre 50 e 60 caracteres.
- A Meta Description deve ter entre 150 e 160 caracteres.
- Não use emojis nem aspas.
- Evite repetir o H1 exatamente.

Retorne apenas um objeto JSON neste formato:
{"title":"Seu meta title aqui","description":"Sua meta description aqui"}`;

interface Result {
  url: string;
  success: boolean;
  title?: string;
  description?: string;
  error?: string;
}

export const NewJob: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<string[]>(['']);
  const [model, setModel] = useState('gemini-3.1-flash-lite');
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [urlInput, setUrlInput] = useState('');
  const [concurrency, setConcurrency] = useState(3);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const urls = Array.from(new Set(urlInput.split(/\r?\n/).map(url => url.trim()).filter(Boolean)));
  const overLimit = urls.length > 200;

  const addKey = () => setApiKeys(keys => [...keys, '']);
  const updateKey = (index: number, value: string) => setApiKeys(keys => keys.map((key, keyIndex) => keyIndex === index ? value : key));
  const removeKey = (index: number) => setApiKeys(keys => keys.length === 1 ? keys : keys.filter((_, keyIndex) => keyIndex !== index));

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUrlInput(String(reader.result || ''));
    reader.readAsText(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validKeys = apiKeys.map(key => key.trim()).filter(Boolean);
    if (!validKeys.length) return setError('Insira pelo menos uma Gemini API Key.');
    if (!urls.length) return setError('Insira pelo menos uma URL.');
    if (overLimit) return setError('O limite é de 200 URLs por execução.');

    setLoading(true);
    setError('');
    setResults([]);
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, apiKeys: validKeys, model, customPrompt: prompt, concurrency }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao processar o job.');
      setResults(data.results || []);
    } catch (requestError: any) {
      setError(requestError.message || 'Falha ao processar o job.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    const header = 'URL,Status,Meta Title,Meta Description,Erro';
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = results.map(result => [result.url, result.success ? 'Sucesso' : 'Falha', result.title, result.description, result.error].map(escape).join(','));
    const blob = new Blob([`\uFEFF${[header, ...rows].join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `seo-metadata-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="section-title">Novo Job de SEO</h1>
        <p className="section-subtitle">Gere metadados diretamente nesta sessão. Nada é salvo em banco ou no servidor.</p>
      </div>
      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}><AlertCircle size={16} /><span>{error}</span></div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div><h2 className="section-title" style={{ fontSize: 16 }}>Chaves da API Gemini</h2><p className="section-subtitle" style={{ fontSize: 12.5 }}>As chaves são alternadas automaticamente quando uma atinge o limite.</p></div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addKey}><Plus size={14} />Adicionar</button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>{apiKeys.map((key, index) => <div key={index} style={{ display: 'flex', gap: 8 }}><div style={{ position: 'relative', flex: 1 }}><Key size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} /><input className="form-input font-mono" style={{ paddingLeft: 36 }} type="password" value={key} onChange={event => updateKey(index, event.target.value)} placeholder={`Gemini API Key #${index + 1}`} autoComplete="off" /></div>{apiKeys.length > 1 && <button type="button" className="icon-btn btn-danger" title="Remover chave" onClick={() => removeKey(index)}><Trash2 size={14} /></button>}</div>)}</div>
          <div className="alert alert-info" style={{ marginTop: 14 }}><ShieldCheck size={15} /><span style={{ fontSize: 12.5 }}>As chaves ficam apenas na memória desta sessão.</span></div>
        </div>
        <div className="card p-6">
          <h2 className="section-title" style={{ fontSize: 16, marginBottom: 4 }}>Modelo e prompt</h2><p className="section-subtitle" style={{ fontSize: 12.5, marginBottom: 16 }}>O prompt abaixo já está pronto e pode ser ajustado antes da execução.</p>
          <div className="form-group" style={{ marginBottom: 16 }}><label className="form-label">Modelo Gemini</label><input className="form-input font-mono" value={model} onChange={event => setModel(event.target.value)} placeholder="gemini-3.1-flash-lite" /></div>
          <div className="form-group"><label className="form-label">Prompt de geração</label><textarea className="form-textarea font-mono" rows={11} value={prompt} onChange={event => setPrompt(event.target.value)} /></div>
        </div>
        <div className="card p-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}><div><h2 className="section-title" style={{ fontSize: 16, marginBottom: 4 }}>URLs</h2><p className="section-subtitle" style={{ fontSize: 12.5 }}>Uma URL por linha, até 200 por execução.</p></div><label className="btn btn-ghost btn-sm"><FileText size={14} />Importar TXT<input type="file" accept=".txt,.csv" onChange={handleFile} hidden /></label></div>
          <textarea className="form-textarea font-mono" rows={9} value={urlInput} onChange={event => setUrlInput(event.target.value)} placeholder={'https://exemplo.com/produto-1\nhttps://exemplo.com/produto-2'} />
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}><span>URLs únicas: <strong>{urls.length} / 200</strong></span><label>Concorrência <input type="number" min={1} max={5} value={concurrency} onChange={event => setConcurrency(Number(event.target.value))} style={{ width: 52, marginLeft: 6 }} /></label></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button type="submit" className="btn btn-primary btn-lg" disabled={loading || overLimit || !urls.length} style={{ minWidth: 230 }}>{loading ? <><div className="spinner" style={{ width: 16, height: 16 }} />Processando...</> : <><Play size={17} />Iniciar {urls.length} URLs</>}</button></div>
      </form>
      {results.length > 0 && <div className="card" style={{ marginTop: 28, overflow: 'hidden' }}><div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}><div><h2 className="section-title" style={{ fontSize: 16 }}>Resultados</h2><p className="section-subtitle" style={{ fontSize: 12.5 }}>{results.filter(result => result.success).length} sucessos de {results.length} URLs</p></div><button className="btn btn-secondary btn-sm" onClick={downloadCsv}><Download size={14} />Baixar CSV</button></div><div className="data-table-wrapper"><table className="data-table"><thead><tr><th>URL</th><th>Meta Title</th><th>Meta Description</th><th>Status</th></tr></thead><tbody>{results.map(result => <tr key={result.url}><td style={{ maxWidth: 190, wordBreak: 'break-word' }}>{result.url}</td><td>{result.title || '-'}</td><td>{result.description || result.error || '-'}</td><td><span className={`badge ${result.success ? 'badge-success' : 'badge-error'}`}>{result.success ? 'Sucesso' : 'Falha'}</span></td></tr>)}</tbody></table></div></div>}
    </div>
  );
};
