// JurisAcompanha — Camada de Acesso a Dados com Verificação de Regras RLS
// Simula estritamente as restrições de isolamento da Migration 0001 no ambiente de desenvolvimento

import {
  Tenant,
  Case,
  CaseEvent,
  Document,
  Client,
  AuditLog,
  ActiveUserContext,
  AuditOutcome,
} from '../types/database';
import {
  MOCK_TENANTS,
  MOCK_CASES,
  MOCK_CASE_CLIENT_LINKS,
  MOCK_CASE_EVENTS,
  MOCK_DOCUMENTS,
  MOCK_CLIENTS,
  MOCK_AUDIT_LOGS,
} from './mockData';

class JurisDataService {
  private cases: Case[] = [...MOCK_CASES];
  private events: CaseEvent[] = [...MOCK_CASE_EVENTS];
  private documents: Document[] = [...MOCK_DOCUMENTS];
  private clients: Client[] = [...MOCK_CLIENTS];
  private auditLogs: AuditLog[] = [...MOCK_AUDIT_LOGS];

  // ==========================================
  // Helper de Auditoria
  // ==========================================
  private logAudit(
    tenantId: string | null,
    actorId: string | null,
    action: string,
    resourceType: string,
    resourceId: string | null,
    outcome: AuditOutcome,
    metadata: Record<string, unknown> = {}
  ) {
    const entry: AuditLog = {
      id: this.auditLogs.length + 1,
      tenant_id: tenantId,
      actor_user_id: actorId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      outcome,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
  }

  // ==========================================
  // Tenants
  // ==========================================
  public getTenants(user: ActiveUserContext): Tenant[] {
    if (user.user_type === 'staff') {
      const allowedTenantId = user.membership?.tenant_id;
      return MOCK_TENANTS.filter((t) => t.id === allowedTenantId);
    }
    // Cliente acessa apenas escritórios aos quais está vinculado em client_user_links
    return MOCK_TENANTS.filter((t) => user.linked_tenants.includes(t.id));
  }

  // ==========================================
  // Processos (Cases) - RLS Simulation
  // ==========================================
  public getCases(user: ActiveUserContext, activeTenantId: string): Case[] {
    // Regra: Tenant isolado
    const tenantCases = this.cases.filter((c) => c.tenant_id === activeTenantId);

    if (user.user_type === 'staff') {
      // Membro do escritório visualiza todos os processos do seu tenant
      if (user.membership?.tenant_id !== activeTenantId) {
        this.logAudit(
          activeTenantId,
          user.user_id,
          'CASES_SELECT',
          'case',
          null,
          'denied',
          { reason: 'Staff does not belong to active tenant' }
        );
        return [];
      }
      return tenantCases;
    }

    // Se for Cliente: apenas processos com vínculo explícito em case_client_links
    // e com o client_id vinculado ao usuário no tenant específico!
    const linkedCaseIds = MOCK_CASE_CLIENT_LINKS.filter(
      (ccl) => ccl.tenant_id === activeTenantId && ccl.client_id === user.client_id
    ).map((ccl) => ccl.case_id);

    return tenantCases.filter((c) => linkedCaseIds.includes(c.id));
  }

  public getCaseById(user: ActiveUserContext, activeTenantId: string, caseId: string): Case | null {
    const c = this.cases.find((item) => item.id === caseId && item.tenant_id === activeTenantId);
    if (!c) {
      this.logAudit(activeTenantId, user.user_id, 'CASE_GET_BY_ID', 'case', caseId, 'denied', {
        reason: 'Case not found or wrong tenant',
      });
      return null;
    }

    if (user.user_type === 'client') {
      const isLinked = MOCK_CASE_CLIENT_LINKS.some(
        (link) =>
          link.tenant_id === activeTenantId &&
          link.case_id === caseId &&
          link.client_id === user.client_id
      );
      if (!isLinked) {
        this.logAudit(activeTenantId, user.user_id, 'CASE_GET_BY_ID', 'case', caseId, 'denied', {
          reason: 'Client not linked to case (IDOR prevented)',
        });
        return null;
      }
    }

    return c;
  }

  public createCase(
    user: ActiveUserContext,
    activeTenantId: string,
    caseData: Omit<Case, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'created_by'>
  ): { success: boolean; data?: Case; error?: string } {
    // RLS: Apenas office_admin e lawyer podem criar processo
    if (user.user_type !== 'staff' || !['office_admin', 'lawyer'].includes(user.membership?.role || '')) {
      this.logAudit(activeTenantId, user.user_id, 'CASE_INSERT', 'case', null, 'denied', {
        role: user.membership?.role,
      });
      return { success: false, error: 'Apenas Advogados e Administradores podem cadastrar processos.' };
    }

    const newCase: Case = {
      ...caseData,
      id: `case-${Date.now()}`,
      tenant_id: activeTenantId,
      created_by: user.user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.cases.unshift(newCase);
    this.logAudit(activeTenantId, user.user_id, 'CASE_INSERT', 'case', newCase.id, 'success');
    return { success: true, data: newCase };
  }

  // ==========================================
  // Timeline e Eventos - RLS Simulation
  // ==========================================
  public getCaseEvents(user: ActiveUserContext, activeTenantId: string, caseId: string): CaseEvent[] {
    const caseEvents = this.events.filter(
      (ev) => ev.tenant_id === activeTenantId && ev.case_id === caseId
    );

    if (user.user_type === 'staff') {
      // Staff vê eventos internos e eventos visíveis para clientes
      return caseEvents.sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime());
    }

    // Cliente: SOMENTE eventos com visibility === 'client'
    // E apenas se tiver vínculo com o processo
    const isLinked = MOCK_CASE_CLIENT_LINKS.some(
      (link) =>
        link.tenant_id === activeTenantId &&
        link.case_id === caseId &&
        link.client_id === user.client_id
    );

    if (!isLinked) return [];

    return caseEvents
      .filter((ev) => ev.visibility === 'client')
      .sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime());
  }

