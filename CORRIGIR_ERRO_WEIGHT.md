# 🔧 Correção do Erro da Coluna Weight

## ❌ Problema Identificado

O erro `Could not find the 'weight' column of 'evaluatees' in the schema cache` indica que a coluna `weight` não existe na tabela `evaluatees` no banco de dados Supabase.

## ✅ Solução

Execute o script SQL `fix_evaluatees_table.sql` no SQL Editor do Supabase para corrigir este problema.

### 📋 Passos para Correção:

1. **Acesse o Supabase Dashboard**
   - Vá para [supabase.com](https://supabase.com)
   - Faça login na sua conta
   - Selecione o projeto Cooper Pro

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query" para criar uma nova consulta

3. **Execute o Script de Correção**
   - Copie todo o conteúdo do arquivo `fix_evaluatees_table.sql`
   - Cole no SQL Editor
   - Clique em "Run" para executar

4. **Verifique o Resultado**
   - O script deve executar sem erros
   - Você verá mensagens de sucesso indicando:
     - Se a tabela foi renomeada de `students` para `evaluatees`
     - Se a coluna `weight` foi adicionada
     - A estrutura final da tabela

### 🎯 O que o Script Faz:

- ✅ Renomeia a tabela `students` para `evaluatees` (se necessário)
- ✅ Adiciona a coluna `weight` do tipo `DECIMAL(5,2)`
- ✅ Atualiza as políticas RLS (Row Level Security)
- ✅ Cria triggers para atualização automática de timestamps
- ✅ Verifica a estrutura final da tabela

### 🔍 Verificação

Após executar o script, você pode verificar se tudo está correto executando:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'evaluatees'
ORDER BY ordinal_position;
```

Você deve ver a coluna `weight` listada com o tipo `numeric`.

### 🚀 Após a Correção

1. **Recarregue a aplicação** no navegador
2. **Teste a criação de um novo avaliando**
3. **Verifique se o erro desapareceu**

---

## 🆘 Se Ainda Houver Problemas

Se o erro persistir após executar o script:

1. Verifique se você está no projeto correto no Supabase
2. Confirme se as variáveis de ambiente no `.env.local` estão corretas
3. Reinicie o servidor de desenvolvimento (`npm run dev`)
4. Limpe o cache do navegador

---

**Status**: 🔧 Script criado - Pronto para execução no Supabase
**Próximo passo**: Executar o script no SQL Editor do Supabase