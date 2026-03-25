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

export const VENDOR_LOGOS: Record<string, string> = {
  v_vtal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/V.tal_Logo.png/800px-V.tal_Logo.png',
  v_oracle: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Oracle_logo.svg/512px-Oracle_logo.svg.png',
  v_salesforce: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/512px-Salesforce.com_logo.svg.png',
  v_google: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/512px-Google_2015_logo.svg.png',
  v_huawei: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Huawei_logo.svg/512px-Huawei_logo.svg.png',
  v_nokia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nokia_logo.svg/512px-Nokia_logo.svg.png',
  v_zte: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/ZTE_Logo.svg/512px-ZTE_Logo.svg.png',
  v_ericsson: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Ericsson_logo.svg/512px-Ericsson_logo.svg.png',
  v_pega: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Pegasystems_logo.svg/512px-Pegasystems_logo.svg.png',
  v_hexagon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Hexagon_AB_logo.svg/512px-Hexagon_AB_logo.svg.png',
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
