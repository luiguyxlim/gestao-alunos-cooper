# ⚠️ ERRO: Tabelas não encontradas no Supabase

## Problema Identificado

O erro que você está vendo no console:
```
Error fetching tests stats: {
  code: 'PGRST205',
  message: "Could not find the table 'public.performance_tests' in the schema cache"
}
```

Indica que as tabelas do banco de dados não foram criadas no seu projeto Supabase.

## ✅ Solução

### 1. Acesse o Supabase Dashboard
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto que você está usando

### 2. Execute o Script SQL
1. No dashboard do Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New query"**
3. Abra o arquivo `supabase-setup.sql` que está na raiz do projeto
4. Copie **TODO** o conteúdo do arquivo (205 linhas)
5. Cole no editor SQL do Supabase
6. Clique em **"Run"** para executar o script

### 3. Verifique se as tabelas foram criadas
Após executar o script, você deve ver as seguintes tabelas criadas:
- ✅ `profiles` - Perfis dos usuários
- ✅ `students` - Dados dos alunos  
- ✅ `performance_tests` - Testes de performance

### 4. Teste a aplicação
1. Volte para a aplicação em `http://localhost:3000`
2. Faça login ou registre-se
3. Tente acessar o dashboard
4. Os erros devem desaparecer

## 🔍 Como verificar se funcionou

### No Supabase Dashboard:
1. Vá para **"Table Editor"**
2. Você deve ver as 3 tabelas listadas
3. Clique em cada uma para verificar a estrutura

### Na aplicação:
1. O dashboard deve carregar sem erros
2. Você pode criar alunos
3. Você pode criar testes de performance
4. As estatísticas devem aparecer corretamente

## 📋 Conteúdo do Script SQL

O script `supabase-setup.sql` cria:
- **Tabelas** com estrutura completa
- **Políticas de segurança (RLS)** para proteger os dados
- **Triggers** para atualização automática de timestamps
- **Índices** para melhor performance
- **Função** para criação automática de perfis

## 🚨 Importante

- **Execute o script completo** - não execute apenas partes
- **Aguarde a execução** - pode levar alguns segundos
- **Verifique erros** - se houver erros na execução, leia as mensagens
- **Reinicie a aplicação** - após criar as tabelas, recarregue a página

## 💡 Dica

Se você ainda tiver problemas após executar o script:
1. Verifique se as variáveis de ambiente estão corretas no `.env.local`
2. Confirme que você está usando o projeto correto no Supabase
3. Verifique se o projeto Supabase está ativo (não pausado)

---

**Status atual:** ⚠️ Tabelas não criadas - Execute o script SQL para resolver