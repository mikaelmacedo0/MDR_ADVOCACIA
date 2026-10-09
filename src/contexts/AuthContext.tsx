// JurisAcompanha — Contexto de Autenticação e Multi-Tenancy com Fluxo de Login

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
    roleDescription: 'Sócio Fundador / Administrador do Escritório (Silva & Assoc.)',
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
      email: 'mariana.oliveira@gmail.com',
      user_type: 'client',
      client_id: 'c-silva-mariana',
      linked_tenants: [
        't-silva-1111-1111-1111-111111111111',
        't-rocha-2222-2222-2222-222222222222',
      ],
    },
  },
];

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: ActiveUserContext;
  currentPersona: PersonaProfile;
  activeTenant: Tenant;
  availableTenants: Tenant[];
  switchPersona: (personaId: string) => void;
  switchTenant: (tenantId: string) => void;
  loginStaff: (email: string, password?: string) => { success: boolean; error?: string };
  loginClientWithGoogle: (email?: string, name?: string) => void;
  loginClientWithEmail: (email: string, password?: string) => { success: boolean; error?: string };
  registerClient: (
    fullName: string,
    email: string,
    phone: string,
    method: 'google' | 'custom'
  ) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentPersona, setCurrentPersona] = useState<PersonaProfile>(PRESET_PERSONAS[0]);
  const [activeTenantId, setActiveTenantId] = useState<string>(
    't-silva-1111-1111-1111-111111111111'
  );

  const availableTenants = dataService.getTenants(currentPersona.context);
  const activeTenant =
    availableTenants.find((t) => t.id === activeTenantId) || availableTenants[0] || MOCK_TENANTS[0];

  useEffect(() => {
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
      selected.context.client_id =
        activeTenantId === 't-rocha-2222-2222-2222-222222222222'
          ? 'c-rocha-mariana'
          : 'c-silva-mariana';
    }
    setCurrentPersona(selected);
    setIsAuthenticated(true);
  };

  const switchTenant = (tenantId: string) => {
    setActiveTenantId(tenantId);
    if (currentPersona.userType === 'client') {
      currentPersona.context.client_id =
        tenantId === 't-rocha-2222-2222-2222-222222222222'
          ? 'c-rocha-mariana'
          : 'c-silva-mariana';
    }
  };

  const loginStaff = (email: string, _password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const found = PRESET_PERSONAS.find(
      (p) => p.userType === 'staff' && p.context.email.toLowerCase() === cleanEmail
    );

    if (found) {
      setCurrentPersona(found);
      if (found.tenantId) setActiveTenantId(found.tenantId);
      setIsAuthenticated(true);
      return { success: true };
    }

    // Se for o admin genérico
    if (cleanEmail.includes('admin') || cleanEmail.includes('carlos')) {
      setCurrentPersona(PRESET_PERSONAS[0]);
      setIsAuthenticated(true);
      return { success: true };
    }

    return {
      success: false,
      error: 'Credenciais de colaborador não encontradas ou conta suspensa.',
    };
  };

  const loginClientWithGoogle = (email?: string, name?: string) => {
    const googleEmail = email || 'mariana.oliveira@gmail.com';
    const googleName = name || 'Mariana Oliveira (Google)';

    const clientPersona: PersonaProfile = {
      id: 'u-google-client',
      name: googleName,
      roleDescription: 'Cliente Autenticado com Google',
      userType: 'client',
      context: {
        user_id: 'u-mariana-client',
        display_name: googleName,
        email: googleEmail,
        user_type: 'client',
        client_id: 'c-silva-mariana',
        linked_tenants: [
          't-silva-1111-1111-1111-111111111111',
          't-rocha-2222-2222-2222-222222222222',
        ],
      },
    };

    setCurrentPersona(clientPersona);
    setIsAuthenticated(true);
  };

  const loginClientWithEmail = (email: string, _password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.includes('mariana') || cleanEmail.includes('oliveira') || cleanEmail.includes('gmail')) {
      setCurrentPersona(PRESET_PERSONAS[4]);
      setIsAuthenticated(true);
      return { success: true };
    }

    return {
      success: false,
      error: 'E-mail ou senha do portal do cliente incorretos.',
    };
  };

  const registerClient = (
    fullName: string,
    email: string,
    phone: string,
    method: 'google' | 'custom'
  ) => {
    const res = dataService.registerClient(activeTenant.id, {
      full_name: fullName,
      email,
      phone,
      authProvider: method,
    });

    if (!res.success || !res.userContext) {
      return { success: false, error: res.error || 'Falha no cadastro do cliente.' };
    }

    const newPersona: PersonaProfile = {
      id: res.userContext.user_id,
      name: res.userContext.display_name,
      roleDescription: `Cliente (${method === 'google' ? 'Google' : 'Cadastro Próprio'})`,
      userType: 'client',
      context: res.userContext,
    };

    setCurrentPersona(newPersona);
    setIsAuthenticated(true);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser: currentPersona.context,
        currentPersona,
        activeTenant,
        availableTenants,
        switchPersona,
        switchTenant,
        loginStaff,
        loginClientWithGoogle,
        loginClientWithEmail,
        registerClient,
        logout,
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
