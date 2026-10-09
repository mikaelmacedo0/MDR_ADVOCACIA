// JurisAcompanha — Contexto de Autenticação e Multi-Tenancy

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ActiveUserContext, Tenant } from '../types/database';
import { MOCK_TENANTS, MOCK_MEMBERSHIPS } from '../services/mockData';
import { dataService } from '../services/dataService';

export interface PersonaProfile {
  id: string;
  name: string;
  roleDescription: string;
  userType: 'staff' | 'client';
  tenantId?: string;
  context: ActiveUserContext;
}

export const PRESET_PERSONAS: PersonaProfile[] = [
  {
    id: 'u-carlos-admin',
    name: 'Dr. Carlos Silva',
    roleDescription: 'Sócio Fundador / Admin do Escritório (Silva & Assoc.)',
    userType: 'staff',
    tenantId: 't-silva-1111-1111-1111-111111111111',
    context: {
      user_id: 'u-carlos-admin',
      display_name: 'Dr. Carlos Silva',
      email: 'carlos@silvaadvocacia.com.br',
      user_type: 'staff',
      membership: MOCK_MEMBERSHIPS[0],
      linked_tenants: ['t-silva-1111-1111-1111-111111111111'],
    },
  },
  {
    id: 'u-beatriz-lawyer',
    name: 'Dra. Beatriz Lima',
    roleDescription: 'Advogada Associada (Silva & Assoc.)',
    userType: 'staff',
    tenantId: 't-silva-1111-1111-1111-111111111111',
    context: {
      user_id: 'u-beatriz-lawyer',
      display_name: 'Dra. Beatriz Lima',
      email: 'beatriz@silvaadvocacia.com.br',
      user_type: 'staff',
      membership: MOCK_MEMBERSHIPS[1],
      linked_tenants: ['t-silva-1111-1111-1111-111111111111'],
    },
  },
  {
    id: 'u-lucas-collab',
    name: 'Lucas Souza',
    roleDescription: 'Assistente / Colaborador (Silva & Assoc.)',
    userType: 'staff',
    tenantId: 't-silva-1111-1111-1111-111111111111',
    context: {
      user_id: 'u-lucas-collab',
      display_name: 'Lucas Souza',
      email: 'lucas@silvaadvocacia.com.br',
      user_type: 'staff',
      membership: MOCK_MEMBERSHIPS[2],
      linked_tenants: ['t-silva-1111-1111-1111-111111111111'],
    },
  },
  {
    id: 'u-fernanda-rocha',
    name: 'Dra. Fernanda Rocha',
    roleDescription: 'Sócia Titular (Escritório Rocha & Mendes)',
    userType: 'staff',
    tenantId: 't-rocha-2222-2222-2222-222222222222',
    context: {
      user_id: 'u-fernanda-rocha',
      display_name: 'Dra. Fernanda Rocha',
      email: 'fernanda@rochamendes.adv.br',
      user_type: 'staff',
      membership: MOCK_MEMBERSHIPS[3],
      linked_tenants: ['t-rocha-2222-2222-2222-222222222222'],
    },
  },
  {
    id: 'u-mariana-client',
    name: 'Mariana Oliveira',
    roleDescription: 'Cliente Multi-Escritório (Silva & Assoc. e Rocha & Mendes)',
    userType: 'client',
    context: {
      user_id: 'u-mariana-client',
      display_name: 'Mariana Oliveira da Costa',
      email: 'mariana.oliveira@exemplo.com.br',
      user_type: 'client',
      client_id: 'c-silva-mariana', // Atualizado dinamicamente ao trocar de tenant
      linked_tenants: [
        't-silva-1111-1111-1111-111111111111',
        't-rocha-2222-2222-2222-222222222222',
      ],
    },
  },
];

interface AuthContextType {
  currentUser: ActiveUserContext;
  currentPersona: PersonaProfile;
  activeTenant: Tenant;
  availableTenants: Tenant[];
  switchPersona: (personaId: string) => void;
  switchTenant: (tenantId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPersona, setCurrentPersona] = useState<PersonaProfile>(PRESET_PERSONAS[0]);
  const [activeTenantId, setActiveTenantId] = useState<string>(
    't-silva-1111-1111-1111-111111111111'
  );

  // Determina os tenants acessíveis pelo usuário atual
  const availableTenants = dataService.getTenants(currentPersona.context);
  const activeTenant =
    availableTenants.find((t) => t.id === activeTenantId) || availableTenants[0] || MOCK_TENANTS[0];

  useEffect(() => {
    // Garante que o tenant ativo pertença aos autorizados
    if (!availableTenants.some((t) => t.id === activeTenantId) && availableTenants.length > 0) {
      setActiveTenantId(availableTenants[0].id);
    }
  }, [currentPersona, availableTenants, activeTenantId]);

  const switchPersona = (personaId: string) => {
    const selected = PRESET_PERSONAS.find((p) => p.id === personaId);
    if (!selected) return;

    if (selected.userType === 'staff' && selected.tenantId) {
      setActiveTenantId(selected.tenantId);
    } else if (selected.userType === 'client') {
      // Configura client_id adequado para o tenant inicial
      selected.context.client_id =
        activeTenantId === 't-rocha-2222-2222-2222-222222222222'
          ? 'c-rocha-mariana'
          : 'c-silva-mariana';
    }
    setCurrentPersona(selected);
  };

  const switchTenant = (tenantId: string) => {
    setActiveTenantId(tenantId);
    if (currentPersona.userType === 'client') {
      // Ajusta o ID do cadastro do cliente correspondente ao escritório selecionado
      currentPersona.context.client_id =
        tenantId === 't-rocha-2222-2222-2222-222222222222'
          ? 'c-rocha-mariana'
          : 'c-silva-mariana';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: currentPersona.context,
        currentPersona,
        activeTenant,
        availableTenants,
        switchPersona,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
