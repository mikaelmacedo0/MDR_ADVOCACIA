# JurisAcompanha — Diretrizes de Engenharia para Agentes de Código

Este documento estabelece os princípios arquiteturais, regras de segurança e normas de desenvolvimento que qualquer agente de inteligência artificial ou desenvolvedor deve seguir rigorosamente ao trabalhar no projeto **JurisAcompanha**.

---

## 1. Princípios e Invariantes Arquiteturais

1. **O Navegador Nunca é a Fronteira de Autorização:**
   - Nunca confie em papéis (`role`), `tenant_id`, ou permissões enviadas pelo cliente HTTP/navegador.
   - A autorização real é aplicada no banco de dados (**PostgreSQL com Row Level Security - RLS**) e em funções seguras com `SECURITY DEFINER` protegidas (schema `private`, `search_path = ''`).

2. **Isolamento Estrito Multi-Tenant:**
   - Toda entidade pertencente a um escritório possui obrigatoriamente a coluna `tenant_id`.
   - Vínculos entre entidades (ex.: processo com cliente, processo com evento, processo com documento) utilizam **chaves estrangeiras compostas** `(tenant_id, id)` para impedir associações cruzadas entre escritórios diferentes.

3. **Independência de Cadastros de Clientes:**
   - Um cidadão/cliente pode ter processos em múltiplos escritórios cadastrados na plataforma.
   - Sua identidade em `auth.users` é global, porém os cadastros em `clients` e os vínculos em `client_user_links` são estritamente isolados por escritório. O Escritório A jamais visualiza os processos ou o vínculo do cliente com o Escritório B.

4. **Superadministrador da Plataforma Limitado:**
   - O superadministrador do SaaS não recebe privilégios de leitura de conteúdo jurídico por padrão. Suas atribuições são puramente operacionais e de infraestrutura.

5. **Armazenamento de Documentos Seguro:**
   - Arquivos jurídicos ficam em buckets privados no Supabase Storage.
   - Nunca utilizar links públicos ou estáticos para documentos processuais. O download deve requerer URL assinada de curta duração gerada após verificação de autorização e status de verificação (`scan_status = 'clean'`).
   - Documentos internos marcados como `visibility = 'internal'` nunca podem ser disponibilizados ao cliente.

6. **Segredos e Variáveis de Ambiente:**
   - Jamais expor a `SUPABASE_SERVICE_ROLE_KEY` no front-end ou em código versionado.
   - Apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` podem ser utilizadas na aplicação web cliente.

7. **Qualidade e Testes Obrigatórios:**
   - Toda funcionalidade deve ser acompanhada de testes unitários e de integração (Vitest).
   - Testes negativos de isolamento multi-tenant são obrigatórios antes de considerar migrações ou fluxos como concluídos.

---

## 2. Estrutura do Repositório

```
├── .agents/                    # Customizações e regras
├── docs/                       # Documentação técnica de arquitetura e segurança
│   ├── ARCHITECTURE.md         # Arquitetura e limites de confiança
│   ├── DATA_MODEL.md           # Modelo de dados relacional
│   ├── ACCESS_CONTROL.md       # Matriz de permissões por papel
│   ├── THREAT_MODEL.md         # Modelo de ameaças e controles OWASP
│   ├── PRIVACY.md              # Diretrizes de conformidade LGPD
│   └── DEPLOYMENT.md           # Guia de implantação e ambientes
├── supabase/
│   ├── migrations/             # Migrações SQL versionadas
│   │   └── 0001_tenant_isolation_core.sql
│   └── functions/              # Edge Functions para fluxos privilegiados
├── src/
│   ├── components/             # Componentes UI reutilizáveis acessíveis
│   ├── contexts/               # Contextos React (Auth, Tenant, Theme)
│   ├── lib/                    # Cliente Supabase e utilitários de infraestrutura
│   ├── modules/                # Módulos de domínio
│   │   ├── auth/               # Autenticação e perfis
│   │   ├── cases/              # Gestão de processos e validação CNJ
│   │   ├── clients/            # Cadastro de clientes e vínculos
│   │   ├── documents/          # Gestão documental e downloads assinados
│   │   ├── portal-admin/       # Painel administrativo do escritório
│   │   ├── portal-client/      # Painel simplificado do cliente
│   │   └── timeline/           # Linha do tempo de movimentações
│   ├── types/                  # Definições de tipos TypeScript do banco e da UI
│   ├── utils/                  # Formatadores (CNJ, moeda, data) e validadores
│   ├── App.tsx
│   ├── index.css               # Design system e Tailwind CSS
│   └── main.tsx
└── tests/                      # Testes automatizados (Vitest)
```

---

## 3. Comandos de Trabalho

- `npm run dev`: Inicia o servidor de desenvolvimento Vite local.
- `npm run build`: Compila o TypeScript e empacota para produção.
- `npm run test`: Executa os testes automatizados com Vitest.
- `npm run lint`: Valida conformidade e tipagem do código.
