// JurisAcompanha — Base de Dados Fictícia para Desenvolvimento e Testes
// Simula 2 escritórios com isolamento estrito, casos multi-tenant e cliente em múltiplos escritórios

import {
  Tenant,
  Profile,
  Membership,
  Client,
  ClientUserLink,
  Case,
  CaseClientLink,
  CaseEvent,
  Document,
  AuditLog,
} from '../types/database';

export const MOCK_TENANTS: Tenant[] = [
  {
    id: 't-silva-1111-1111-1111-111111111111',
    name: 'Silva & Associados Advocacia',
    slug: 'silva-associados',
    status: 'active',
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-01-15T09:00:00Z',
  },
  {
    id: 't-rocha-2222-2222-2222-222222222222',
    name: 'Rocha & Mendes Consultoria Jurídica',
    slug: 'rocha-mendes',
    status: 'active',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
  },
];

export const MOCK_PROFILES: Profile[] = [
  {
    user_id: 'u-carlos-admin',
    display_name: 'Dr. Carlos Silva (Sócio Fundador)',
    created_at: '2026-01-15T09:10:00Z',
    updated_at: '2026-01-15T09:10:00Z',
  },
  {
    user_id: 'u-beatriz-lawyer',
    display_name: 'Dra. Beatriz Lima (Advogada Associada)',
    created_at: '2026-01-20T14:00:00Z',
    updated_at: '2026-01-20T14:00:00Z',
  },
  {
    user_id: 'u-lucas-collab',
    display_name: 'Lucas Souza (Assistente Jurídico)',
    created_at: '2026-02-10T11:00:00Z',
    updated_at: '2026-02-10T11:00:00Z',
  },
  {
    user_id: 'u-fernanda-rocha',
    display_name: 'Dra. Fernanda Rocha (Sócia Titular)',
    created_at: '2026-02-01T10:15:00Z',
    updated_at: '2026-02-01T10:15:00Z',
  },
  {
    user_id: 'u-mariana-client',
    display_name: 'Mariana Oliveira (Cliente)',
    created_at: '2026-02-15T16:20:00Z',
    updated_at: '2026-02-15T16:20:00Z',
  },
];

export const MOCK_MEMBERSHIPS: Membership[] = [
  // Membros do Tenant Silva & Associados
  {
    id: 'm-carlos-1',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    user_id: 'u-carlos-admin',
    role: 'office_admin',
    status: 'active',
    created_at: '2026-01-15T09:10:00Z',
  },
  {
    id: 'm-beatriz-1',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    user_id: 'u-beatriz-lawyer',
    role: 'lawyer',
    status: 'active',
    created_at: '2026-01-20T14:00:00Z',
  },
  {
    id: 'm-lucas-1',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    user_id: 'u-lucas-collab',
    role: 'collaborator',
    status: 'active',
    created_at: '2026-02-10T11:00:00Z',
  },
  // Membro do Tenant Rocha & Mendes
  {
    id: 'm-fernanda-2',
    tenant_id: 't-rocha-2222-2222-2222-222222222222',
    user_id: 'u-fernanda-rocha',
    role: 'office_admin',
    status: 'active',
    created_at: '2026-02-01T10:15:00Z',
  },
];

export const MOCK_CLIENTS: Client[] = [
  // Clientes cadastrados no Tenant Silva & Associados
  {
    id: 'c-silva-mariana',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    full_name: 'Mariana Oliveira da Costa',
    email: 'mariana.oliveira@exemplo.com.br',
    phone: '11987654321',
    status: 'active',
    created_at: '2026-02-15T16:00:00Z',
    updated_at: '2026-02-15T16:00:00Z',
  },
  {
    id: 'c-silva-roberto',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    full_name: 'Roberto Campos de Andrade',
    email: 'roberto.campos@exemplo.com.br',
    phone: '11976543210',
    status: 'active',
    created_at: '2026-02-18T10:30:00Z',
    updated_at: '2026-02-18T10:30:00Z',
  },
  // Cliente cadastrado no Tenant Rocha & Mendes (A mesma pessoa, mas com registro independente no outro escritório!)
  {
    id: 'c-rocha-mariana',
    tenant_id: 't-rocha-2222-2222-2222-222222222222',
    full_name: 'Mariana Oliveira da Costa',
    email: 'mariana.oliveira@exemplo.com.br',
    phone: '11987654321',
    status: 'active',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-03-01T09:00:00Z',
  },
];

