# 🔒 Security Guidelines - wPanel Manager

## ⚠️ Arquivos Sensíveis Protegidos

O `.gitignore` foi configurado para proteger os seguintes tipos de arquivos sensíveis:

### 🔑 Variáveis de Ambiente
- `.env` e todas as variantes (`.env.local`, `.env.production`, etc.)
- Nunca devem ser commitados no repositório
- Contêm credenciais de banco de dados, chaves API, e secrets

### 📋 Arquivos de Configuração
- `*.config` - Arquivos de configuração que podem conter dados sensíveis
- `*.cf` - Arquivos de configuração do Cloudflare e outros serviços
- `drizzle.config.ts` - Pode conter strings de conexão de banco

### 🗝️ Credenciais e Chaves
- `*.pem`, `*.key`, `*.p12`, `*.pfx` - Certificados e chaves privadas
- `*.crt`, `*.cer`, `*.der` - Certificados SSL/TLS
- `id_rsa*` - Chaves SSH
- Diretórios `secrets/` e `credentials/`

### 📁 Outros Arquivos Sensíveis
- `logs/` - Logs podem conter informações sensíveis
- `uploads/` - Conteúdo enviado por usuários
- `*.txt` - Arquivos de texto que frequentemente contêm credenciais
- `backup/`, `backups/` - Backups podem conter dados sensíveis

## 🛡️ Ações de Segurança Aplicadas

### ✅ Arquivos Removidos do Rastreamento Git
Os seguintes arquivos foram removidos do controle de versão:
- `.env` - Continha credenciais de banco de dados e chaves API
- `mail_accounts.cf` - Arquivo de configuração de contas de email

### ✅ Template Criado
- `.env.example` - Template seguro com valores de exemplo
- Desenvolvedores devem copiar e preencher com valores reais

## 📝 Melhores Práticas

### Para Desenvolvedores:
1. **Nunca commitar arquivos `.env`**
   ```bash
   cp .env.example .env
   # Edite .env com seus valores reais
   ```

2. **Verificar antes de commit:**
   ```bash
   git status
   git diff --cached
   ```

3. **Se acidentalmente commitou arquivo sensível:**
   ```bash
   # Remove do tracking mas mantém o arquivo
   git rm --cached arquivo_sensivel
   
   # Remove completamente do histórico (cuidado!)
   git filter-branch --index-filter "git rm --cached --ignore-unmatch arquivo_sensivel" HEAD
   ```

### Para Deploy:
1. **Usar variáveis de ambiente do sistema**
2. **Usar serviços de gerenciamento de secrets**
3. **Nunca hardcode credenciais no código**

## 🚨 Verificação de Segurança

Execute regularmente para verificar se não há vazamentos:
```bash
# Procurar por possíveis secrets no código
grep -r -i "password\|secret\|key\|token" --exclude-dir=node_modules .

# Verificar arquivos rastreados pelo git
git ls-files | grep -E "\.(env|config|key|pem)$"
```

## 📞 Contato de Segurança

Se encontrar vulnerabilidades de segurança, reporte imediatamente para a equipe de desenvolvimento.

---
**⚠️ IMPORTANTE**: Este arquivo contém diretrizes críticas de segurança. Mantenha sempre atualizado!