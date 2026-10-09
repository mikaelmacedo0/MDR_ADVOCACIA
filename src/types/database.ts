// JurisAcompanha — Definições de Tipos TypeScript
// Mapeado fielmente a partir de supabase/migrations/0001_tenant_isolation_core.sql

export type TenantStatus = 'active' | 'suspended' | 'closed';
export type StaffRole = 'office_admin' | 'lawyer' | 'collaborator';
export type MembershipStatus = 'invited' | 'active' | 'suspended';
export type ClientStatus = 'active' | 'inactive';
export type CaseStatus = 'active' | 'suspended' | 'archived' | 'concluded';
export type VisibilityType = 'internal' | 'client';
export type ScanStatus = 'pending' | 'clean' | 'quarantined' | 'rejected';
export type AuditOutcome = 'success' | 'denied' | 'failure';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  user_id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: StaffRole;
  status: MembershipStatus;
  created_at: string;
}

export interface Client {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
}

export interface ClientUserLink {
  id: string;
  tenant_id: string;
  client_id: string;
  user_id: string;
  created_at: string;
}

export interface Case {
  id: string;
  tenant_id: string;
  case_number: string | null; // Formato CNJ NNNNNNN-DD.AAAA.J.TR.OOOO
  court: string | null;
  venue: string | null;
  case_class: string | null;
  subject: string | null;
  title: string;
  status: CaseStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseClientLink {
  id: string;
  tenant_id: string;
  case_id: string;
  client_id: string;
  created_at: string;
}

export interface CaseEvent {
  id: string;
  tenant_id: string;
  case_id: string;
  event_type: string;
  title: string;
  description: string | null;
  plain_explanation?: string | null; // Explicação em linguagem simples para o cliente
  visibility: VisibilityType;
  event_at: string;
  created_by: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  tenant_id: string;
  case_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  visibility: VisibilityType;
  scan_status: ScanStatus;
  uploaded_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  tenant_id: string | null;
  actor_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  outcome: AuditOutcome;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Perfil de contexto ativo na aplicação
export type UserType = 'staff' | 'client';

export interface ActiveUserContext {
  user_id: string;
  display_name: string;
  email: string;
  user_type: UserType;
  // Se for staff:
  membership?: Membership;
  // Se for cliente:
  client_id?: string;
  linked_tenants: string[];
}