export const MOCK_CLIENT_USER_LINKS: ClientUserLink[] = [
  // Mariana vinculada à sua conta no Tenant Silva
  {
    id: 'link-silva-mariana',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    client_id: 'c-silva-mariana',
    user_id: 'u-mariana-client',
    created_at: '2026-02-15T16:25:00Z',
  },
  // Mariana vinculada à sua conta no Tenant Rocha
  {
    id: 'link-rocha-mariana',
    tenant_id: 't-rocha-2222-2222-2222-222222222222',
    client_id: 'c-rocha-mariana',
    user_id: 'u-mariana-client',
    created_at: '2026-03-01T09:15:00Z',
  },
];

export const MOCK_CASES: Case[] = [
  // Processos do Escritório Silva
  {
    id: 'case-silva-01',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    case_number: '5001234-56.2026.8.26.0100', // TJSP - Cível Central
    court: 'Tribunal de Justiça de São Paulo',
    venue: '3ª Vara Cível - Foro Central da Comarca da Capital',
    case_class: 'Procedimento Comum Cível',
    subject: 'Indenização por Danos Morais e Materiais',
    title: 'Ação Indenizatória c/ Concessionária de Energia',
    status: 'active',
    created_by: 'u-beatriz-lawyer',
    created_at: '2026-02-16T10:00:00Z',
    updated_at: '2026-03-05T14:30:00Z',
  },
  {
    id: 'case-silva-02',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    case_number: '1002345-67.2026.5.02.0042', // TRT 2 - Trabalhista SP
    court: 'Tribunal Regional do Trabalho da 2ª Região',
    venue: '42ª Vara do Trabalho de São Paulo',
    case_class: 'Reclamação Trabalhista',
    subject: 'Verbas Rescisórias e Horas Extras',
    title: 'Reclamação Trabalhista - Roberto Campos',
    status: 'active',
    created_by: 'u-carlos-admin',
    created_at: '2026-02-19T11:00:00Z',
    updated_at: '2026-03-02T16:00:00Z',
  },
  // Processo do Escritório Rocha & Mendes (Mariana é cliente aqui, mas Silva NÃO pode ver!)
  {
    id: 'case-rocha-01',
    tenant_id: 't-rocha-2222-2222-2222-222222222222',
    case_number: '1009876-54.2026.8.26.0001', // TJSP - Família
    court: 'Tribunal de Justiça de São Paulo',
    venue: '1ª Vara de Família e Sucessões de São Paulo',
    case_class: 'Inventário e Partilha',
    subject: 'Sucessões e Inventário Extrajudicial',
    title: 'Inventário e Regularização de Imóvel Familiar',
    status: 'active',
    created_by: 'u-fernanda-rocha',
    created_at: '2026-03-01T10:30:00Z',
    updated_at: '2026-03-07T11:20:00Z',
  },
];

export const MOCK_CASE_CLIENT_LINKS: CaseClientLink[] = [
  // Mariana é parte no Processo Silva 01
  {
    id: 'ccl-silva-1',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    case_id: 'case-silva-01',
    client_id: 'c-silva-mariana',
    created_at: '2026-02-16T10:05:00Z',
  },
  // Roberto é parte no Processo Silva 02
  {
    id: 'ccl-silva-2',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    case_id: 'case-silva-02',
    client_id: 'c-silva-roberto',
    created_at: '2026-02-19T11:05:00Z',
  },
  // Mariana é parte no Processo Rocha 01
  {
    id: 'ccl-rocha-1',
    tenant_id: 't-rocha-2222-2222-2222-222222222222',
    case_id: 'case-rocha-01',
    client_id: 'c-rocha-mariana',
    created_at: '2026-03-01T10:35:00Z',
  },
];

