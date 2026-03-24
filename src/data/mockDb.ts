import type { Team, Collaborator, Skill, System, Integration, Initiative, Allocation, Milestone, Vendor, Contract, Company, User } from '../types';

export const mockCompanies: Company[] = [
  { 
    id: 'c_vtal', 
    fantasyName: 'V.tal', 
    realName: 'V.tal Rede Neutra S.A.', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/V.tal_Logo.png/800px-V.tal_Logo.png',
    description: 'Empresa de rede neutra de fibra óptica.'
  },
  {
    id: 'c_btg',
    fantasyName: 'BTG Pactual',
    realName: 'Banco BTG Pactual S.A.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/BTG_Pactual_logo.svg/512px-BTG_Pactual_logo.svg.png',
    description: 'Banco de investimento brasileiro.'
  }
];

export const mockUsers: User[] = [
  {
    id: 'u_niraldo',
    fullName: 'Niraldo Rocha Granado Junior',
    email: 'niraldojunior@gmail.com',
    password: '123',
    photoUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    associatedCompanyIds: ['c_vtal', 'c_btg', 'c_nio'],
    role: 'Director'
  }
];

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

export const mockVendors: Vendor[] = [
  { companyId: 'c_vtal', id: 'v_vtal', companyName: 'V.tal', taxId: '00.000.000/0001-00', type: 'Software House' },
  { companyId: 'c_vtal', id: 'v_oracle', companyName: 'Oracle', taxId: '12.345.678/0001-90', type: 'Software House' },
  { companyId: 'c_vtal', id: 'v_openlabs', companyName: 'Openlabs', taxId: '11.111.111/0001-11', type: 'Software House' },
  { companyId: 'c_vtal', id: 'v_hexagon', companyName: 'Hexagon', taxId: '22.222.222/0001-22', type: 'Software House' },
  { companyId: 'c_vtal', id: 'v_salesforce', companyName: 'Salesforce', taxId: '44.444.444/0001-44', type: 'Software House' },
  { companyId: 'c_vtal', id: 'v_mycloud', companyName: 'MyCloud', taxId: '98.765.432/0001-10', type: 'Cloud Provider' },
  { companyId: 'c_vtal', id: 'v_google', companyName: 'Google', taxId: '55.555.555/0001-55', type: 'Cloud Provider' },
  { companyId: 'c_vtal', id: 'v_akross', companyName: 'Akross', taxId: '66.666.666/0001-66', type: 'Software House' },
  { companyId: 'c_vtal', id: 'v_cognyte', companyName: 'Cognyte', taxId: '77.777.777/0001-77', type: 'Software House' },
  { companyId: 'c_vtal', id: 'v_pega', companyName: 'Pega Systems', taxId: '88.888.888/0001-88', type: 'Software House' },
  { companyId: 'c_vtal', id: 'v_colmeia', companyName: 'Colmeia', taxId: '99.999.999/0001-99', type: 'Software House' },
  { companyId: 'c_vtal', id: 'v_huawei', companyName: 'Huawei', taxId: '10.101.101/0001-10', type: 'Software House' },
  { companyId: 'c_vtal', id: 'v_nokia', companyName: 'Nokia', taxId: '20.202.202/0001-20', type: 'Software House' },
  { companyId: 'c_vtal', id: 'v_zte', companyName: 'ZTE', taxId: '30.303.303/0001-30', type: 'Software House' },
  { companyId: 'c_vtal', id: 'v_ericsson', companyName: 'Ericsson', taxId: '40.404.040/0001-40', type: 'Software House' },
];

export const mockContracts: Contract[] = [
  { companyId: 'c_vtal', id: 'ct_1', vendorId: 'v_1', number: 'CTR-2024-001', startDate: '2024-01-01', endDate: '2026-12-31', model: 'On-premise', annualCost: 2500000 },
  { companyId: 'c_vtal', id: 'ct_2', vendorId: 'v_2', number: 'CTR-2025-002', startDate: '2025-06-01', endDate: '2026-06-01', model: 'SaaS', annualCost: 1200000 },
];

