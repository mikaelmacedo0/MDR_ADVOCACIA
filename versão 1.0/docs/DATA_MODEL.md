# JurisAcompanha — Modelo de dados (revisão 1)

## Regra multi-tenant
`tenant_id` é obrigatório nas entidades jurídicas pertencentes a um escritório. Chaves estrangeiras compostas `(tenant_id, id)` garantem que ligações de processos, clientes, eventos e documentos não atravessem tenants.

## Entidades da primeira migração
- `tenants`: escritórios.
- `profiles`: perfil básico global ligado a `auth.users`.
- `memberships`: membros internos do escritório (`office_admin`, `lawyer`, `collaborator`).
- `clients`: cadastro de cliente específico do escritório.
- `client_user_links`: vínculo entre identidade autenticada e cadastro de cliente em determinado escritório.
- `cases`: processos do escritório.
- `case_client_links`: relação entre processos e clientes no mesmo tenant.
- `case_events`: eventos/atualizações com visibilidade `internal` ou `client`.
- `documents`: metadados de arquivo, visibilidade e estado de verificação; bytes ficam para migração de Storage separada.
- `audit_logs`: estrutura inicial para trilha de auditoria; leitura/escrita por clientes fica bloqueada.

## Cliente em vários escritórios
Uma pessoa tem uma identidade global em `auth.users`, mas cada escritório cria seu próprio registro em `clients`. O vínculo com cada cadastro é independente em `client_user_links`. Não existe consulta cruzada automática nem compartilhamento de processos.

## Entidades futuras
`calendar_events`, `tasks`, `notifications`, `notification_preferences`, `invitations`, `consent_records`, `privacy_requests`, `document_versions`, `security_events` e mecanismos de auditoria/retention serão introduzidos em migrações posteriores.

## Observação
A primeira migração é uma base revisável, não uma autorização para produção. Ainda faltam Storage, provisionamento confiável, vínculo verificado de contas, testes automatizados e políticas operacionais.
