# JurisAcompanha — Modelo de ameaças (revisão 1)

## Ativos a proteger
Dados pessoais, peças e documentos jurídicos, dados de processo, comunicações advogado-cliente, credenciais, sessões, chaves de serviço, metadados de auditoria e disponibilidade.

## Atores/ameaças
1. Cliente tentando consultar ID de outro cliente ou processo (IDOR).
2. Usuário de um escritório tentando consultar registros de outro tenant.
3. Colaborador tentando executar ações administrativas.
4. Conta comprometida de advogado/admin.
5. Superadmin ou operador SaaS tentando acessar conteúdo jurídico sem autorização.
6. Upload de arquivo malicioso, tipo MIME falso ou arquivo excessivo.
7. Exposição de chave privilegiada no bundle do navegador.
8. Abuso de links assinados, logs contendo dados sensíveis ou backups acessíveis.
9. Erros de configuração que desabilitem RLS ou concedam privilégios excessivos.

## Controles previstos
- RLS em todas as tabelas privadas expostas.
- Helpers de autorização com `SECURITY DEFINER` restritos, `search_path` fixo e privilégios explícitos.
- Chaves estrangeiras compostas para impedir relações entre tenants.
- Buckets privados, verificação de arquivos, quarentena e URLs assinadas de curta duração.
- MFA para contas privilegiadas, menor privilégio e fluxo confiável para convites/vínculos.
- Auditoria mínima sem conteúdo de documentos, tokens ou narrativas jurídicas desnecessárias.
- Testes negativos com usuários de dois tenants para cada operação CRUD e para arquivos.
- Backups, restauração testada, retenção e plano de resposta a incidentes.

## Risco residual / limitações atuais
- A migração inicial não configura Storage, MFA, notificações, backup ou monitoramento.
- As funções privilegiadas e os fluxos de provisionamento ainda precisam ser implementados e revisados.
- `SECURITY DEFINER` e políticas RLS precisam de revisão e testes no projeto Supabase real.
- Dados de produção não devem ser usados antes de uma revisão de segurança e de privacidade/LGPD.