export const MOCK_CASE_EVENTS: CaseEvent[] = [
  // Eventos do Processo Silva 01 (Mariana)
  {
    id: 'ev-1',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    case_id: 'case-silva-01',
    event_type: 'Petição Inicial Protocolada',
    title: 'Distribuição da Ação Inicial',
    description: 'Protocolada petição inicial no sistema e-SAJ com pedido de tutela de urgência e documentos anexos.',
    plain_explanation: 'Seu processo foi formalmente apresentado ao juiz com todos os comprovantes. Agora aguardamos a primeira análise da decisão.',
    visibility: 'client',
    event_at: '2026-02-16T11:00:00Z',
    created_by: 'u-beatriz-lawyer',
    created_at: '2026-02-16T11:05:00Z',
  },
  {
    id: 'ev-2',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    case_id: 'case-silva-01',
    event_type: 'Nota Estratégica Interna',
    title: 'Alinhamento de Tese Revisional',
    description: 'Verificar precedentes da 4ª Câmara de Direito Privado sobre fixação de dano moral presumido antes da réplica.',
    plain_explanation: null,
    visibility: 'internal', // VISIBILIDADE INTERNA: Cliente NÃO pode ver!
    event_at: '2026-02-20T15:30:00Z',
    created_by: 'u-carlos-admin',
    created_at: '2026-02-20T15:30:00Z',
  },
  {
    id: 'ev-3',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    case_id: 'case-silva-01',
    event_type: 'Decisão Judicial Interlocutória',
    title: 'Tutela de Urgência Concedida',
    description: 'O magistrado acolheu os argumentos da inicial e determinou o restabelecimento imediato dos serviços sob pena de multa diária.',
    plain_explanation: 'Boa notícia! O juiz concedeu a liminar a seu favor e ordenou que a empresa regularize sua situação imediatamente.',
    visibility: 'client',
    event_at: '2026-03-05T14:30:00Z',
    created_by: 'u-beatriz-lawyer',
    created_at: '2026-03-05T14:35:00Z',
  },
  // Evento do Processo Rocha 01 (Mariana no escritório Rocha)
  {
    id: 'ev-4',
    tenant_id: 't-rocha-2222-2222-2222-222222222222',
    case_id: 'case-rocha-01',
    event_type: 'Documentação Recebida',
    title: 'Conferência de Matrícula do Imóvel',
    description: 'Recebida certidão atualizada do 14º Cartório de Registro de Imóveis.',
    plain_explanation: 'Conferimos a certidão do imóvel no cartório e todos os registros estão aptos para formalizar a partilha.',
    visibility: 'client',
    event_at: '2026-03-07T11:20:00Z',
    created_by: 'u-fernanda-rocha',
    created_at: '2026-03-07T11:25:00Z',
  },
];

export const MOCK_DOCUMENTS: Document[] = [
  // Documentos do Processo Silva 01
  {
    id: 'doc-1',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    case_id: 'case-silva-01',
    storage_path: 'tenants/t-silva-1111/cases/case-silva-01/peticao_inicial_assinada.pdf',
    original_filename: 'Petição Inicial - Tutela de Urgência.pdf',
    mime_type: 'application/pdf',
    byte_size: 2458120,
    visibility: 'client',
    scan_status: 'clean', // Verificado como seguro -> liberado ao cliente
    uploaded_by: 'u-beatriz-lawyer',
    created_at: '2026-02-16T10:55:00Z',
  },
  {
    id: 'doc-2',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    case_id: 'case-silva-01',
    storage_path: 'tenants/t-silva-1111/cases/case-silva-01/minuta_estrategia_sigilosa.docx',
    original_filename: 'Minuta de Honorários e Estratégia Revisional.docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    byte_size: 142050,
    visibility: 'internal', // Documento interno do escritório -> NUNCA visível ao cliente
    scan_status: 'clean',
    uploaded_by: 'u-carlos-admin',
    created_at: '2026-02-20T14:10:00Z',
  },
  {
    id: 'doc-3',
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    case_id: 'case-silva-01',
    storage_path: 'tenants/t-silva-1111/cases/case-silva-01/decisao_liminar_deferida.pdf',
    original_filename: 'Decisão Judicial - Liminar Deferida.pdf',
    mime_type: 'application/pdf',
    byte_size: 785230,
    visibility: 'client',
    scan_status: 'clean',
    uploaded_by: 'u-beatriz-lawyer',
    created_at: '2026-03-05T14:40:00Z',
  },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    actor_user_id: 'u-carlos-admin',
    action: 'TENANT_INITIALIZED',
    resource_type: 'tenant',
    resource_id: 't-silva-1111-1111-1111-111111111111',
    outcome: 'success',
    metadata: { name: 'Silva & Associados Advocacia', migration: '0001' },
    created_at: '2026-01-15T09:00:00Z',
  },
  {
    id: 2,
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    actor_user_id: 'u-beatriz-lawyer',
    action: 'CASE_CREATED',
    resource_type: 'case',
    resource_id: 'case-silva-01',
    outcome: 'success',
    metadata: { case_number: '5001234-56.2026.8.26.0100' },
    created_at: '2026-02-16T10:00:00Z',
  },
  {
    id: 3,
    tenant_id: 't-silva-1111-1111-1111-111111111111',
    actor_user_id: 'u-mariana-client',
    action: 'CROSS_TENANT_ACCESS_ATTEMPT',
    resource_type: 'case',
    resource_id: 'case-silva-02',
    outcome: 'denied', // Teste negativo: Mariana tentou consultar caso de Roberto e foi barrada por RLS!
    metadata: { reason: 'User is not linked to case_silva_02' },
    created_at: '2026-03-06T19:12:00Z',
  },
];
