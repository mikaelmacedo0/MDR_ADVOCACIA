# JurisAcompanha — Arquitetura (revisão 1)

## Decisões confirmadas
- Um cliente pode se relacionar com vários escritórios (tenants).
- Cada escritório mantém um cadastro de cliente próprio e isolado.
- Superadministrador da plataforma não recebe acesso ao conteúdo jurídico por padrão.
- O navegador nunca é a fronteira de autorização: o PostgreSQL/RLS e os serviços confiáveis fazem a validação.

## Componentes planejados
- Front-end: React + TypeScript + Vite.
- Identidade: Supabase Auth.
- Banco: Supabase PostgreSQL com RLS em todas as tabelas privadas expostas.
- Arquivos: Supabase Storage privado, URLs assinadas de curta duração e validação de upload.
- Operações privilegiadas: Edge Functions ou backend confiável; nunca expor service-role key no navegador.
- Qualidade: testes unitários e de integração, Playwright para fluxos, testes negativos de isolamento entre tenants.

## Limites de confiança
1. Navegador: não confiável; parâmetros e IDs enviados pelo usuário podem ser manipulados.
2. Sessão Auth: prova a identidade, mas não concede automaticamente acesso a um tenant.
3. RLS e constraints: aplicam isolamento e evitam relações entre tenants.
4. Backend privilegiado: acesso mínimo, segredos fora do cliente, operações auditadas.
5. Storage: bucket privado; autorização do objeto deve ser tão restrita quanto a do registro no banco.

## Decisões pendentes
- Região do projeto e avaliação de transferências internacionais de dados.
- Processo de convite e verificação da identidade do cliente antes de criar `client_user_links`.
- Retenção de logs/documentos, backups e recuperação.
- Política de MFA e resposta a incidentes.