export const mockInitiatives: Initiative[] = [
  {
    id: 'proj_3',
    companyId: 'c_vtal',
    title: 'Migração de Legado SIS',
    status: '1- Em Avaliação',
    type: 'Projeto',
    benefit: 'Redução de 20% no OPEX de manutenção',
    benefitType: 'Redução Custos',
    scope: 'Migrar as funções de provisionamento do legardo SIS para a nova plataforma de Resource Inventory.',
    customerOwner: 'Carlos Silva',
    originDirectorate: 'Diretoria OSS',
    leaderId: '',
    impactedSystemIds: [],
    milestones: [],
    history: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'proj_4',
    companyId: 'c_vtal',
    title: 'Integração FSL x Netwin',
    status: '2- Em Backlog',
    type: 'Estratégico',
    benefit: 'Sincronismo automático de recursos de rede no campo',
    benefitType: 'Risco Continuidade',
    scope: 'Implementar interface via OIC para reserva de portas em tempo real durante a execução da OS no FSL.',
    customerOwner: 'Ana Paula',
    originDirectorate: 'Diretoria OSS',
    leaderId: 'c_ger_fa',
    impactedSystemIds: [],
    milestones: [],
    history: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'proj_5',
    companyId: 'c_vtal',
    title: 'Dashboard de Performance GPON',
    status: '3- Em Planejamento',
    type: 'Fast Track',
    benefit: 'Visibilidade de KPIs de rede em tempo real',
    benefitType: 'Aumento Receita',
    scope: 'Criar dashboard no Grafana consumindo dados do Netcool e ONF para monitoramento de latência e packet loss.',
    customerOwner: 'Marcos Oliveira',
    originDirectorate: 'Diretoria OSS',
    leaderId: 'c_ger_nm',
    technicalLeadId: 'c_lead_nm',
    impactedSystemIds: [],
    milestones: [
      { companyId: 'c_vtal', id: 'm_5_1', name: 'Desenvolvimento', systemId: 's_netcool', baselineDate: '2026-04-30' }
    ],
    history: [],
    createdAt: new Date().toISOString()
  }
];

export const mockAllocations: Allocation[] = [
  { companyId: 'c_vtal', id: 'al_1', collaboratorId: 'c_eng_1', initiativeId: 'BAU', percentage: 40, startDate: '2026-01-01', endDate: '2026-12-31' },
  { companyId: 'c_vtal', id: 'al_2', collaboratorId: 'c_eng_1', initiativeId: 'proj_1', percentage: 60, startDate: '2026-03-01', endDate: '2026-08-31' },
  { companyId: 'c_vtal', id: 'al_3', collaboratorId: 'c_eng_2', initiativeId: 'BAU', percentage: 80, startDate: '2026-01-01', endDate: '2026-12-31' },
  { companyId: 'c_vtal', id: 'al_4', collaboratorId: 'c_eng_2', initiativeId: 'proj_2', percentage: 50, startDate: '2026-04-01', endDate: '2026-06-30' },
];

export const mockMilestones: Milestone[] = [
  { companyId: 'c_vtal', id: 'm_1', initiativeId: 'proj_1', name: 'Design Arquitetural', dueDate: '2026-04-15', status: 'Completed' },
  { companyId: 'c_vtal', id: 'm_2', initiativeId: 'proj_1', name: 'Testes de Integração', dueDate: '2026-06-15', status: 'In Progress' },
];

export const mockIntegrations: Integration[] = [
  { companyId: 'c_vtal', id: 'int_1', sourceId: 's_api_product_order', targetId: 's_order_entry', protocol: 'API Rest' },
  { companyId: 'c_vtal', id: 'int_2', sourceId: 's_order_entry', targetId: 's_som_ftth', protocol: 'API Rest' },
  { companyId: 'c_vtal', id: 'int_3', sourceId: 's_som_ftth', targetId: 's_soa_ftth', protocol: 'SOAP' },
  { companyId: 'c_vtal', id: 'int_4', sourceId: 's_api_product_order', targetId: 's_order_inv', protocol: 'Kafka' },
];

export const mockTeams: Team[] = [
  { companyId: 'c_vtal', id: 't_dir_oss', name: 'Diretoria OSS', type: 'Diretoria', parentTeamId: null, leaderId: 'u_01' },

  // Gerências
  { companyId: 'c_vtal', id: 't_ger_fa', name: 'Fulfillment & Assurance', type: 'Gerencia', parentTeamId: 't_dir_oss', leaderId: 'c_ger_fa' },
  { companyId: 'c_vtal', id: 't_ger_nm', name: 'Network Management', type: 'Gerencia', parentTeamId: 't_dir_oss', leaderId: 'c_ger_nm' },
  { companyId: 'c_vtal', id: 't_ger_wm', name: 'Workforce Management', type: 'Gerencia', parentTeamId: 't_dir_oss', leaderId: 'c_ger_wm' },

  // Squads Liderança (Mantendo apenas as com pessoas)
  { companyId: 'c_vtal', id: 't_sq_fa_os', name: 'Ordem Serviço', type: 'Lideranca', parentTeamId: 't_ger_fa', leaderId: null },
  { companyId: 'c_vtal', id: 't_sq_wm_oc', name: 'Ordem Campo / Força de Trabalho', type: 'Lideranca', parentTeamId: 't_ger_wm', leaderId: null },
];

