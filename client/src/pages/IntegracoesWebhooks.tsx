
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Settings, Code, Bell, Users, Package, ShoppingCart, Headphones, Container, FileText, Shield, Play, Globe, AlertTriangle, Webhook } from 'lucide-react';

// VS Code style editor
interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: string;
}
function CodeEditor({ value, onChange, language = "json" }: CodeEditorProps) {
    return (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        payload.{language}
                    </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                    {language.toUpperCase()}
                </Badge>
            </div>
            <div className="relative">
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm border-none outline-none resize-none leading-6"
                    style={{ fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace" }}
                    spellCheck={false}
                />
                <div className="absolute top-0 left-0 p-4 pr-2 text-gray-400 dark:text-gray-600 font-mono text-sm leading-6 pointer-events-none select-none">
                    {value.split('\n').map((_, index: number) => (
                        <div key={index} className="text-right w-6">{index + 1}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface WebhookConfig {
    url: string;
    method: string;
    format: string;
    headers: string;
    secretKey: string;
    events: string[];
    isActive: boolean;
}
const defaultWebhookConfig: WebhookConfig = {
    url: "https://n8n.easydev.com.br/webhook-test/f5a0ea69-c6c8-4b93-92b2-e26a84f33229",
    method: "POST",
    format: "json",
    headers: '{"Content-Type": "application/json", "Authorization": "Bearer token"}',
    secretKey: "",
    events: [],
    isActive: true
};

const eventExamples = [
    // Clientes
    { value: 'client.created', label: 'Cliente Criado', category: 'Clientes' },
    { value: 'client.updated', label: 'Cliente Atualizado', category: 'Clientes' },
    { value: 'client.deleted', label: 'Cliente Removido', category: 'Clientes' },
    // Produtos
    { value: 'product.created', label: 'Produto Criado', category: 'Produtos' },
    { value: 'product.updated', label: 'Produto Atualizado', category: 'Produtos' },
    { value: 'product.deleted', label: 'Produto Removido', category: 'Produtos' },
    { value: 'product.stock_low', label: 'Estoque Baixo', category: 'Produtos' },
    // Fornecedores
    { value: 'supplier.created', label: 'Fornecedor Criado', category: 'Fornecedores' },
    { value: 'supplier.updated', label: 'Fornecedor Atualizado', category: 'Fornecedores' },
    { value: 'supplier.deleted', label: 'Fornecedor Removido', category: 'Fornecedores' },
    // Vendas
    { value: 'sale.created', label: 'Venda Criada', category: 'Vendas' },
    { value: 'sale.completed', label: 'Venda Finalizada', category: 'Vendas' },
    { value: 'sale.cancelled', label: 'Venda Cancelada', category: 'Vendas' },
    { value: 'sale.refunded', label: 'Venda Reembolsada', category: 'Vendas' },
    // Serviços
    { value: 'service.created', label: 'Serviço Criado', category: 'Serviços' },
    { value: 'service.updated', label: 'Serviço Atualizado', category: 'Serviços' },
    { value: 'service.deleted', label: 'Serviço Removido', category: 'Serviços' },
    // Categorias
    { value: 'category.created', label: 'Categoria Criada', category: 'Categorias' },
    { value: 'category.updated', label: 'Categoria Atualizada', category: 'Categorias' },
    { value: 'category.deleted', label: 'Categoria Removida', category: 'Categorias' },
    // Suporte
    { value: 'ticket.created', label: 'Ticket Criado', category: 'Suporte' },
    { value: 'ticket.updated', label: 'Ticket Atualizado', category: 'Suporte' },
    { value: 'ticket.resolved', label: 'Ticket Resolvido', category: 'Suporte' },
    // Despesas
    { value: 'expense.created', label: 'Despesa Criada', category: 'Despesas' },
    { value: 'expense.updated', label: 'Despesa Atualizada', category: 'Despesas' },
    { value: 'expense.deleted', label: 'Despesa Removida', category: 'Despesas' },
    // Provedores
    { value: 'provider.created', label: 'Provedor Criado', category: 'Provedores' },
    { value: 'provider.updated', label: 'Provedor Atualizado', category: 'Provedores' },
    { value: 'provider.deleted', label: 'Provedor Removido', category: 'Provedores' },
    // Câmbio
    { value: 'exchange-rate.created', label: 'Taxa de Câmbio Criada', category: 'Câmbio' },
    { value: 'exchange-rate.updated', label: 'Taxa de Câmbio Atualizada', category: 'Câmbio' },
    { value: 'exchange-rate.deleted', label: 'Taxa de Câmbio Removida', category: 'Câmbio' },
    // Notificações
    { value: 'notification.created', label: 'Notificação Criada', category: 'Notificações' },
    { value: 'notification.read', label: 'Notificação Lida', category: 'Notificações' },
    { value: 'notification.deleted', label: 'Notificação Removida', category: 'Notificações' },
    // Emails
    { value: 'email.received', label: 'Email Recebido', category: 'Emails' },
    { value: 'email.read', label: 'Email Lido', category: 'Emails' },
    { value: 'email.deleted', label: 'Email Removido', category: 'Emails' },
    // Navegação
    { value: 'navigation.created', label: 'Item de Navegação Criado', category: 'Navegação' },
    { value: 'navigation.updated', label: 'Item de Navegação Atualizado', category: 'Navegação' },
    { value: 'navigation.deleted', label: 'Item de Navegação Removido', category: 'Navegação' },
    // Dashboard
    { value: 'dashboard.stats', label: 'Estatísticas do Dashboard', category: 'Dashboard' },
    // Carrinho
    { value: 'cart.item_added', label: 'Item Adicionado ao Carrinho', category: 'Carrinho' },
    { value: 'cart.item_updated', label: 'Item Atualizado no Carrinho', category: 'Carrinho' },
    { value: 'cart.item_removed', label: 'Item Removido do Carrinho', category: 'Carrinho' },
    // Firewall
    { value: 'firewall.rule_created', label: 'Regra de Firewall Criada', category: 'Firewall' },
    { value: 'firewall.rule_updated', label: 'Regra de Firewall Atualizada', category: 'Firewall' },
    { value: 'firewall.rule_deleted', label: 'Regra de Firewall Removida', category: 'Firewall' },
    // Docker
    { value: 'container.created', label: 'Container Criado', category: 'Docker' },
    { value: 'container.started', label: 'Container Iniciado', category: 'Docker' },
    { value: 'container.stopped', label: 'Container Parado', category: 'Docker' },
    { value: 'container.restarted', label: 'Container Reiniciado', category: 'Docker' },
    { value: 'container.removed', label: 'Container Removido', category: 'Docker' },
    { value: 'container.error', label: 'Erro no Container', category: 'Docker' },
    { value: 'container.health_check_failed', label: 'Health Check Falhou', category: 'Docker' },
    { value: 'container.health_check_passed', label: 'Health Check Passou', category: 'Docker' },
    { value: 'container.volume_mounted', label: 'Volume Montado', category: 'Docker' },
    { value: 'container.volume_unmounted', label: 'Volume Desmontado', category: 'Docker' },
    { value: 'container.network_connected', label: 'Rede Conectada', category: 'Docker' },
    { value: 'container.network_disconnected', label: 'Rede Desconectada', category: 'Docker' },
    { value: 'image.pulled', label: 'Imagem Baixada', category: 'Docker' },
    { value: 'image.built', label: 'Imagem Construída', category: 'Docker' },
    { value: 'image.removed', label: 'Imagem Removida', category: 'Docker' },
    { value: 'image.tagged', label: 'Imagem Taggeada', category: 'Docker' },
    { value: 'network.created', label: 'Rede Criada', category: 'Docker' },
    { value: 'network.removed', label: 'Rede Removida', category: 'Docker' },
    { value: 'volume.created', label: 'Volume Criado', category: 'Docker' },
    { value: 'volume.removed', label: 'Volume Removido', category: 'Docker' },
    // Nginx
    { value: 'nginx.host_created', label: 'Host Nginx Criado', category: 'Nginx' },
    { value: 'nginx.host_updated', label: 'Host Nginx Atualizado', category: 'Nginx' },
    { value: 'nginx.host_deleted', label: 'Host Nginx Removido', category: 'Nginx' },
    { value: 'nginx.config_reloaded', label: 'Configuração Recarregada', category: 'Nginx' },
    { value: 'nginx.ssl_certificate_created', label: 'Certificado SSL Criado', category: 'Nginx' },
    { value: 'nginx.ssl_certificate_renewed', label: 'Certificado SSL Renovado', category: 'Nginx' },
    { value: 'nginx.ssl_certificate_expired', label: 'Certificado SSL Expirado', category: 'Nginx' },
    { value: 'nginx.proxy_created', label: 'Proxy Criado', category: 'Nginx' },
    { value: 'nginx.proxy_updated', label: 'Proxy Atualizado', category: 'Nginx' },
    { value: 'nginx.proxy_deleted', label: 'Proxy Removido', category: 'Nginx' },
    { value: 'nginx.rate_limit_triggered', label: 'Rate Limit Ativado', category: 'Nginx' },
    { value: 'nginx.access_denied', label: 'Acesso Negado', category: 'Nginx' },
    { value: 'nginx.load_balancer_updated', label: 'Load Balancer Atualizado', category: 'Nginx' },
    // DNS
    { value: 'dns.record_created', label: 'Registro DNS Criado', category: 'DNS' },
    { value: 'dns.record_updated', label: 'Registro DNS Atualizado', category: 'DNS' },
    { value: 'dns.record_deleted', label: 'Registro DNS Removido', category: 'DNS' },
    { value: 'dns.zone_created', label: 'Zona DNS Criada', category: 'DNS' },
    { value: 'dns.zone_updated', label: 'Zona DNS Atualizada', category: 'DNS' },
    { value: 'dns.zone_deleted', label: 'Zona DNS Removida', category: 'DNS' },
    { value: 'dns.propagation_started', label: 'Propagação Iniciada', category: 'DNS' },
    { value: 'dns.propagation_completed', label: 'Propagação Completada', category: 'DNS' },
    { value: 'dns.mx_record_verified', label: 'Registro MX Verificado', category: 'DNS' },
    { value: 'dns.txt_record_verified', label: 'Registro TXT Verificado', category: 'DNS' },
    // Monitoramento
    { value: 'monitoring.alert_triggered', label: 'Alerta Disparado', category: 'Monitoramento' },
    { value: 'monitoring.alert_resolved', label: 'Alerta Resolvido', category: 'Monitoramento' },
    { value: 'monitoring.threshold_exceeded', label: 'Limite Excedido', category: 'Monitoramento' },
    { value: 'monitoring.service_down', label: 'Serviço Inativo', category: 'Monitoramento' },
    { value: 'monitoring.service_up', label: 'Serviço Ativo', category: 'Monitoramento' },
    { value: 'monitoring.check_failed', label: 'Verificação Falhou', category: 'Monitoramento' },
    { value: 'monitoring.check_passed', label: 'Verificação Passou', category: 'Monitoramento' },
    // Segurança
    { value: 'security.intrusion_detected', label: 'Intrusão Detectada', category: 'Segurança' },
    { value: 'security.suspicious_activity', label: 'Atividade Suspeita', category: 'Segurança' },
    { value: 'security.login_from_new_location', label: 'Login de Nova Localização', category: 'Segurança' },
    { value: 'security.brute_force_attempt', label: 'Tentativa de Força Bruta', category: 'Segurança' },
    { value: 'security.password_breach_detected', label: 'Violação de Senha Detectada', category: 'Segurança' },
    { value: 'security.vulnerability_found', label: 'Vulnerabilidade Encontrada', category: 'Segurança' },
    { value: 'security.scan_completed', label: 'Varredura Completada', category: 'Segurança' },
    // Usuários
    { value: 'user.created', label: 'Usuário Criado', category: 'Usuários' },
    { value: 'user.updated', label: 'Usuário Atualizado', category: 'Usuários' },
    { value: 'user.deleted', label: 'Usuário Removido', category: 'Usuários' },
    { value: 'user.login', label: 'Login de Usuário', category: 'Usuários' },
    { value: 'user.logout', label: 'Logout de Usuário', category: 'Usuários' },
    { value: 'user.password_changed', label: 'Senha Alterada', category: 'Usuários' },
    { value: 'user.password_reset', label: 'Senha Redefinida', category: 'Usuários' },
    { value: 'user.email_verified', label: 'Email Verificado', category: 'Usuários' },
    { value: 'user.profile_updated', label: 'Perfil Atualizado', category: 'Usuários' },
    { value: 'user.role_changed', label: 'Função Alterada', category: 'Usuários' },
    { value: 'user.permissions_updated', label: 'Permissões Atualizadas', category: 'Usuários' },
    { value: 'user.session_expired', label: 'Sessão Expirada', category: 'Usuários' },
    { value: 'user.locked', label: 'Usuário Bloqueado', category: 'Usuários' },
    { value: 'user.unlocked', label: 'Usuário Desbloqueado', category: 'Usuários' },
    { value: 'user.login_attempt_failed', label: 'Tentativa de Login Falhou', category: 'Usuários' },
    { value: 'user.two_factor_enabled', label: '2FA Habilitado', category: 'Usuários' },
    { value: 'user.two_factor_disabled', label: '2FA Desabilitado', category: 'Usuários' },
    // Autenticação
    { value: 'auth.login_success', label: 'Login Bem-sucedido', category: 'Autenticação' },
    { value: 'auth.login_failed', label: 'Login Falhado', category: 'Autenticação' },
    { value: 'auth.logout', label: 'Logout', category: 'Autenticação' },
    { value: 'auth.token_generated', label: 'Token Gerado', category: 'Autenticação' },
    { value: 'auth.token_expired', label: 'Token Expirado', category: 'Autenticação' },
    { value: 'auth.token_revoked', label: 'Token Revogado', category: 'Autenticação' },
    { value: 'auth.session_created', label: 'Sessão Criada', category: 'Autenticação' },
    { value: 'auth.session_destroyed', label: 'Sessão Destruída', category: 'Autenticação' },
    { value: 'auth.api_key_created', label: 'API Key Criada', category: 'Autenticação' },
    { value: 'auth.api_key_revoked', label: 'API Key Revogada', category: 'Autenticação' },
    { value: 'auth.oauth_connected', label: 'OAuth Conectado', category: 'Autenticação' },
    { value: 'auth.oauth_disconnected', label: 'OAuth Desconectado', category: 'Autenticação' },
    // Logs
    { value: 'log.error_logged', label: 'Erro Registrado', category: 'Logs' },
    { value: 'log.warning_logged', label: 'Aviso Registrado', category: 'Logs' },
    { value: 'log.info_logged', label: 'Info Registrada', category: 'Logs' },
    { value: 'log.debug_logged', label: 'Debug Registrado', category: 'Logs' },
    { value: 'log.file_rotated', label: 'Arquivo de Log Rotacionado', category: 'Logs' },
    { value: 'log.file_archived', label: 'Arquivo de Log Arquivado', category: 'Logs' },
    { value: 'log.threshold_reached', label: 'Limite de Log Atingido', category: 'Logs' },
    // API
    { value: 'api.request_received', label: 'Requisição Recebida', category: 'API' },
    { value: 'api.request_completed', label: 'Requisição Completada', category: 'API' },
    { value: 'api.request_failed', label: 'Requisição Falhou', category: 'API' },
    { value: 'api.rate_limit_exceeded', label: 'Rate Limit Excedido', category: 'API' },
    { value: 'api.authentication_failed', label: 'Autenticação Falhou', category: 'API' },
    { value: 'api.authorization_denied', label: 'Autorização Negada', category: 'API' },
    { value: 'api.key_created', label: 'Chave API Criada', category: 'API' },
    { value: 'api.key_revoked', label: 'Chave API Revogada', category: 'API' },
    { value: 'api.key_expired', label: 'Chave API Expirada', category: 'API' },
    { value: 'api.endpoint_deprecated', label: 'Endpoint Depreciado', category: 'API' },
    { value: 'api.version_updated', label: 'Versão Atualizada', category: 'API' },
    // Webhook
    { value: 'webhook.sent', label: 'Webhook Enviado', category: 'Webhook' },
    { value: 'webhook.delivered', label: 'Webhook Entregue', category: 'Webhook' },
    { value: 'webhook.failed', label: 'Webhook Falhou', category: 'Webhook' },
    { value: 'webhook.retry_attempted', label: 'Tentativa de Reenvio', category: 'Webhook' },
    { value: 'webhook.retry_exhausted', label: 'Tentativas Esgotadas', category: 'Webhook' },
    { value: 'webhook.config_updated', label: 'Configuração Atualizada', category: 'Webhook' },
    { value: 'webhook.endpoint_validated', label: 'Endpoint Validado', category: 'Webhook' },
    { value: 'webhook.signature_verified', label: 'Assinatura Verificada', category: 'Webhook' },
    { value: 'system.shutdown', label: 'Sistema Desligado', category: 'Sistema' },
    { value: 'system.restart', label: 'Sistema Reiniciado', category: 'Sistema' },
    { value: 'system.status_check', label: 'Verificação de Status', category: 'Sistema' },
    { value: 'system.health_check', label: 'Verificação de Saúde', category: 'Sistema' },
    { value: 'system.config_updated', label: 'Configuração Atualizada', category: 'Sistema' },
    { value: 'system.maintenance_start', label: 'Início da Manutenção', category: 'Sistema' },
    { value: 'system.maintenance_end', label: 'Fim da Manutenção', category: 'Sistema' },
    { value: 'system.error', label: 'Erro do Sistema', category: 'Sistema' },
    { value: 'system.warning', label: 'Aviso do Sistema', category: 'Sistema' },
    { value: 'system.performance_alert', label: 'Alerta de Performance', category: 'Sistema' },
    { value: 'system.disk_space_low', label: 'Espaço em Disco Baixo', category: 'Sistema' },
    { value: 'system.memory_usage_high', label: 'Uso de Memória Alto', category: 'Sistema' },
    { value: 'system.cpu_usage_high', label: 'Uso de CPU Alto', category: 'Sistema' },
    { value: 'backup.started', label: 'Backup Iniciado', category: 'Sistema' },
    { value: 'backup.completed', label: 'Backup Concluído', category: 'Sistema' },
    { value: 'backup.failed', label: 'Backup Falhou', category: 'Sistema' },
    { value: 'backup.restored', label: 'Backup Restaurado', category: 'Sistema' },
    { value: 'system.preferences_updated', label: 'Preferências do Sistema Atualizadas', category: 'Sistema' },
    { value: 'system.database_connected', label: 'Banco de Dados Conectado', category: 'Sistema' },
    { value: 'system.database_disconnected', label: 'Banco de Dados Desconectado', category: 'Sistema' },
    { value: 'system.cache_cleared', label: 'Cache Limpo', category: 'Sistema' },
    { value: 'system.logs_rotated', label: 'Logs Rotacionados', category: 'Sistema' },
    { value: 'system.security_scan', label: 'Varredura de Segurança', category: 'Sistema' },
    { value: 'system.update_available', label: 'Atualização Disponível', category: 'Sistema' },
    { value: 'system.update_installed', label: 'Atualização Instalada', category: 'Sistema' },
];

const IntegracoesWebhooks: React.FC = () => {
    const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(defaultWebhookConfig);
    const [customHeaders, setCustomHeaders] = useState<{ key: string; value: string; id: number }[]>([
        { key: 'Content-Type', value: 'application/json', id: Date.now() }
    ]);
    const [selectedTestEvent, setSelectedTestEvent] = useState<string>('client.created');
    const [testResult, setTestResult] = useState<any>(null);
    const [testResponse, setTestResponse] = useState<any>(null);
    const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [showSecretKey, setShowSecretKey] = useState<boolean>(false);

    // Handlers
    const handleEventToggle = (eventName: string) => {
        setWebhookConfig(prev => ({
            ...prev,
            events: prev.events.includes(eventName)
                ? prev.events.filter((e: string) => e !== eventName)
                : [...prev.events, eventName]
        }));
    };

    const addCustomHeader = () => {
        setCustomHeaders(prev => [...prev, { key: '', value: '', id: Date.now() }]);
    };
    const updateCustomHeader = (id: any, field: 'key' | 'value', newValue: string) => {
        setCustomHeaders(prev => prev.map(header => header.id === id ? { ...header, [field]: newValue } : header));
    };
    const removeCustomHeader = (id: any) => {
        setCustomHeaders(prev => prev.filter(header => header.id !== id));
    };

    const generateSecretKey = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 64; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setWebhookConfig(prev => ({ ...prev, secretKey: result }));
    };

    // Simulate HMAC signature
    const generateHMACSignature = async (payload: string, secret: string) => {
        return `sha256=${btoa(payload + secret).slice(0, 32)}`;
    };

    // Simulate test payload
    const generateTestPayload = (eventType: string) => {
        return {
            event: eventType,
            timestamp: new Date().toISOString(),
            webhook_id: Date.now(),
            user: { id: 1, username: "admin", name: "Administrador" },
            data: { test: true }
        };
    };

    // Simulate webhook test
    const testWebhook = async () => {
        setIsTestingWebhook(true);
        const testPayload = generateTestPayload(selectedTestEvent);
        let headers: Record<string, string> = {};
        customHeaders.forEach(header => {
            if (header.key && header.value) headers[header.key] = header.value;
        });
        if (webhookConfig.secretKey) {
            headers['X-Hub-Signature'] = await generateHMACSignature(JSON.stringify(testPayload), webhookConfig.secretKey);
        }
        setTimeout(() => {
            setTestResult({ success: true, status: 200, statusText: 'OK', timestamp: new Date().toISOString() });
            setTestResponse({ status: 200, statusText: 'OK', headers, body: testPayload, timestamp: new Date().toISOString(), requestPayload: testPayload });
            setIsTestingWebhook(false);
        }, 1200);
    };

    // Simulate save config
    const saveWebhookConfig = async () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
        }, 1000);
    };

    return (
        <div className="p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Configurações Avançadas do Sistema
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400">
                        Configure webhooks e automações para integração com sistemas externos
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Webhook URL Configuration */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Code className="w-5 h-5 text-blue-500" />
                            URL de Webhook
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL do Endpoint</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={webhookConfig.url}
                                        onChange={e => setWebhookConfig(prev => ({ ...prev, url: e.target.value }))}
                                        placeholder="https://sua-api.com/webhooks/projecthub"
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground"
                                    />
                                    <Button onClick={testWebhook} className="flex items-center gap-2">
                                        <Play className="w-4 h-4" />
                                        Testar
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Método HTTP</label>
                                    <select
                                        value={webhookConfig.method}
                                        onChange={e => setWebhookConfig(prev => ({ ...prev, method: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground"
                                    >
                                        <option value="POST">POST</option>
                                        <option value="PUT">PUT</option>
                                        <option value="PATCH">PATCH</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formato de Dados</label>
                                    <select
                                        value={webhookConfig.format}
                                        onChange={e => setWebhookConfig(prev => ({ ...prev, format: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground"
                                    >
                                        <option value="json">JSON</option>
                                        <option value="form">Form Data</option>
                                        <option value="xml">XML</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Headers Personalizados</label>
                                    <Button type="button" onClick={addCustomHeader} variant="outline" size="sm" className="h-8">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                        Adicionar
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {customHeaders.map(header => (
                                        <div key={header.id} className="flex gap-2 items-center p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                                            <input
                                                type="text"
                                                placeholder="Chave (ex: Authorization)"
                                                value={header.key}
                                                onChange={e => updateCustomHeader(header.id, 'key', e.target.value)}
                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-foreground"
                                                disabled={header.key === 'X-Hub-Signature'}
                                            />
                                            <span className="text-gray-500">:</span>
                                            <input
                                                type="text"
                                                placeholder="Valor (ex: Bearer token123)"
                                                value={header.value}
                                                onChange={e => updateCustomHeader(header.id, 'value', e.target.value)}
                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-foreground"
                                                disabled={header.key === 'X-Hub-Signature'}
                                            />
                                            {header.key !== 'Content-Type' && header.key !== 'X-Hub-Signature' && (
                                                <button type="button" onClick={() => removeCustomHeader(header.id)} className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {customHeaders.length === 0 && (
                                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">Nenhum header personalizado. Clique em "Adicionar" para criar um.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Available Events */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Bell className="w-5 h-5 text-orange-500" />Eventos Disponíveis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Clients Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1"><Users className="w-4 h-4" />Clientes</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Clientes').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Products Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1"><Package className="w-4 h-4" />Produtos</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Produtos').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Sales Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1"><ShoppingCart className="w-4 h-4" />Vendas</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Vendas').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Support Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1"><Headphones className="w-4 h-4" />Suporte</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Suporte').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* System Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1"><Settings className="w-4 h-4" />Sistema</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Sistema').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Docker Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-1"><Container className="w-4 h-4" />Docker</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Docker').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Nginx Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1"><Globe className="w-4 h-4" />Nginx</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Nginx').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* DNS Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1"><Globe className="w-4 h-4" />DNS</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'DNS').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Users Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1"><Users className="w-4 h-4" />Usuários</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Usuários').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Authentication Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-red-600 dark:text-red-400 flex items-center gap-1"><Shield className="w-4 h-4" />Autenticação</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Autenticação').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Security Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-red-600 dark:text-red-400 flex items-center gap-1"><Shield className="w-4 h-4" />Segurança</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Segurança').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Monitoring Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-1"><AlertTriangle className="w-4 h-4" />Monitoramento</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Monitoramento').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* API Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><Code className="w-4 h-4" />API</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'API').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Webhook Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-pink-600 dark:text-pink-400 flex items-center gap-1"><Webhook className="w-4 h-4" />Webhook</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Webhook').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {/* Logs Events */}
                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1"><FileText className="w-4 h-4" />Logs</h4>
                                <div className="space-y-1 text-sm">
                                    {eventExamples.filter(e => e.category === 'Logs').map(e => (
                                        <label key={e.value} className="flex items-center gap-2">
                                            <input type="checkbox" checked={webhookConfig.events.includes(e.value)} onChange={() => handleEventToggle(e.value)} className="rounded" />
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.value}</code>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payload Examples */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-green-500" />Exemplos de Payload</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium mb-2">Evento: client.created</h4>
                                <CodeEditor
                                    value={JSON.stringify({ event: "client.created", timestamp: "2025-06-16T18:00:00Z", data: { id: 15, name: "João Silva", email: "joao@email.com", phone: "(11) 99999-9999", created_at: "2025-06-16T18:00:00Z" }, user: { id: 1, username: "admin" } }, null, 2)}
                                    onChange={() => { }}
                                    language="json"
                                />
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">Evento: sale.completed</h4>
                                <CodeEditor
                                    value={JSON.stringify({ event: "sale.completed", timestamp: "2025-06-16T18:00:00Z", data: { id: 25, sale_number: "VDA-010", client_id: 15, total_amount: 2599.99, payment_method: "credit_card", status: "completed", items: [{ product_id: 8, product_name: "MacBook Air M2", quantity: 1, unit_price: 2599.99 }] }, user: { id: 1, username: "admin" } }, null, 2)}
                                    onChange={() => { }}
                                    language="json"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security & Testing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-red-500" />Segurança</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secret Key (HMAC)</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type={showSecretKey ? "text" : "password"}
                                                value={webhookConfig.secretKey}
                                                onChange={e => setWebhookConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                                                placeholder="sua-chave-secreta-hmac"
                                                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground"
                                            />
                                            <button type="button" onClick={() => setShowSecretKey(!showSecretKey)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                                {showSecretKey ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                )}
                                            </button>
                                        </div>
                                        <Button type="button" onClick={generateSecretKey} variant="outline" className="px-3" title="Gerar nova chave">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.586l4.707-4.707C10.923 2.663 11.596 2 12.414 2h.172a2 2 0 011.414.586L17.414 6A2 2 0 0118 7.414V9a4.002 4.002 0 01-3 3.874V15a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2.126A4.002 4.002 0 016 9V7.414A2 2 0 016.586 6L10 2.586A2 2 0 0111.414 2h.172c.818 0 1.591.337 2.14.879z" /></svg>
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>• Todos os webhooks incluem header <code>X-Hub-Signature-256</code></p>
                                    <p>• Use HMAC SHA256 para verificar autenticidade</p>
                                    <p>• Timeout padrão: 10 segundos</p>
                                    <p>• Retry automático: 3 tentativas</p>
                                </div>
                            </div>
                        </div>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Play className="w-5 h-5 text-blue-500" />Teste de Webhook</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecione o Tipo de Evento</label>
                                    <select
                                        value={selectedTestEvent}
                                        onChange={e => setSelectedTestEvent(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground"
                                    >
                                        {eventExamples.map(event => (
                                            <option key={event.value} value={event.value}>{event.category} - {event.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <Button onClick={testWebhook} disabled={isTestingWebhook} className="w-full" variant="outline">
                                    {isTestingWebhook ? (<><div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>Enviando...</>) : (<><Play className="w-4 h-4 mr-2" />Enviar Evento de Teste</>)}
                                </Button>
                                {testResponse && (
                                    <div className="mt-4">
                                        <h4 className="font-medium mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-green-500" />Response</h4>
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                                            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                    </div>
                                                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">response.json</span>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{testResponse.status} {testResponse.statusText}</div>
                                            </div>
                                            <div className="p-4 font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-x-auto max-h-96 overflow-y-auto">
                                                <pre className="whitespace-pre-wrap">{JSON.stringify({ status: testResponse.status, statusText: testResponse.statusText, headers: testResponse.headers, body: testResponse.body, timestamp: testResponse.timestamp, requestPayload: testResponse.requestPayload }, null, 2)}</pre>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="text-sm">
                                    <p className="font-medium mb-1">Último teste:</p>
                                    {testResult ? (
                                        <p className={`${testResult.success ? 'text-green-600' : 'text-red-600'}`}>{testResult.success ? '✅' : '❌'} {testResult.status} {testResult.statusText} - {new Date(testResult.timestamp).toLocaleString('pt-BR')}</p>
                                    ) : (
                                        <p className="text-gray-600 dark:text-gray-400">Nenhum teste realizado</p>
                                    )}
                                </div>
                                <div className="text-sm">
                                    <p className="font-medium mb-1">Estatísticas (24h):</p>
                                    <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
                                        <p>Enviados: 47</p>
                                        <p>Sucesso: 45</p>
                                        <p>Falhas: 2</p>
                                        <p>Taxa: 95.7%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Configuration */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setWebhookConfig(defaultWebhookConfig)}>
                            Cancelar
                        </Button>
                        <Button onClick={saveWebhookConfig} disabled={isSaving}>
                            {isSaving ? (<><div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>Salvando...</>) : ('Salvar Configuração')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default IntegracoesWebhooks;
