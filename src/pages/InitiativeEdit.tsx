import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import InitiativeEditor from '../components/initiative/InitiativeEditor';
import type { Initiative, Collaborator, System } from '../types';

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
      // Tentar recuperar dados do estado da rota para carregamento instantâneo
      const state = location.state as { 
        initiative?: Initiative, 
        collaborators?: Collaborator[], 
        systems?: System[] 
      } | null;

      if (state?.initiative && state.initiative.id === id) {
        setInitiative(state.initiative);
        if (state.collaborators) setCollaborators(state.collaborators);
        if (state.systems) setSystems(state.systems);
        
        // Se temos tudo (iniciativa + contexto), podemos pular o fetch e carregar instantaneamente
        if (state.collaborators && state.systems) {
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        // Se não temos o contexto no estado, buscar da API
        if (!collaborators.length || !systems.length) {
          const contextRes = await fetch('http://localhost:3001/api/inventory-context');
          if (!contextRes.ok) throw new Error('Falha ao carregar contexto de inventário');
          const contextData = await contextRes.json();
          setCollaborators(contextData.collaborators || []);
          setSystems(contextData.systems || []);
        }

        // Se não tínhamos a iniciativa ou o ID era diferente, buscar da API
        if (!initiative || initiative.id !== id) {
          const initiativeRes = await fetch(`http://localhost:3001/api/initiatives/${id}`);
          if (!initiativeRes.ok) {
            if (initiativeRes.status === 404) throw new Error('Iniciativa não encontrada');
            throw new Error('Erro ao carregar detalhes da iniciativa');
          }
          const updatedData = await initiativeRes.json();
          setInitiative(updatedData);
        }
      } catch (err: any) {
        console.error('Error fetching initiative data:', err);
        setError(err.message || 'Ocorreu um erro inesperado');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, location.state, collaborators.length, systems.length, initiative]);

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
      const response = await fetch(`http://localhost:3001/api/initiatives/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      if (!response.ok) throw new Error('Falha ao salvar alterações');
      
      // Optionally show a success toast here if available
      navigate('/iniciativas');
    } catch (err: any) {
      console.error('Error saving initiative:', err);
      alert('Erro ao salvar: ' + err.message);
    }
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
      />
    </div>
  );
};

export default InitiativeEdit;
