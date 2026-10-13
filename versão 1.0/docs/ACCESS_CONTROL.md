# JurisAcompanha — Matriz de permissões (revisão 1)

| Ação | Superadmin SaaS | Admin do escritório | Advogado | Colaborador | Cliente vinculado |
|---|---|---|---|---|---|
| Gerir operação global do SaaS | Sim, sem conteúdo jurídico | Não | Não | Não | Não |
| Ler conteúdo jurídico do tenant | Não por padrão | Sim, do próprio tenant | Sim, do próprio tenant | Sim, do próprio tenant conforme função | Apenas processos e eventos/documentos explicitamente visíveis e vinculados |
| Criar/editar cadastro de cliente | Não | Sim | Sim | Não na migração inicial | Não |
| Criar/editar processo | Não | Sim | Sim | Não na migração inicial | Não |
| Excluir processo | Não | Sim | Não | Não | Não |
| Criar evento/atualização | Não | Sim | Sim | Sim, apenas membro do tenant | Não |
| Editar/excluir evento | Não | Sim | Sim | Não | Não |
| Gerir vínculo de identidade do cliente | Não | Via fluxo confiável futuro | Via fluxo confiável futuro | Não | Não |
| Gerir papéis/membros | Não por SQL direto no cliente | Via fluxo confiável futuro | Não | Não | Não |
| Acessar arquivos | Não | Conforme tenant e controles de arquivo | Conforme tenant e controles de arquivo | Conforme tenant e controles de arquivo | Somente arquivos visíveis ao cliente, verificados como limpos e vinculados |
| Ler/escrever auditoria | Não por acesso direto ao conteúdo | Relatório futuro restrito | Relatório futuro restrito | Não | Não |

## Notas
- A matriz expressa o desenho pretendido; a primeira migração implementa apenas parte dele.
- `collaborator` pode consultar dados do tenant e criar eventos, mas não gerenciar clientes/processos na primeira migração.
- A criação de tenants, convites, papéis e vínculos cliente-conta deve ocorrer por serviço confiável com validação e auditoria.
- O papel superadmin não é inserido em `memberships` e não recebe políticas de leitura das tabelas jurídicas.
- Nenhum papel do SaaS deve usar a service-role key no navegador.
