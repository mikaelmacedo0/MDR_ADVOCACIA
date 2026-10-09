# JurisAcompanha — Etapa 1 atualizada

Este pacote contém a documentação revisada e a primeira migração SQL para revisão.

## Arquivos
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/ACCESS_CONTROL.md`
- `docs/THREAT_MODEL.md`
- `supabase/migrations/0001_tenant_isolation_core.sql`

## Importante
A migração SQL **não foi executada**. Não a execute em produção. Antes de executar até em desenvolvimento:
1. Revise o SQL com atenção.
2. Crie um projeto Supabase de desenvolvimento separado.
3. Confirme as decisões de identidade, papéis e acesso.
4. Faça uma revisão técnica das funções `SECURITY DEFINER`, privilégios e políticas RLS.
5. Execute testes negativos de isolamento entre dois tenants.
6. Só então aplique a migração em um ambiente descartável/dev.

Esta migração ainda não cria bucket de Storage nem fluxos de convite, vínculo de contas, notificações, agenda, tarefas ou auditoria completa.
