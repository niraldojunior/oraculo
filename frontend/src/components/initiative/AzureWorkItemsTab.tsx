import { useEffect, useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, ExternalLink, RefreshCw, AlertCircle, Loader2, Trophy, Landmark, BookOpen, FlaskConical, Bug, Database, ClipboardCheck, Rows3 } from 'lucide-react';
import { getJson } from '@/shared/http/apiClient';

interface WorkItem {
  id: number;
  title: string;
  type: string;
  state: string;
  assignedTo: string | null;
  assignedToAvatar: string | null;
  storyPoints: number | null;
  tags: string | null;
  areaPath: string | null;
  iterationPath: string | null;
  url: string;
  parentId: number | null;
}

interface AzureResponse {
  epic: WorkItem;
  items: WorkItem[];
}

const TYPE_META_RAW: Record<string, { color: string; bg: string }> = {
  'epic':                    { color: '#6B21A8', bg: '#F3E8FF' },
  'fase':                    { color: '#4338CA', bg: '#E0E7FF' },
  'feature':                 { color: '#1D4ED8', bg: '#DBEAFE' },
  'processo de negocio':     { color: '#7C3AED', bg: '#EDE9FE' },
  'estoria de negocio':      { color: '#0369A1', bg: '#E0F2FE' },
  'user story':              { color: '#15803D', bg: '#DCFCE7' },
  'bug':                     { color: '#B91C1C', bg: '#FEE2E2' },
  'task':                    { color: '#B45309', bg: '#FEF3C7' },
  'test suite':              { color: '#0F766E', bg: '#CCFBF1' },
  'test case':               { color: '#0F766E', bg: '#CCFBF1' },
  'gestao de ambientes':     { color: '#065F46', bg: '#D1FAE5' },
  'dri':                     { color: '#92400E', bg: '#FEF3C7' },
  'das':                     { color: '#92400E', bg: '#FEF3C7' },
};

function normalizeType(type: string) {
  return type.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function getTypeMeta(type: string) {
  return TYPE_META_RAW[normalizeType(type)] ?? { color: '#64748B', bg: '#F1F5F9' };
}

function isProcessoDeNegocio(type: string) {
  return normalizeType(type) === 'processo de negocio';
}

const STATE_META: Record<string, { color: string; dot?: string }> = {
  'New':               { color: '#64748B' },
  'Active':            { color: '#1D4ED8', dot: '#3B82F6' },
  'In Progress':       { color: '#1D4ED8', dot: '#3B82F6' },
  'Resolved':          { color: '#15803D', dot: '#22C55E' },
  'Done':              { color: '#15803D', dot: '#22C55E' },
  'Closed':            { color: '#64748B' },
  'Removed':           { color: '#94A3B8' },
  'Concluído':         { color: '#15803D', dot: '#22C55E' },
  'Concluído em QA':   { color: '#B45309', dot: '#F59E0B' },
  'Transição':         { color: '#1D4ED8', dot: '#3B82F6' },
  'Execução':          { color: '#1D4ED8', dot: '#3B82F6' },
  'Regressão':         { color: '#1D4ED8', dot: '#3B82F6' },
  'Ativo':             { color: '#1D4ED8', dot: '#3B82F6' },
  'Desenvolvimento':   { color: '#1D4ED8', dot: '#3B82F6' },
  'Aceitação':         { color: '#1D4ED8', dot: '#3B82F6' },
  'Fechado':           { color: '#15803D', dot: '#22C55E' },
  'Arquivado':         { color: '#94A3B8' },
};

function TypeBadge({ type }: { type: string }) {
  const meta = getTypeMeta(type);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 22, height: 18, borderRadius: 4, padding: '0 5px',
      background: meta.bg, color: meta.color,
      fontSize: '0.7rem', fontWeight: 400, letterSpacing: '0.03em', whiteSpace: 'nowrap'
    }}>
      {type}
    </span>
  );
}

function StateBadge({ state }: { state: string }) {
  const meta = STATE_META[state] ?? { color: '#64748B' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      color: meta.color, fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap'
    }}>
      {meta.dot && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, flexShrink: 0, display: 'inline-block' }} />
      )}
      {state}
    </span>
  );
}

