import type { Team, Collaborator, Skill, System, Integration, Initiative, Allocation, Milestone, Vendor, Contract, Company, User } from '../types';

// ALL DATA MUST BE FETCHED FROM SUPABASE/API. 
// THESE MOCK ARRAYS ARE NOW EMPTY TO PREVENT STALE DATA USAGE.

export const mockCompanies: Company[] = [];
export const mockUsers: User[] = [];

export const DOMAIN_HIERARCHY: Record<string, string[]> = {
  'Fulfillment & Assurance': [
    'Ordem Serviço',
    'Ticket Problema',
    'Inventário Serviços',
    'Apoio',
    'Supervisão Recurso'
  ],
  'Network Management': [
    'Viabilidade Serviço',
    'Cadastro Endereço',
    'Catalogo/Inventário Recursos',
    'Teste Serviço/Recurso',
    'Ordem Recurso',
    'Uso Serviço / Legal',
    'Config. Recurso'
  ],
  'Workforce Management': [
    'Ordem Campo / Força de Trabalho',
    'Suprimentos',
    'Apoio'
  ]
};

export const mockVendors: Vendor[] = [];
export const mockContracts: Contract[] = [];
export const mockInitiatives: Initiative[] = [];
export const mockAllocations: Allocation[] = [];
export const mockMilestones: Milestone[] = [];
export const mockIntegrations: Integration[] = [];
export const mockTeams: Team[] = [];
export const mockCollaborators: Collaborator[] = [];
export const mockSkills: Skill[] = [];
export const mockSystems: System[] = [];
