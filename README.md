# wPanel Manager

wPanel Manager é um painel administrativo moderno para gerenciamento de servidores, tarefas agendadas, DNS, containers Docker, banco de dados, firewall, e muito mais.

## Funcionalidades
- **Dashboard**: Visão geral do sistema, recursos, status e alertas.
- **Agendamento de Tarefas**: Crie, edite, execute e monitore tarefas automáticas com logs em tempo real.
- **Gerenciador de DNS**: Visualize, crie, edite e remova registros DNS facilmente.
- **Gerenciamento de Containers Docker**: Controle containers, imagens e volumes.
- **Banco de Dados**: Backup, restauração e administração de bancos PostgreSQL.
- **Firewall**: Gerencie regras e monitore acessos.
- **Monitoramento**: Estatísticas de sistema, uso de recursos, alertas e relatórios.
- **Gerenciamento de Usuários**: Controle de acesso, permissões e perfis.
- **Interface Responsiva**: UI/UX otimizada para desktop e mobile.

## Instalação
1. Clone o repositório:
   ```bash
   git clone https://github.com/easydevbrasil/wpanel-manager.git
   cd wpanel-manager
   ```
2. Instale as dependências:
   ```bash
   bun install
   ```
3. Configure variáveis de ambiente:
   - Copie `.env.example` para `.env` e ajuste conforme necessário.
4. Execute o build e inicie:
   ```bash
   bun run rebuild
   ```

## Scripts Úteis
- `bun run dev` — Inicia ambiente de desenvolvimento.
- `bun run build` — Gera build de produção.
- `bun run rebuild` — Limpa cache, instala dependências, builda e reinicia servidor.
- `bun run start` — Inicia painel em modo produção.

## Estrutura do Projeto
```
client/         # Frontend React + Vite
server/         # Backend Node.js/Express
migrations/     # Scripts de banco de dados
logs/           # Logs do sistema
uploads/        # Arquivos enviados
shared/         # Schemas e utilitários comuns
scripts/        # Scripts auxiliares
```

## Tecnologias
- React, Vite, TailwindCSS
- Node.js, Express
- PostgreSQL, Drizzle ORM
- Docker
- PM2

## Contribuição
Pull requests são bem-vindos! Para grandes mudanças, abra uma issue primeiro para discutir o que deseja modificar.

## Licença
MIT

---
Desenvolvido por EasyDev Brasil.
