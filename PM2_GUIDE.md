# Scripts de Gerenciamento PM2 - wpanel

## Comandos Básicos

### Iniciar o servidor
```bash
pm2 start "bun run server/index.ts" --name wpanel
```

### Parar o servidor
```bash
pm2 stop wpanel
```

### Reiniciar o servidor
```bash
pm2 restart wpanel
```

### Recarregar o servidor (zero downtime)
```bash
pm2 reload wpanel
```

### Ver logs em tempo real
```bash
pm2 logs wpanel
```

### Ver logs das últimas 100 linhas
```bash
pm2 logs wpanel --lines 100
```

### Ver status dos processos
```bash
pm2 status
```

### Ver informações detalhadas
```bash
pm2 show wpanel
```

### Monitorar em tempo real
```bash
pm2 monit
```

### Limpar logs
```bash
pm2 flush wpanel
```

### Remover processo do PM2
```bash
pm2 delete wpanel
```

### Salvar configuração atual (para auto-start)
```bash
pm2 save
pm2 startup
```

## Estado Atual

✅ Servidor wpanel rodando com PM2
✅ Gestão de Gastos (expenses) totalmente funcional
✅ API endpoints funcionando:
- GET /api/expenses (listar despesas)
- POST /api/expenses (criar despesa)  
- PUT /api/expenses/:id (atualizar despesa)
- DELETE /api/expenses/:id (excluir despesa)
- GET /api/expenses/stats (estatísticas)

✅ Banco de dados com tabela expenses criada
✅ Frontend integrado com backend via autenticação
✅ Logs centralizados via PM2

## Funcionalidades de Expenses

### Campos Suportados:
- description: Descrição da despesa
- amount: Valor (string para precisão decimal)
- category: Categoria (ex: "Infraestrutura", "Software", etc)
- subcategory: Subcategoria
- date: Data da despesa
- notes: Observações opcionais
- paymentMethod: Método de pagamento
- recurring: Se é recorrente (boolean)
- recurringPeriod: Período da recorrência (monthly, yearly, etc)

### Estatísticas:
- totalMonth: Total do mês atual
- totalYear: Total do ano atual
- byCategory: Totais por categoria
- monthlyTrend: Tendência dos últimos 12 meses
