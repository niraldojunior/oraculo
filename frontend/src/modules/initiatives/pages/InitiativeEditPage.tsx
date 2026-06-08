import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import InitiativeEditor from '@/components/initiative/InitiativeEditor';
import type { Initiative, Collaborator, System } from '../../../types';
import {
  fetchInitiativeById,
  fetchInitiativeComments,
  fetchInitiativeEditorContext,
  fetchInitiativeHistory,
  updateInitiative
} from '../services/initiativesApi';

const InitiativeEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const state = location.state as {
        initiative?: Initiative,
        collaborators?: Collaborator[],
        systems?: System[]
      } | null;

      const hasRouteInitiative = !!(state?.initiative && state.initiative.id === id);

      try {
        if (!hasRouteInitiative) setLoading(true);

        if (hasRouteInitiative) {
          setInitiative(state!.initiative!);
          if (state?.collaborators) setCollaborators(state.collaborators);
          if (state?.systems) setSystems(state.systems);
          setLoading(false);
        }

        const needsContext = !(state?.collaborators && state?.systems);
        if (needsContext) {
          const contextData = await fetchInitiativeEditorContext();
          setCollaborators(contextData.collaborators || []);
          setSystems(contextData.systems || []);
        }

        const updatedData = await fetchInitiativeById(id!);
        setInitiative(updatedData);

        // History e comments são pesados e raramente vistos na 1ª carga.
        // Carrega em paralelo após a tela já estar visível.
        Promise.all([
          fetchInitiativeHistory(id!),
          fetchInitiativeComments(id!)
        ]).then(([history, comments]) => {
          setInitiative(prev => prev ? { ...prev, history, comments } as Initiative : prev);
        }).catch(err => console.warn('Falha ao carregar history/comments:', err));
      } catch (err: any) {
        console.error('Error fetching initiative data:', err);
        if (String(err?.message || '').includes('status 404')) {
          setError('Iniciativa não encontrada');
        } else {
          setError(err.message || 'Ocorreu um erro inesperado');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, location.state]);

  // Atualizar o título da aba do navegador
  useEffect(() => {
    if (initiative?.title) {
      document.title = `${initiative.title} | Oráculo`;
    } else {
      document.title = 'Carregando... | Oráculo';
    }

    // Resetar ao desmontar
    return () => {
      document.title = 'Oráculo';
    };
  }, [initiative?.title]);

  const handleSave = async (updated: Initiative) => {
    try {
      const saved = await updateInitiative(id!, updated);
      setInitiative(saved);
    } catch (err: any) {
      console.error('Error saving initiative:', err);
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const handleBack = () => {
    const returnView = (location.state as any)?.returnView;
    navigate('/iniciativas', { state: returnView ? { restoreView: returnView } : undefined });
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={40} className="animate-spin" color="#2563EB" />
          <p style={{ color: '#64748B', fontWeight: 500 }}>Carregando iniciativa...</p>
        </div>
      </div>
    );
  }

  if (error || !initiative) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: '2rem' }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>Ops! Algo deu errado</h2>
          <p style={{ color: '#6B7280', marginBottom: '2rem' }}>{error || 'Não foi possível carregar as informações desta iniciativa.'}</p>
          <button 
            onClick={() => navigate('/iniciativas')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto', padding: '0.75rem 1.5rem', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            <ArrowLeft size={18} /> Voltar para Iniciativas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100%', overflow: 'hidden' }}>
      <InitiativeEditor 
        initiative={initiative}
        allCollaborators={collaborators}
        allSystems={systems}
        onSave={handleSave}
        onBack={handleBack}
      />
    </div>
  );
};

export default InitiativeEdit;