export const mockCollaborators: Collaborator[] = [
  {
    id: 'u_01',
    companyId: 'c_vtal',
    name: 'Niraldo Rocha Granado Junior',
    email: 'niraldojunior@gmail.com',
    role: 'Director',
    squadId: 't_dir_oss',
    phone: '+55 (11) 98888-7777',
    bio: 'Diretor de Engenharia OSS com mais de 20 anos de experiência em telecomunicações e transformação digital.',
    skills: []
  },
  { id: 'c_ger_fa', companyId: 'c_vtal', name: 'Quelly Azevedo', email: 'quelly.azevedo@vtal.com', role: 'Manager', squadId: 't_ger_fa', photoUrl: 'https://i.pravatar.cc/150?u=quelly', phone: '+55 (11) 97777-6666', bio: 'Gerente de Fulfillment & Assurance.', skills: [] },
  { id: 'c_ger_nm', companyId: 'c_vtal', name: 'Marco Anne', email: 'marco.anne@vtal.com', role: 'Manager', squadId: 't_ger_nm', photoUrl: 'https://i.pravatar.cc/150?u=marco', phone: '+55 (11) 96666-5555', bio: 'Gerente de Network Management.', skills: [] },
  { id: 'c_ger_wm', companyId: 'c_vtal', name: 'Ricardo Simões', email: 'ricardo.simoes@vtal.com', role: 'Manager', squadId: 't_ger_wm', photoUrl: 'https://i.pravatar.cc/150?u=ricardo', phone: '+55 (11) 95555-4444', bio: 'Gerente de Workforce Management.', skills: [] },
  { id: 'c_eng_1', companyId: 'c_vtal', name: 'Roberta Almeida (F&A)', email: 'roberta@vtal.com', role: 'Lead Engineer', squadId: 't_sq_fa_os', skills: [{ skillId: 'sk_java', level: 'Senior' }] },
  { id: 'c_lead_nm', companyId: 'c_vtal', name: 'André Silva (NM)', email: 'andre@vtal.com', role: 'Lead Engineer', squadId: 't_ger_nm', skills: [] },
  { id: 'c_lead_wm_2', companyId: 'c_vtal', name: 'Patrícia Lima (WM)', email: 'patricia@vtal.com', role: 'Lead Engineer', squadId: 't_sq_wm_oc', skills: [] },
  { id: 'c_eng_2', companyId: 'c_vtal', name: 'Juliana Torres (WM)', email: 'juliana@vtal.com', role: 'Engineer/Analyst', squadId: 't_sq_wm_oc', skills: [{ skillId: 'sk_aws', level: 'Junior' }] },
];

export const mockSkills: Skill[] = [];

