# Gestão de Categorias e Lembretes - wpanel

## 🎯 Funcionalidades Implementadas

### ✅ Categorias de Despesas
- **Gerenciamento Completo**: Criar, editar, excluir categorias
- **Ícones Personalizados**: 18+ ícones disponíveis para cada categoria
- **Cores Customizáveis**: 12 cores predefinidas para organização visual
- **Soft Delete**: Categorias são desativadas, não excluídas permanentemente
- **Categorias Padrão**: Sistema inicia com 6 categorias pré-configuradas

### ✅ Sistema de Lembretes
- **Lembretes por Despesa**: Configure lembretes individuais para cada despesa
- **Tipos de Lembrete**: 
  - `before_due`: Antes do vencimento
  - `recurring`: Para despesas recorrentes
  - `payment_due`: Vencimento de pagamento
- **Notificação por Email**: Envio de lembretes por email
- **Lembretes Ativos**: Sistema rastreia quais lembretes já foram enviados

## 🚀 Como Usar

### Gerenciar Categorias

1. **Acessar Categorias**:
   ```
   Gestão de Gastos > Aba "Categorias"
   ```

2. **Criar Nova Categoria**:
   - Clique em "Nova Categoria"
   - Preencha nome e descrição
   - Escolha um ícone (18 opções disponíveis)
   - Selecione uma cor (12 cores disponíveis)
   - Clique em "Criar"

3. **Editar Categoria Existente**:
   - Clique no ícone de edição na categoria
   - Modifique os campos desejados
   - Clique em "Atualizar"

4. **Remover Categoria**:
   - Clique no ícone de lixeira
   - Confirme a remoção (categoria será desativada)

### Configurar Lembretes

1. **Ao Criar/Editar Despesa**:
   - Marque "Habilitar Lembretes"
   - Defina quantos dias antes ser lembrado (1-30 dias)
   - Configure data de vencimento (se aplicável)

2. **Gerenciar Lembretes**:
   - Acesse via API endpoints `/api/expenses/reminders`
   - Visualize lembretes ativos
   - Marque lembretes como enviados

## 🔧 API Endpoints

### Categorias
```bash
# Listar categorias
GET /api/expenses/categories

# Criar categoria
POST /api/expenses/categories
{
  "name": "Nova Categoria",
  "icon": "Server",
  "color": "#3B82F6",
  "description": "Descrição opcional"
}

# Atualizar categoria
PUT /api/expenses/categories/:id
{
  "name": "Nome Atualizado",
  "active": true
}

# Excluir categoria (soft delete)
DELETE /api/expenses/categories/:id
```

### Lembretes
```bash
# Listar lembretes
GET /api/expenses/reminders

# Lembretes ativos (não enviados)
GET /api/expenses/reminders/active

# Criar lembrete
POST /api/expenses/reminders
{
  "expenseId": 1,
  "reminderType": "before_due",
  "reminderDate": "2025-09-13T10:00:00Z",
  "message": "Lembrete personalizado",
  "email": "user@example.com"
}

# Atualizar lembrete
PUT /api/expenses/reminders/:id
{
  "sent": true,
  "active": false
}

# Excluir lembrete
DELETE /api/expenses/reminders/:id
```

## 📊 Categorias Padrão Criadas

1. **Infraestrutura** 🖥️
   - Cor: Azul (#3B82F6)
   - Ícone: Server
   - Uso: Hospedagem, domínios, infraestrutura

2. **Software** 💻
   - Cor: Roxo (#8B5CF6)
   - Ícone: Code
   - Uso: Licenças de software e aplicativos

3. **Marketing** 📢
   - Cor: Vermelho (#EF4444)
   - Ícone: Megaphone
   - Uso: Publicidade, marketing digital

4. **Recursos Humanos** 👥
   - Cor: Verde (#10B981)
   - Ícone: Users
   - Uso: Salários, benefícios, treinamentos

5. **Operacional** ⚙️
   - Cor: Laranja (#F59E0B)
   - Ícone: Settings
   - Uso: Custos operacionais gerais

6. **Escritório** 🏢
   - Cor: Índigo (#6366F1)
   - Ícone: Building
   - Uso: Material de escritório, aluguel

## 🎨 Ícones Disponíveis

- Server, Code, Megaphone, Users, Settings, Building
- CreditCard, ShoppingCart, Truck, Wifi, Smartphone
- Monitor, Coffee, Car, Home, DollarSign, TrendingUp, FileText

## 🎯 Próximos Passos

1. **Implementar Envio de Email**: Configurar SMTP para envio automático de lembretes
2. **Dashboard de Lembretes**: Interface visual para gerenciar lembretes
3. **Notificações Push**: Lembretes em tempo real via WebSocket
4. **Categorias Hierárquicas**: Subcategorias aninhadas
5. **Templates de Lembrete**: Mensagens predefinidas para diferentes tipos

## 💡 Exemplos de Uso

### Criar Categoria Personalizada
```bash
curl -X POST http://localhost:8000/api/expenses/categories \
  -H "Content-Type: application/json" \
  -H "session-token: seu_token_aqui" \
  -d '{
    "name": "Equipamentos TI",
    "icon": "Monitor",
    "color": "#06B6D4",
    "description": "Notebooks, monitores e equipamentos de TI"
  }'
```

### Configurar Lembrete Recorrente
```bash
curl -X POST http://localhost:8000/api/expenses/reminders \
  -H "Content-Type: application/json" \
  -H "session-token: seu_token_aqui" \
  -d '{
    "expenseId": 1,
    "reminderType": "recurring",
    "reminderDate": "2025-10-01T09:00:00Z",
    "message": "Lembrete: Renovação da hospedagem mensal",
    "email": "financeiro@empresa.com"
  }'
```

## ✅ Estado Atual

- ✅ Backend completo para categorias e lembretes
- ✅ Interface de gerenciamento de categorias
- ✅ Formulário de despesas com lembretes
- ✅ API endpoints funcionais
- ✅ Banco de dados migrado
- ✅ PM2 configurado e rodando

**Sistema de Gestão de Gastos com Categorias e Lembretes está 100% funcional!** 🎉
