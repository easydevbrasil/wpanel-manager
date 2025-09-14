# WPanel API Documentation
# Novidades

- Sidebar colapsável por padrão, com preferência do usuário salva e restaurada automaticamente.
- Preferências de usuário (tema, cores, sidebar) persistidas no backend e frontend.
- Indicador WebSocket com animação de transmissão de dados e contador de reconexões por falha.
- Link direto para esta documentação na sidebar do sistema.


## Visão Geral

O WPanel oferece gerenciamento completo de sistema, firewall, Docker, contas de email e preferências do usuário. Todas as rotas da API (exceto autenticação e Swagger) requerem autenticação via API key.

Funcionalidades recentes:
- Sidebar colapsável e personalizável
- Preferências persistentes do usuário
- Indicador WebSocket com reconexão automática e contador de quedas

## Autenticação

### API Key

Todas as requisições para a API devem incluir o header `X-API-Key` com uma chave válida:

```bash
curl -H "X-API-Key: wpanel-dev-key-2025" http://localhost:8000/api/system/stats
```

### API Keys Padrão

- `wpanel-dev-key-2025` - Chave de desenvolvimento
- `wpanel-admin-key-secure` - Chave de administrador  
- `wpanel-readonly-key-123` - Chave somente leitura

## Documentação Interativa

Acesse a documentação Swagger em: **http://localhost:8000/swagger**

A documentação interativa permite:
- Visualizar todos os endpoints disponíveis
- Testar APIs diretamente pelo browser
- Ver exemplos de requisições e respostas
- Configurar autenticação com API key

## Principais Endpoints
### Preferências do Usuário
- `GET /api/user/preferences` - Buscar preferências do usuário
- `PUT /api/user/preferences` - Atualizar preferências do usuário

### WebSocket
- `/ws` - Conexão WebSocket para notificações em tempo real, reconexão automática e contador de quedas


### Sistema
- `GET /api/system/stats` - Estatísticas do sistema (CPU, memória, disco)

### Firewall
- `GET /api/firewall/rules` - Listar regras do firewall
- `POST /api/firewall/rules` - Adicionar nova regra
- `DELETE /api/firewall/rules/{id}` - Deletar regra
- `POST /api/firewall/quick-action` - Ação rápida (bloquear/liberar IP)
- `GET /api/firewall/stats` - Estatísticas do firewall

### Gerenciamento de API Keys (Admin)
- `GET /api/admin/api-keys` - Listar todas as API keys
- `POST /api/admin/api-keys` - Gerar nova API key
- `DELETE /api/admin/api-keys/{apiKey}` - Deletar API key

## Exemplos de Uso

### 1. Verificar Status do Sistema

```bash
curl -X GET \
  http://localhost:8000/api/system/stats \
  -H "X-API-Key: wpanel-dev-key-2025"
```

### 2. Listar Regras do Firewall

```bash
curl -X GET \
  http://localhost:8000/api/firewall/rules \
  -H "X-API-Key: wpanel-dev-key-2025"
```

### 3. Bloquear IP

```bash
curl -X POST \
  http://localhost:8000/api/firewall/quick-action \
  -H "X-API-Key: wpanel-dev-key-2025" \
  -H "Content-Type: application/json" \
  -d '{"target": "192.168.1.100", "action": "block"}'
```

### 4. Adicionar Regra de Firewall

```bash
curl -X POST \
  http://localhost:8000/api/firewall/rules \
  -H "X-API-Key: wpanel-dev-key-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "INPUT",
    "target": "DROP",
    "protocol": "tcp",
    "source": "192.168.1.0/24",
    "dport": "22",
    "comment": "Block SSH from local network"
  }'
```

### 5. Gerar Nova API Key

```bash
curl -X POST \
  http://localhost:8000/api/admin/api-keys \
  -H "X-API-Key: wpanel-admin-key-secure"
```

## Códigos de Resposta

- `200 OK` - Requisição bem-sucedida
- `400 Bad Request` - Dados inválidos na requisição
- `401 Unauthorized` - API key ausente ou inválida
- `403 Forbidden` - API key válida mas sem permissões
- `404 Not Found` - Recurso não encontrado
- `500 Internal Server Error` - Erro interno do servidor

## Formato de Resposta

### Sucesso
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* dados da resposta */ }
}
```

### Erro
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

## Rate Limiting

Atualmente não há limite de taxa implementado, mas recomenda-se fazer no máximo 100 requisições por minuto para evitar sobrecarga do sistema.

## Segurança

1. **Mantenha suas API keys seguras** - Não as compartilhe ou armazene em código público
2. **Use HTTPS em produção** - As API keys são enviadas em headers
3. **Rotacione as chaves regularmente** - Gere novas chaves e remova as antigas
4. **Monitor o uso** - Acompanhe logs de acesso à API

## Suporte

Para dúvidas ou problemas com a API:
- Consulte a documentação Swagger em `/swagger`
- Verifique os logs do sistema
- Entre em contato com o suporte técnico

---

**Nota**: Esta documentação é para a versão de desenvolvimento. Em produção, configure suas próprias API keys e implemente políticas de segurança adequadas.