export const mockSystems: System[] = [
  // FA -> Ordem Serviço
  { companyId: 'c_vtal', id: 's_pega_tecto', name: 'Pega Tecto', domain: 'Fulfillment & Assurance', subDomain: 'Ordem Serviço', platformCategory: 'Plataforma Negócio', criticality: 'Tier 1', techStack: ['Plataforma Negócio'], ownerTeamId: 't_sq_fa_os', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'Plataforma usada no atacado, cobrindo fulfillment, trouble ticket e algumas jornadas digitais, com alto grau de manualidade.' },
  { companyId: 'c_vtal', id: 's_soa_ftth', name: 'SOA (Integrações FTTH)', domain: 'Fulfillment & Assurance', subDomain: 'Ordem Serviço', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['Middleware'], ownerTeamId: 't_sq_fa_os', smeId: 'c_ger_fa', lifecycleStatus: 'Fim de Vida (Freezing)', debtScore: 7, description: 'Ordem de Serviço' },
  { companyId: 'c_vtal', id: 's_aws_atacado', name: 'AWS (Integr. Atacado)', domain: 'Fulfillment & Assurance', subDomain: 'Ordem Serviço', platformCategory: 'Middleware', criticality: 'Tier 1', techStack: ['Cloud'], ownerTeamId: 't_sq_fa_os', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'Ordem de Serviço' },

  // FA -> Ticket Problema
  { companyId: 'c_vtal', id: 's_apitt', name: 'API Trouble Ticket', domain: 'Fulfillment & Assurance', subDomain: 'Ticket Problema', platformCategory: 'Middleware', criticality: 'Tier 1', techStack: ['API'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'API FTTH para abertura de chamados de falha, com distinção entre ticket de cliente e ticket de TI.' },
  { companyId: 'c_vtal', id: 's_apicom', name: 'API Comunicados', domain: 'Fulfillment & Assurance', subDomain: 'Ticket Problema', platformCategory: 'Middleware', criticality: 'Tier 2', techStack: ['API'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 1, description: 'Ticket Problema' },
  { companyId: 'c_vtal', id: 's_gcpos', name: 'GCP / Massivas', domain: 'Fulfillment & Assurance', subDomain: 'Ticket Problema', platformCategory: 'Dados/IA', criticality: 'Tier 1', techStack: ['Cloud'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 1, description: 'Camada intermediária onde eventos massivos são consolidados e distribuídos para notificações e data lake.' },
  { companyId: 'c_vtal', id: 's_pega_eventos', name: 'Pega Eventos', domain: 'Fulfillment & Assurance', subDomain: 'Ticket Problema', platformCategory: 'Plataforma Negócio', criticality: 'Tier 1', techStack: ['Plataforma'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'Ticket Problema' },

  // FA -> Inventário Serviços
  { companyId: 'c_vtal', id: 's_order_inv', name: 'Order Inventory', domain: 'Fulfillment & Assurance', subDomain: 'Inventário Serviços', platformCategory: 'Middleware', criticality: 'Tier 1', techStack: ['Dados'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'Inventário Serviços' },
  { companyId: 'c_vtal', id: 's_service_inv', name: 'Service Inventory', domain: 'Fulfillment & Assurance', subDomain: 'Inventário Serviços', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['Dados'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Planejado', debtScore: 0, description: 'Inventário Serviços' },

  // FA -> Apoio
  { companyId: 'c_vtal', id: 's_portal_op', name: 'Portal Operacional', domain: 'Fulfillment & Assurance', subDomain: 'Apoio', platformCategory: 'Portais', criticality: 'Tier 2', techStack: ['Portais'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 4, description: 'Hub de múltiplos portais operacionais (diagnóstico, massivas, suporte), usado por tenants e operação interna.' },
  { companyId: 'c_vtal', id: 's_portal_dev', name: 'Portal DEV', domain: 'Fulfillment & Assurance', subDomain: 'Apoio', platformCategory: 'Portais', criticality: 'Tier 2', techStack: ['Portais'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'Apoio' },
  { companyId: 'c_vtal', id: 's_crf', name: 'CRE', domain: 'Fulfillment & Assurance', subDomain: 'Apoio', platformCategory: 'Portais', criticality: 'Tier 2', techStack: ['Portais'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'Apoio' },
  { companyId: 'c_vtal', id: 's_portal_eng', name: 'Portal Engenharia', domain: 'Fulfillment & Assurance', subDomain: 'Apoio', platformCategory: 'Portais', criticality: 'Tier 2', techStack: ['Portais'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'Apoio' },

  // FA -> Supervisão Recurso
  { companyId: 'c_vtal', id: 's_netcool', name: 'Netcool', domain: 'Fulfillment & Assurance', subDomain: 'Supervisão Recurso', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['Supervisão'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 5, description: 'Ferramenta de alarmística. Recebe traps dos elementos de rede (OLT, agregadores, etc.) e consolida alarmes para monitoramento operacional.' },
  { companyId: 'c_vtal', id: 's_portal_do', name: 'Portal DO', domain: 'Fulfillment & Assurance', subDomain: 'Supervisão Recurso', platformCategory: 'Engenharia', criticality: 'Tier 2', techStack: ['Portais'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'Portal de gestão de eventos massivos e suspeitas de rede. Consolida informações vindas do ONF, Netcool e inventários, acompanha massivas, áreas de risco e fornece insumos para diagnóstico e comunicação.' },
  { companyId: 'c_vtal', id: 's_na_f', name: 'ONF', domain: 'Fulfillment & Assurance', subDomain: 'Supervisão Recurso', platformCategory: 'Engenharia', criticality: 'Tier 2', techStack: ['App'], ownerTeamId: 't_ger_fa', smeId: 'c_ger_fa', lifecycleStatus: 'Ativo Greenfield', debtScore: 4, description: 'Sistema de supervisão e diagnóstico avançado, capaz de fazer correlação de eventos (ex.: múltiplas ONTs offline no mesmo ramo) e gerar suspeitas de falha antes mesmo de reclamação do cliente.' },

  // Network Management -> Viabilidade Serviço
  { companyId: 'c_vtal', id: 's_api_viab', name: 'API Viabilidade / SOA', domain: 'Network Management', subDomain: 'Viabilidade Serviço', platformCategory: 'Middleware', criticality: 'Tier 1', techStack: ['API'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'Serviço exposto via Chinese Wall, que avalia viabilidade com base no Netwin, HPs e regras comerciais.' },
  { companyId: 'c_vtal', id: 's_fuzzy', name: 'Fuzzy', domain: 'Network Management', subDomain: 'Viabilidade Serviço', platformCategory: 'Middleware', criticality: 'Tier 2', techStack: ['API'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'Algoritmo complementar de viabilidade que tenta recuperar vendas negadas, avaliando endereços não cadastrados ou plantas desatualizadas.' },
  { companyId: 'c_vtal', id: 's_portal_qual', name: 'Portal Qualificação', domain: 'Network Management', subDomain: 'Viabilidade Serviço', platformCategory: 'Portais', criticality: 'Tier 2', techStack: ['Portais'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'Portal onde as tenants definem áreas de bloqueio comercial, impedindo venda em regiões específicas.' },
  { companyId: 'c_vtal', id: 's_sov', name: 'SOV', domain: 'Network Management', subDomain: 'Viabilidade Serviço', platformCategory: 'Engenharia', criticality: 'Tier 2', techStack: ['App'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 4, description: 'Ferramenta de viabilidade do atacado, operada pela engenharia, majoritariamente manual, baseada em análise técnica (verde / amarelo / vermelho).' },

  // Network Management -> Cadastro Endereço
  { companyId: 'c_vtal', id: 's_geosite', name: 'Geosite Lograd. / Geonet', domain: 'Network Management', subDomain: 'Cadastro Endereço', platformCategory: 'Middleware', criticality: 'Tier 1', techStack: ['GIS'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 5, description: 'Base master de endereços, sincronizada com a base nacional (DNE). É usada para geocodificação e referência de recursos físicos.' },

  // Network Management -> Catalogo/Inventário Recursos
  { companyId: 'c_vtal', id: 's_netwin', name: 'Netwin / Nossis', domain: 'Network Management', subDomain: 'Catalogo/Inventário Recursos', platformCategory: 'Plataforma Negócio', criticality: 'Tier 1', techStack: ['Inventário'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 6, description: 'Inventário da rede GPON de acesso, cobrindo da estação até a casa do cliente (OLT, splitter, CDO, cabos, ONTs, HPs).' },
  { companyId: 'c_vtal', id: 's_gcp_inv', name: 'GCP / Inventário', domain: 'Network Management', subDomain: 'Catalogo/Inventário Recursos', platformCategory: 'Dados/IA', criticality: 'Tier 1', techStack: ['Cloud'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 1, description: 'Inventário BigData' },
  { companyId: 'c_vtal', id: 's_network_core', name: 'Network Core', domain: 'Network Management', subDomain: 'Catalogo/Inventário Recursos', platformCategory: 'Plataforma Negócio', criticality: 'Tier 1', techStack: ['Core'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'Inventário da rede de transmissão e backbone, herança de sistemas antigos (Brasil Telecom / Telemar), focado em perímetro de rede.' },
  { companyId: 'c_vtal', id: 's_geosite_brics', name: 'Geosite / BricsCAD', domain: 'Network Management', subDomain: 'Catalogo/Inventário Recursos', platformCategory: 'Plataforma Negócio', criticality: 'Tier 1', techStack: ['GIS'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 4, description: 'Ferramenta de CAD e cadastro de rede, usada principalmente para projetos de engenharia e redes herdadas. Funciona como plugin CAD para modelagem da rede.' },
  { companyId: 'c_vtal', id: 's_res_inv', name: 'Resource Inventory', domain: 'Network Management', subDomain: 'Catalogo/Inventário Recursos', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['Planned'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Planejado', debtScore: 0, description: 'NextGen Inventory' },

  // Network Management -> Teste Serviço/Recurso
  { companyId: 'c_vtal', id: 's_portal_diag', name: 'Portal Diagnóstico', domain: 'Network Management', subDomain: 'Teste Serviço/Recurso', platformCategory: 'Portais', criticality: 'Tier 2', techStack: ['Portais'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'Front-end usado por tenants para executar diagnósticos e receber laudos técnicos, enquanto não integram via API.' },
  { companyId: 'c_vtal', id: 's_api_test', name: 'API Service Test', domain: 'Network Management', subDomain: 'Teste Serviço/Recurso', platformCategory: 'Middleware', criticality: 'Tier 2', techStack: ['API'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'Testes' },
  { companyId: 'c_vtal', id: 's_netq', name: 'Netq', domain: 'Network Management', subDomain: 'Teste Serviço/Recurso', platformCategory: 'Plataforma Negócio', criticality: 'Tier 2', techStack: ['App'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 4, description: 'Motor de diagnóstico de serviços, baseado em workflows que consultam múltiplos sistemas (SYS, inventários, massivos, sessões). Está fora de renovação e precisa ser substituído.' },
  { companyId: 'c_vtal', id: 's_vrifca', name: 'V.rifca', domain: 'Network Management', subDomain: 'Teste Serviço/Recurso', platformCategory: 'Engenharia', criticality: 'Tier 2', techStack: ['Planned'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Planejado', debtScore: 0, description: 'Testes' },

  // Network Management -> Ordem Recurso
  { companyId: 'c_vtal', id: 's_sis', name: 'SIS', domain: 'Network Management', subDomain: 'Ordem Recurso', platformCategory: 'Plataforma Negócio', criticality: 'Tier 1', techStack: ['Plataforma'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 5, description: 'Sistema central de provisionamento de rede. É o único ponto de contato para ativação, configuração e comandos na rede, tanto no FTTH quanto no atacado. O módulo Loader é usado como front-end para configurações manuais (principalmente no atacado).' },
  { companyId: 'c_vtal', id: 's_dados_facil', name: 'Dados Facil', domain: 'Network Management', subDomain: 'Ordem Recurso', platformCategory: 'Engenharia', criticality: 'Tier 2', techStack: ['App'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Fim de Vida (Freezing)', debtScore: 6, description: 'Ordem Recurso' },

  // Network Management -> Uso Serviço / Legal
  { companyId: 'c_vtal', id: 's_captive_portal', name: 'Captive Portal', domain: 'Network Management', subDomain: 'Uso Serviço / Legal', platformCategory: 'Portais', criticality: 'Tier 2', techStack: ['Portais'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'Auth' },
  { companyId: 'c_vtal', id: 's_qsi', name: 'GCP / Quebra Sigilo', domain: 'Network Management', subDomain: 'Uso Serviço / Legal', platformCategory: 'Dados/IA', criticality: 'Tier 1', techStack: ['Cloud'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 1, description: 'Legal' },
  { companyId: 'c_vtal', id: 's_vigia', name: 'Vigia', domain: 'Network Management', subDomain: 'Uso Serviço / Legal', platformCategory: 'Plataforma Negócio', criticality: 'Tier 2', techStack: ['Plataforma'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 4, description: 'Legal' },

  // Network Management -> Config. Recurso
  { companyId: 'c_vtal', id: 's_apc_nokia', name: 'APC (OLT NOKIA)', domain: 'Network Management', subDomain: 'Config. Recurso', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['EMS'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'EMS', vendorId: 'v_nokia' },
  { companyId: 'c_vtal', id: 's_ncegpon', name: 'NCEGPON (OLT Huawei)', domain: 'Network Management', subDomain: 'Config. Recurso', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['EMS'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'EMS', vendorId: 'v_huawei' },
  { companyId: 'c_vtal', id: 's_ume_zte', name: 'UME (OLT ZTE)', domain: 'Network Management', subDomain: 'Config. Recurso', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['EMS'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'EMS', vendorId: 'v_zte' },
  { companyId: 'c_vtal', id: 's_nass', name: 'RADIUS', domain: 'Network Management', subDomain: 'Config. Recurso', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['AAA'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 4, description: 'Responsável apenas por autenticação e autorização. Não faz gestão de IP nem inventário; apenas valida credenciais e libera o acesso.' },
  { companyId: 'c_vtal', id: 's_nas', name: 'NAS', domain: 'Network Management', subDomain: 'Config. Recurso', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['BNG'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'Elemento de rede responsável por iniciar sessões de acesso dos clientes. Designa o IP, gerencia sessões e gera registros PDR.' },
  { companyId: 'c_vtal', id: 's_nceip', name: 'NCEIP (BNG)', domain: 'Network Management', subDomain: 'Config. Recurso', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['BNG'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'EMS' },
  { companyId: 'c_vtal', id: 's_ims_nokia', name: 'IMS Nokia', domain: 'Network Management', subDomain: 'Config. Recurso', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['IMS'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'Core', vendorId: 'v_nokia' },
  { companyId: 'c_vtal', id: 's_hdm_nokia', name: 'HDM/HGW Nokia', domain: 'Network Management', subDomain: 'Config. Recurso', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['ACS'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'ACS', vendorId: 'v_nokia' },
  { companyId: 'c_vtal', id: 's_vitalqip', name: 'VITALQIP', domain: 'Network Management', subDomain: 'Config. Recurso', platformCategory: 'Plataforma Negócio', criticality: 'Tier 1', techStack: ['IPAM'], ownerTeamId: 't_ger_nm', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 5, description: 'Sistema responsável pelo inventário e gestão de endereços IP. É a base master de IPs, consultada durante o processo de autenticação para permitir a alocação correta dos endereços.', vendorId: 'v_nokia' },

  // Workforce Management -> Ordem Campo / Força de Trabalho
  { companyId: 'c_vtal', id: 's_api_app', name: 'API Appointment', domain: 'Workforce Management', subDomain: 'Ordem Campo / Força de Trabalho', platformCategory: 'Middleware', criticality: 'Tier 1', techStack: ['API'], ownerTeamId: 't_sq_wm_oc', smeId: 'c_ger_wm', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'API exposta para agendamento de visitas técnicas.' },
  { companyId: 'c_vtal', id: 's_mulesoft', name: 'Mulesoft', domain: 'Workforce Management', subDomain: 'Ordem Campo / Força de Trabalho', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['iPaaS'], ownerTeamId: 't_sq_wm_oc', smeId: 'c_ger_wm', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'App' },
  { companyId: 'c_vtal', id: 's_fsl', name: 'FSL', domain: 'Workforce Management', subDomain: 'Ordem Campo / Força de Trabalho', platformCategory: 'Plataforma Negócio', criticality: 'Tier 1', techStack: ['Salesforce'], ownerTeamId: 't_sq_wm_oc', smeId: 'c_ger_wm', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'Plataforma estratégica de gestão de técnicos de campo, agenda, roteirização e execução de atividades. Target para unificação.', vendorId: 'v_salesforce' },
  { companyId: 'c_vtal', id: 's_api_wo', name: 'API Workorder', domain: 'Workforce Management', subDomain: 'Ordem Campo / Força de Trabalho', platformCategory: 'Middleware', criticality: 'Tier 1', techStack: ['API'], ownerTeamId: 't_sq_wm_oc', smeId: 'c_ger_wm', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'API de eventos de campo (deslocamento, chegada, conclusão), consumida pelas tenants.' },
  { companyId: 'c_vtal', id: 's_oic', name: 'OIC', domain: 'Workforce Management', subDomain: 'Ordem Campo / Força de Trabalho', platformCategory: 'Engenharia', criticality: 'Tier 1', techStack: ['Oracle'], ownerTeamId: 't_sq_wm_oc', smeId: 'c_ger_wm', lifecycleStatus: 'Ativo Greenfield', debtScore: 4, description: 'Camada de integração entre sistemas de OSS e o FSL.', vendorId: 'v_oracle' },
  { companyId: 'c_vtal', id: 's_ofs', name: 'OFS (TOA)', domain: 'Workforce Management', subDomain: 'Ordem Campo / Força de Trabalho', platformCategory: 'Plataforma Negócio', criticality: 'Tier 1', techStack: ['Oracle'], ownerTeamId: 't_sq_wm_oc', smeId: 'c_ger_wm', lifecycleStatus: 'Fim de Vida (Freezing)', debtScore: 7, description: 'Plataforma legada de gestão de técnicos de campo e agenda.', vendorId: 'v_oracle' },
  { companyId: 'c_vtal', id: 's_op_mobile', name: 'Operação Mobile', domain: 'Workforce Management', subDomain: 'Ordem Campo / Força de Trabalho', platformCategory: 'Mobile', criticality: 'Tier 1', techStack: ['iOS', 'Android'], ownerTeamId: 't_sq_wm_oc', smeId: 'c_ger_wm', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'Mobile App' },
  { companyId: 'c_vtal', id: 's_smart_desk', name: 'Smart Desk (Dialogflow)', domain: 'Workforce Management', subDomain: 'Ordem Campo / Força de Trabalho', platformCategory: 'Dados/IA', criticality: 'Tier 2', techStack: ['GCP'], ownerTeamId: 't_sq_wm_oc', smeId: 'c_ger_wm', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'Bot de suporte ao técnico, baseado em Dialogflow, que reduz chamadas humanas e resolve incidentes operacionais.' },
  { companyId: 'c_vtal', id: 's_antecipa_sa', name: 'Antecipa SA', domain: 'Workforce Management', subDomain: 'Ordem Campo / Força de Trabalho', platformCategory: 'Portais', criticality: 'Tier 2', techStack: ['App'], ownerTeamId: 't_sq_wm_oc', smeId: 'c_ger_wm', lifecycleStatus: 'Ativo Greenfield', debtScore: 3, description: 'Ferramentas para otimização de agenda, antecipação automática de visitas e redução de backoffice.' },
  { companyId: 'c_vtal', id: 's_co_digital', name: 'CO Digital', domain: 'Workforce Management', subDomain: 'Ordem Campo / Força de Trabalho', platformCategory: 'Mobile', criticality: 'Tier 2', techStack: ['App'], ownerTeamId: 't_sq_wm_oc', smeId: 'c_ger_wm', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'Mobile App' },
  { companyId: 'c_vtal', id: 's_client_desk', name: 'Client Desk', domain: 'Workforce Management', subDomain: 'Ordem Campo / Força de Trabalho', platformCategory: 'Engenharia', criticality: 'Tier 3', techStack: ['Planned'], ownerTeamId: 't_sq_wm_oc', smeId: 'c_ger_wm', lifecycleStatus: 'Planejado', debtScore: 0, description: 'Ferramentas para otimização de agenda e redução de backoffice.' },

  // Workforce Management -> Suprimentos
  { companyId: 'c_vtal', id: 's_gestech', name: 'Gestech', domain: 'Workforce Management', subDomain: 'Suprimentos', platformCategory: 'Plataforma Negócio', criticality: 'Tier 2', techStack: ['Plataforma'], ownerTeamId: 't_ger_wm', smeId: 'c_ger_wm', lifecycleStatus: 'Ativo Greenfield', debtScore: 4, description: 'Sistema de controle de estoque por técnico (ONTs, materiais). Complementa o SAP, mas tende a ser descontinuado.' },
  { companyId: 'c_vtal', id: 's_autosservico', name: 'Autosserviço', domain: 'Workforce Management', subDomain: 'Suprimentos', platformCategory: 'Engenharia', criticality: 'Tier 2', techStack: ['Planejado'], ownerTeamId: 't_ger_wm', smeId: 'c_ger_wm', lifecycleStatus: 'Planejado', debtScore: 0, description: 'Suprimentos' },

  // Workforce Management -> Apoio
  { companyId: 'c_vtal', id: 's_colmeia', name: 'Colmeia', domain: 'Workforce Management', subDomain: 'Apoio', platformCategory: 'Plataforma Negócio', criticality: 'Tier 2', techStack: ['Plataforma'], ownerTeamId: 't_ger_wm', smeId: 'c_ger_wm', lifecycleStatus: 'Ativo Greenfield', debtScore: 5, description: 'Plataforma SaaS de mensageria (WhatsApp) usada para automações operacionais (antecipação de visitas, comunicação com clientes).', vendorId: 'v_colmeia' },
  { companyId: 'c_vtal', id: 's_ccaip', name: 'CCAIP', domain: 'Workforce Management', subDomain: 'Apoio', platformCategory: 'Plataforma Negócio', criticality: 'Tier 2', techStack: ['Plataforma'], ownerTeamId: 't_ger_wm', smeId: 'c_ger_wm', lifecycleStatus: 'Ativo Greenfield', debtScore: 4, description: 'Apoio' },

  // Network Management -> Ordem Recurso
  { companyId: 'c_vtal', id: 's_dados_field', name: 'Dados Field', domain: 'Network Management', subDomain: 'Ordem Recurso', platformCategory: 'Dados/IA', criticality: 'Tier 2', techStack: ['Dados'], ownerTeamId: 't_sq_nm_or', smeId: 'c_ger_nm', lifecycleStatus: 'Ativo Greenfield', debtScore: 2, description: 'Central de processamento local para equipes de campo' },
];
