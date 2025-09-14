# Configuração da API de Taxa de Câmbio

Para habilitar as atualizações automáticas das taxas de câmbio, você precisa configurar uma variável de ambiente:

## Passo 1: Obter uma chave gratuita da API

1. Acesse https://app.exchangerate-api.com/sign-up
2. Faça o cadastro gratuito (permite 1.500 requests por mês)
3. Copie sua API key

## Passo 2: Configurar no servidor

### Opção 1: Via PM2 (Recomendado)

```bash
pm2 set EXCHANGE_API_KEY "sua_api_key_aqui"
pm2 restart wpanel
```

### Opção 2: Via arquivo .env

Crie um arquivo `.env` na raiz do projeto:

```
EXCHANGE_API_KEY=sua_api_key_aqui
```

### Opção 3: Via ambiente do sistema

```bash
export EXCHANGE_API_KEY="sua_api_key_aqui"
```

## Como verificar se está funcionando

1. Após configurar, reinicie o servidor
2. Verifique os logs: `tail -f logs/wpanel.log`
3. Você deve ver mensagens como:
   ```
   Updating exchange rates...
   Updated exchange rate: USD to BRL = 5.1234
   Updated exchange rate: EUR to BRL = 5.5678
   Exchange rates updated successfully
   ```

## Frequência de atualização

- As taxas são atualizadas automaticamente a cada hora
- Na inicialização do servidor, há uma atualização após 5 segundos
- Se a API key não estiver configurada, o sistema usa as taxas já armazenadas na base de dados

## Status atual

✅ Tabela `exchange_rates` criada e configurada
✅ Sistema de atualização automática implementado
✅ Frontend configurado para usar as taxas da base de dados
❌ API key precisa ser configurada para atualizações automáticas

## Backup manual

Se a API estiver indisponível, você pode adicionar taxas manualmente via:

```bash
curl -X POST http://localhost:5000/api/exchange-rates \
  -H "Content-Type: application/json" \
  -d '{"fromCurrency":"USD","toCurrency":"BRL","rate":5.20}'

curl -X POST http://localhost:5000/api/exchange-rates \
  -H "Content-Type: application/json" \
  -d '{"fromCurrency":"EUR","toCurrency":"BRL","rate":5.60}'
```