interface TreeNode {
  item: WorkItem;
  children: TreeNode[];
}

function isGreenStatus(state: string): boolean {
  return STATE_META[state]?.dot === '#22C55E';
}

function filterActiveTree(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .map(node => ({ ...node, children: filterActiveTree(node.children) }))
    .filter(node => !isGreenStatus(node.item.state) || node.children.length > 0);
}

function buildTree(epicId: number, items: WorkItem[]): TreeNode[] {
  const byParent = new Map<number, WorkItem[]>();
  for (const item of items) {
    const pid = item.parentId ?? epicId;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(item);
  }

  function buildNodes(parentId: number): TreeNode[] {
    return (byParent.get(parentId) || [])
      .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
      .map(item => ({ item, children: buildNodes(item.id) }));
  }

  return buildNodes(epicId);
}

function WorkItemRow({ node, depth, defaultOpen }: { node: TreeNode; depth: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const { item } = node;
  const hasChildren = node.children.length > 0;

  return (
    <>
      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
        <td style={{ padding: '0.45rem 0.75rem', paddingLeft: `${0.75 + depth * 1.5}rem` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {hasChildren ? (
              <button
                onClick={() => setOpen(o => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94A3B8', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span style={{ width: 14, flexShrink: 0 }} />
            )}
            {isProcessoDeNegocio(item.type) && (
              <Landmark size={13} style={{ color: '#065F46', flexShrink: 0 }} />
            )}
            {normalizeType(item.type) === 'fase' && (
              <Rows3 size={13} style={{ color: '#EA580C', flexShrink: 0 }} />
            )}
            {normalizeType(item.type) === 'estoria de negocio' && (
              <Trophy size={13} style={{ color: '#9333EA', flexShrink: 0 }} />
            )}
            {normalizeType(item.type) === 'user story' && (
              <BookOpen size={13} style={{ color: '#15803D', flexShrink: 0 }} />
            )}
            {normalizeType(item.type) === 'test suite' && (
              <FlaskConical size={13} style={{ color: '#0F766E', flexShrink: 0 }} />
            )}
            {normalizeType(item.type) === 'bug' && (
              <Bug size={13} style={{ color: '#B91C1C', flexShrink: 0 }} />
            )}
            {normalizeType(item.type) === 'gestao de ambientes' && (
              <Database size={13} style={{ color: '#065F46', flexShrink: 0 }} />
            )}
            {normalizeType(item.type) === 'task' && (
              <ClipboardCheck size={13} style={{ color: '#B45309', flexShrink: 0 }} />
            )}
            <span style={{ color: '#94A3B8', fontSize: '0.78rem', fontWeight: 500, flexShrink: 0 }}>#{item.id}</span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.85rem', fontWeight: 400, color: '#1E293B', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={item.title}
            >
              {item.title}
            </a>
          </div>
        </td>
        <td style={{ padding: '0.45rem 0.75rem', whiteSpace: 'nowrap' }}>
          <TypeBadge type={item.type} />
        </td>
        <td style={{ padding: '0.45rem 0.75rem', whiteSpace: 'nowrap' }}>
          <StateBadge state={item.state} />
        </td>
        <td style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
          {item.assignedTo || <span style={{ color: '#CBD5E1' }}>—</span>}
        </td>
        <td style={{ padding: '0.45rem 0.75rem', textAlign: 'center', fontSize: '0.8rem', color: '#475569' }}>
          {item.storyPoints ?? <span style={{ color: '#CBD5E1' }}>—</span>}
        </td>
        <td style={{ padding: '0.45rem 0.75rem' }}>
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center' }} title="Abrir no Azure">
            <ExternalLink size={13} />
          </a>
        </td>
      </tr>
      {open && node.children.map(child => (
        <WorkItemRow key={child.item.id} node={child} depth={depth + 1} defaultOpen={false} />
      ))}
    </>
  );
}

const codeStyle: React.CSSProperties = { background: '#FEE2E2', padding: '0 4px', borderRadius: 3, fontFamily: 'monospace', fontSize: '0.9em' };

export function AzureWorkItemsTab({ azureUrl }: { azureUrl: string; linkName?: string }) {
  const [data, setData] = useState<AzureResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlyActive, setOnlyActive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getJson<AzureResponse>('/api/azure/workitems', { url: azureUrl });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar work items');
    } finally {
      setLoading(false);
    }
  }, [azureUrl]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '3rem', color: '#64748B' }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.8rem' }}>Carregando work items do Azure DevOps…</span>
      </div>
    );
  }

  if (error) {
    const hint = (() => {
      if (error.includes('AZURE_PAT não configurado'))
        return <>Configure a variável <code style={codeStyle}>AZURE_PAT</code> no arquivo <code style={codeStyle}>.env.local</code> do servidor com um Personal Access Token do Azure DevOps (permissão: <strong>Work Items → Read</strong>).</>;
      if (error.includes('inválido ou expirado'))
        return <>O token <code style={codeStyle}>AZURE_PAT</code> pode ter expirado ou estar incorreto. Gere um novo PAT em <strong>Azure DevOps → User Settings → Personal Access Tokens</strong> e atualize o servidor.</>;
      if (error.includes('Sem permissão'))
        return <>O token não tem acesso a este projeto. No Azure DevOps, verifique se o PAT tem escopo <strong>Work Items → Read</strong> e se o usuário tem acesso ao projeto.</>;
      if (error.includes('não encontrado'))
        return <>Verifique se a URL do work item está correta nas configurações da iniciativa e se o projeto ainda existe no Azure DevOps.</>;
      if (error.includes('429') || error.includes('Limite de requisições'))
        return <>O Azure DevOps bloqueou temporariamente as requisições. Aguarde alguns segundos e tente novamente.</>;
      return null;
    })();

    return (
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '0.75rem 1rem' }}>
          <AlertCircle size={16} color="#DC2626" style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626', marginBottom: '0.25rem' }}>Erro ao conectar ao Azure DevOps</div>
            <div style={{ fontSize: '0.72rem', color: '#B91C1C', marginBottom: hint ? '0.5rem' : 0 }}>{error}</div>
            {hint && (
              <div style={{ fontSize: '0.7rem', color: '#7F1D1D', lineHeight: 1.5 }}>{hint}</div>
            )}
          </div>
        </div>
        <div>
          <button
            onClick={load}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', color: '#475569', fontWeight: 500 }}
          >
            <RefreshCw size={13} /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { epic } = data;
  const items = data.items.filter(i => i.state !== 'Arquivado');
  const fullTree = buildTree(epic.id, items);
  const tree = onlyActive ? filterActiveTree(fullTree) : fullTree;

  const totalByType = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Header do Epic */}
      <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <TypeBadge type={epic.type} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>#{epic.id} — {epic.title}</span>
          <StateBadge state={epic.state} />
          <a href={epic.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#3B82F6', textDecoration: 'none', fontWeight: 500 }}>
            <ExternalLink size={12} /> Abrir no Azure
          </a>
        </div>

        {Object.keys(totalByType).length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.55rem', flexWrap: 'wrap' }}>
            {Object.entries(totalByType).map(([type, count]) => (
              <span key={type} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: '#64748B' }}>
                <TypeBadge type={type} />
                <span>{count}</span>
              </span>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none' }}>
                <div
                  onClick={() => setOnlyActive(v => !v)}
                  style={{
                    width: 32, height: 18, borderRadius: 999, background: onlyActive ? '#3B82F6' : '#CBD5E1',
                    position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2, left: onlyActive ? 16 : 2,
                    width: 14, height: 14, borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
                <span style={{ fontSize: '0.65rem', color: onlyActive ? '#1D4ED8' : '#94A3B8', fontWeight: onlyActive ? 600 : 400 }}>
                  Em andamento
                </span>
              </label>
              <button
                onClick={load}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', padding: 0 }}
                title="Atualizar"
              >
                <RefreshCw size={11} /> Atualizar
              </button>
            </div>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.78rem' }}>
          Nenhum work item filho encontrado neste Epic.
        </div>
      ) : (
        <div style={{ overflow: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Título</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Tipo</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Responsável</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SP</th>
                <th style={{ padding: '0.5rem 0.75rem', width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {tree.map(node => (
                <WorkItemRow key={node.item.id} node={node} depth={0} defaultOpen={false} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
