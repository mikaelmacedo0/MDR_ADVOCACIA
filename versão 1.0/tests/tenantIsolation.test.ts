import { describe, it, expect } from 'vitest';
import { dataService } from '../src/services/dataService';
import { ActiveUserContext } from '../src/types/database';

describe('Políticas de Segurança e Isolamento Multi-Tenant (Migration 0001)', () => {
  const silvaAdmin: ActiveUserContext = {
    user_id: 'u-carlos-admin',
    display_name: 'Dr. Carlos Silva',
    email: 'carlos@silvaadvocacia.com.br',
    user_type: 'staff',
    membership: {
      id: 'm-carlos-1',
      tenant_id: 't-silva-1111-1111-1111-111111111111',
      user_id: 'u-carlos-admin',
      role: 'office_admin',
      status: 'active',
      created_at: '2026-01-15T09:00:00Z',
    },
    linked_tenants: ['t-silva-1111-1111-1111-111111111111'],
  };

  const rochaAdmin: ActiveUserContext = {
    user_id: 'u-fernanda-rocha',
    display_name: 'Dra. Fernanda Rocha',
    email: 'fernanda@rochamendes.adv.br',
    user_type: 'staff',
    membership: {
      id: 'm-fernanda-2',
      tenant_id: 't-rocha-2222-2222-2222-222222222222',
      user_id: 'u-fernanda-rocha',
      role: 'office_admin',
      status: 'active',
      created_at: '2026-02-01T10:15:00Z',
    },
    linked_tenants: ['t-rocha-2222-2222-2222-222222222222'],
  };

  const silvaCollab: ActiveUserContext = {
    user_id: 'u-lucas-collab',
    display_name: 'Lucas Souza',
    email: 'lucas@silvaadvocacia.com.br',
    user_type: 'staff',
    membership: {
      id: 'm-lucas-1',
      tenant_id: 't-silva-1111-1111-1111-111111111111',
      user_id: 'u-lucas-collab',
      role: 'collaborator',
      status: 'active',
      created_at: '2026-02-10T11:00:00Z',
    },
    linked_tenants: ['t-silva-1111-1111-1111-111111111111'],
  };

  const marianaClientSilva: ActiveUserContext = {
    user_id: 'u-mariana-client',
    display_name: 'Mariana Oliveira',
    email: 'mariana.oliveira@exemplo.com.br',
    user_type: 'client',
    client_id: 'c-silva-mariana',
    linked_tenants: [
      't-silva-1111-1111-1111-111111111111',
      't-rocha-2222-2222-2222-222222222222',
    ],
  };

  it('1. Um escritório não consulta processos de outro escritório (Cross-Tenant)', () => {
    // Dr. Carlos (Escritório Silva) tentando buscar processos do Escritório Rocha
    const cases = dataService.getCases(silvaAdmin, 't-rocha-2222-2222-2222-222222222222');
    expect(cases).toHaveLength(0);
  });

  it('2. Cliente A não acessa o processo do Cliente B (Prevenção de IDOR)', () => {
    // Mariana tenta acessar diretamente case-silva-02 (que pertence a Roberto Campos)
    const forbiddenCase = dataService.getCaseById(
      marianaClientSilva,
      't-silva-1111-1111-1111-111111111111',
      'case-silva-02'
    );
    expect(forbiddenCase).toBeNull();

    // Mas Mariana consegue acessar seu próprio processo (case-silva-01)
    const allowedCase = dataService.getCaseById(
      marianaClientSilva,
      't-silva-1111-1111-1111-111111111111',
      'case-silva-01'
    );
    expect(allowedCase).not.toBeNull();
    expect(allowedCase?.id).toBe('case-silva-01');
  });

  it('3. Eventos com visibilidade "internal" nunca são retornados ao cliente', () => {
    const events = dataService.getCaseEvents(
      marianaClientSilva,
      't-silva-1111-1111-1111-111111111111',
      'case-silva-01'
    );

    // Todos os eventos retornados devem ter visibility === 'client'
    expect(events.length).toBeGreaterThan(0);
    const hasInternal = events.some((ev) => ev.visibility === 'internal');
    expect(hasInternal).toBe(false);

    // O advogado vê todos os eventos (internos e públicos)
    const adminEvents = dataService.getCaseEvents(
      silvaAdmin,
      't-silva-1111-1111-1111-111111111111',
      'case-silva-01'
    );
    expect(adminEvents.some((ev) => ev.visibility === 'internal')).toBe(true);
    expect(adminEvents.length).toBeGreaterThan(events.length);
  });

  it('4. Documentos internos não são retornados a clientes', () => {
    const docs = dataService.getDocuments(
      marianaClientSilva,
      't-silva-1111-1111-1111-111111111111',
      'case-silva-01'
    );
    // Nenhum documento interno pode estar presente
    const hasInternalDoc = docs.some((d) => d.visibility === 'internal');
    expect(hasInternalDoc).toBe(false);
  });

  it('5. Colaborador não possui permissão para criar novos processos (Privilégio Mínimo)', () => {
    const res = dataService.createCase(
      silvaCollab,
      't-silva-1111-1111-1111-111111111111',
      {
        title: 'Tentativa Indevida de Criação',
        case_number: null,
        court: null,
        venue: null,
        case_class: null,
        subject: null,
        status: 'active',
      }
    );
    expect(res.success).toBe(false);
    expect(res.error).toContain('Apenas Advogados e Administradores');
  });

  it('6. Cliente cadastrado em múltiplos escritórios acessa dados isoladamente em cada tenant', () => {
    // Mariana no Escritório Silva
    const casesSilva = dataService.getCases(marianaClientSilva, 't-silva-1111-1111-1111-111111111111');
    expect(casesSilva).toHaveLength(1);
    expect(casesSilva[0].id).toBe('case-silva-01');

    // Mariana no Escritório Rocha (com client_id correspondente ao cadastro no Tenant Rocha)
    const marianaClientRocha: ActiveUserContext = {
      ...marianaClientSilva,
      client_id: 'c-rocha-mariana',
    };
    const casesRocha = dataService.getCases(marianaClientRocha, 't-rocha-2222-2222-2222-222222222222');
    expect(casesRocha).toHaveLength(1);
    expect(casesRocha[0].id).toBe('case-rocha-01');

    // Escritório Rocha não enxerga o caso do Escritório Silva
    const rochaCases = dataService.getCases(rochaAdmin, 't-rocha-2222-2222-2222-222222222222');
    expect(rochaCases.some((c) => c.id === 'case-silva-01')).toBe(false);
  });
});