  public addCaseEvent(
    user: ActiveUserContext,
    activeTenantId: string,
    eventData: Omit<CaseEvent, 'id' | 'tenant_id' | 'created_at' | 'created_by'>
  ): { success: boolean; data?: CaseEvent; error?: string } {
    // Staff de qualquer função ativa pode adicionar evento
    if (user.user_type !== 'staff' || user.membership?.tenant_id !== activeTenantId) {
      return { success: false, error: 'Operação não autorizada. Apenas colaboradores do escritório podem registrar eventos.' };
    }

    const newEvent: CaseEvent = {
      ...eventData,
      id: `ev-${Date.now()}`,
      tenant_id: activeTenantId,
      created_by: user.user_id,
      created_at: new Date().toISOString(),
    };

    this.events.unshift(newEvent);
    this.logAudit(activeTenantId, user.user_id, 'EVENT_INSERT', 'case_event', newEvent.id, 'success', {
      visibility: newEvent.visibility,
    });
    return { success: true, data: newEvent };
  }

  // ==========================================
  // Documentos - RLS Simulation
  // ==========================================
  public getDocuments(user: ActiveUserContext, activeTenantId: string, caseId: string): Document[] {
    const docs = this.documents.filter(
      (d) => d.tenant_id === activeTenantId && d.case_id === caseId
    );

    if (user.user_type === 'staff') {
      return docs;
    }

    // Cliente: somente visibility === 'client' E scan_status === 'clean'
    return docs.filter((d) => d.visibility === 'client' && d.scan_status === 'clean');
  }

  // ==========================================
  // Clientes do Escritório
  // ==========================================
  public getClients(user: ActiveUserContext, activeTenantId: string): Client[] {
    if (user.user_type !== 'staff') {
      // Cliente não pode listar a tabela geral de clientes
      return [];
    }
    return this.clients.filter((c) => c.tenant_id === activeTenantId);
  }

  // ==========================================
  // Auditoria
  // ==========================================
  public getAuditLogs(user: ActiveUserContext, activeTenantId: string): AuditLog[] {
    // Conforme a Migration 0001: audit_logs não é exposta a clientes
    if (user.user_type !== 'staff' || user.membership?.role !== 'office_admin') {
      return [];
    }
    return this.auditLogs.filter((a) => a.tenant_id === activeTenantId);
  }
}

export const dataService = new JurisDataService();
