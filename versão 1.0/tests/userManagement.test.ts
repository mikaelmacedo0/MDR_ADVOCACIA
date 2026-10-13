import { describe, it, expect } from 'vitest';
import { dataService } from '../src/services/dataService';
import { ActiveUserContext } from '../src/types/database';

describe('Gestão Administrativa de Usuários, Senhas e Permissões', () => {
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

  const tenantId = 't-silva-1111-1111-1111-111111111111';

  it('1. Administrador pode consultar todos os usuários do seu escritório', () => {
    const users = dataService.getTenantUsers(silvaAdmin, tenantId);
    expect(users.length).toBeGreaterThan(0);
    expect(users.some((u) => u.user_id === 'u-carlos-admin')).toBe(true);
  });

  it('2. Administrador pode cadastrar um novo usuário com papel e senha', () => {
    const res = dataService.createTenantUser(silvaAdmin, tenantId, {
      display_name: 'Dra. Gabriela Vasconcelos',
      email: 'gabriela@silvaadvocacia.com.br',
      password: 'SenhaForte@2026',
      role: 'lawyer',
    });

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data?.display_name).toBe('Dra. Gabriela Vasconcelos');
    expect(res.data?.role).toBe('lawyer');
  });

  it('3. Colaborador não possui permissão para cadastrar novos usuários (Privilégio Mínimo)', () => {
    const res = dataService.createTenantUser(silvaCollab, tenantId, {
      display_name: 'Tentativa Inválida',
      email: 'hacker@exemplo.com',
      role: 'office_admin',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Apenas Administradores');
  });

  it('4. Administrador pode alterar os dados e o papel de um usuário', () => {
    const users = dataService.getTenantUsers(silvaAdmin, tenantId);
    const target = users.find((u) => u.role === 'collaborator');
    expect(target).toBeDefined();

    if (target) {
      const res = dataService.updateTenantUser(silvaAdmin, tenantId, target.id, {
        display_name: 'Lucas Souza Promovido',
        email: target.email,
        role: 'lawyer', // Promovendo colaborador para advogado
        status: 'active',
      });

      expect(res.success).toBe(true);
    }
  });

  it('5. Administrador pode alterar a senha de um usuário', () => {
    const res = dataService.changeUserPassword(
      silvaAdmin,
      tenantId,
      'u-beatriz-lawyer',
      'NovaSenhaSegura@2026'
    );
    expect(res.success).toBe(true);
  });

  it('6. Regra de Segurança: Administrador é impedido de excluir sua própria conta', () => {
    const users = dataService.getTenantUsers(silvaAdmin, tenantId);
    const selfAdmin = users.find((u) => u.user_id === silvaAdmin.user_id);
    expect(selfAdmin).toBeDefined();

    if (selfAdmin) {
      const res = dataService.deleteTenantUser(silvaAdmin, tenantId, selfAdmin.id);
      expect(res.success).toBe(false);
      expect(res.error).toContain('você não pode excluir a sua própria conta');
    }
  });

  it('7. Cadastro de cliente (Google ou formulário) cria registro isolado no escritório', () => {
    const res = dataService.registerClient(tenantId, {
      full_name: 'João Pedro da Silva',
      email: 'joao.pedro@gmail.com',
      phone: '11988887777',
      authProvider: 'google',
    });

    expect(res.success).toBe(true);
    expect(res.userContext).toBeDefined();
    expect(res.userContext?.user_type).toBe('client');
    expect(res.userContext?.linked_tenants).toContain(tenantId);
  });
});
