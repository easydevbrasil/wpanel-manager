import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Code, 
    Terminal, 
    Webhook, 
    Globe, 
    Settings, 
    BookOpen, 
    ExternalLink,
    Zap,
    Shield,
    Database,
    Users,
    Package,
    ShoppingCart,
    Container,
    Server,
    CheckCircle,
    AlertCircle,
    Clock,
    ArrowRight,
    Copy,
    Play
} from 'lucide-react';

interface IntegrationCard {
    title: string;
    description: string;
    icon: any;
    color: string;
    status: 'active' | 'inactive' | 'pending';
    path: string;
    features: string[];
}

interface QuickStartGuide {
    title: string;
    description: string;
    steps: string[];
    estimatedTime: string;
    difficulty: 'Fácil' | 'Médio' | 'Avançado';
}

const integrationCards: IntegrationCard[] = [
    {
        title: 'API REST',
        description: 'Integração completa via API REST com autenticação JWT e documentação interativa',
        icon: Terminal,
        color: 'blue',
        status: 'active',
        path: '/integracoes-api',
        features: ['Endpoints CRUD', 'Autenticação JWT', 'Rate Limiting', 'Documentação Swagger']
    },
    {
        title: 'Webhooks',
        description: 'Notificações em tempo real para eventos do sistema com configuração avançada',
        icon: Webhook,
        color: 'green',
        status: 'active',
        path: '/integracoes-webhook',
        features: ['Eventos em tempo real', 'HMAC Security', 'Retry automático', 'Teste integrado']
    },
    {
        title: 'GraphQL',
        description: 'API GraphQL para consultas flexíveis e eficientes com schema dinâmico',
        icon: Database,
        color: 'purple',
        status: 'pending',
        path: '#',
        features: ['Queries flexíveis', 'Schema dinâmico', 'Subscriptions', 'Playground']
    },
    {
        title: 'WebSockets',
        description: 'Comunicação bidirecional em tempo real para aplicações interativas',
        icon: Zap,
        color: 'yellow',
        status: 'pending',
        path: '#',
        features: ['Tempo real', 'Baixa latência', 'Eventos push', 'Multiplexing']
    }
];

const quickStartGuides: QuickStartGuide[] = [
    {
        title: 'Primeira Integração API',
        description: 'Configure sua primeira integração usando a API REST em poucos minutos',
        estimatedTime: '5 min',
        difficulty: 'Fácil',
        steps: [
            'Gere sua API Key nas configurações',
            'Teste o endpoint /api/system/status',
            'Implemente autenticação JWT',
            'Faça sua primeira requisição autenticada'
        ]
    },
    {
        title: 'Configurar Webhooks',
        description: 'Receba notificações automáticas de eventos do sistema',
        estimatedTime: '10 min',
        difficulty: 'Médio',
        steps: [
            'Configure a URL do seu endpoint',
            'Selecione os eventos desejados',
            'Configure a secret key HMAC',
            'Teste o webhook com evento simulado'
        ]
    },
    {
        title: 'Integração Completa',
        description: 'Integração avançada com API + Webhooks + Autenticação',
        estimatedTime: '30 min',
        difficulty: 'Avançado',
        steps: [
            'Configure autenticação OAuth2',
            'Implemente sincronização bidirecional',
            'Configure webhooks para todos os eventos',
            'Implemente retry e error handling'
        ]
    }
];

const systemStats = {
    apiCalls: { total: 45782, today: 1234, rate: 98.5 },
    webhooks: { total: 3420, today: 89, rate: 95.7 },
    integrations: { active: 7, pending: 2, failed: 0 },
    uptime: '99.9%'
};

const IntegracoesVisaoGeral: React.FC = () => {
    const [selectedGuide, setSelectedGuide] = useState<QuickStartGuide | null>(null);
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
            case 'inactive': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
            case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
        }
    };
    
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle className="w-4 h-4" />;
            case 'inactive': return <AlertCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };
    
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Fácil': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
            case 'Médio': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
            case 'Avançado': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrações</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Central de integrações, APIs e automações do sistema
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Documentação
                    </Button>
                    <Button className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        API Explorer
                    </Button>
                </div>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Chamadas API</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats.apiCalls.total.toLocaleString()}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    +{systemStats.apiCalls.today} hoje
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Terminal className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-green-600 dark:text-green-400">↗ {systemStats.apiCalls.rate}%</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">taxa de sucesso</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Webhooks</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats.webhooks.total.toLocaleString()}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    +{systemStats.webhooks.today} hoje
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                <Webhook className="w-6 h-6 text-green-600 dark:text-green-300" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-green-600 dark:text-green-400">↗ {systemStats.webhooks.rate}%</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">entrega</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Integrações</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats.integrations.active}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {systemStats.integrations.pending} pendentes
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <Settings className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{systemStats.integrations.failed} falhas</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats.uptime}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    últimos 30 dias
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                <Shield className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">operacional</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Integration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrationCards.map((integration, index) => {
                    const IconComponent = integration.icon;
                    return (
                        <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 bg-${integration.color}-100 dark:bg-${integration.color}-900 rounded-lg`}>
                                            <IconComponent className={`w-6 h-6 text-${integration.color}-600 dark:text-${integration.color}-300`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{integration.title}</CardTitle>
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                                                {getStatusIcon(integration.status)}
                                                {integration.status === 'active' ? 'Ativo' : integration.status === 'pending' ? 'Em breve' : 'Inativo'}
                                            </div>
                                        </div>
                                    </div>
                                    {integration.status === 'active' && (
                                        <Button variant="outline" size="sm" onClick={() => window.location.href = integration.path}>
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">{integration.description}</p>
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Recursos principais:</h4>
                                    <div className="grid grid-cols-2 gap-1">
                                        {integration.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Start Guides */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Guias de Início Rápido
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400">
                        Primeiros passos para integrar com o sistema
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quickStartGuides.map((guide, index) => (
                            <div
                                key={index}
                                className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                    selectedGuide === guide ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''
                                }`}
                                onClick={() => setSelectedGuide(selectedGuide === guide ? null : guide)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">{guide.title}</h3>
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(guide.difficulty)}`}>
                                        {guide.difficulty}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{guide.description}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {guide.estimatedTime}
                                    </span>
                                    <span>{guide.steps.length} passos</span>
                                </div>
                                
                                {selectedGuide === guide && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <h4 className="font-medium mb-2">Passos:</h4>
                                        <ol className="space-y-1 text-sm">
                                            {guide.steps.map((step, stepIndex) => (
                                                <li key={stepIndex} className="flex items-start gap-2">
                                                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-xs flex items-center justify-center font-medium">
                                                        {stepIndex + 1}
                                                    </span>
                                                    <span className="text-gray-600 dark:text-gray-400">{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                        <Button className="w-full mt-3" size="sm">
                                            Começar Guia
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Popular Endpoints */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal className="w-5 h-5" />
                            Endpoints Mais Usados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { method: 'GET', path: '/api/clients', usage: '34%' },
                                { method: 'POST', path: '/api/sales', usage: '28%' },
                                { method: 'GET', path: '/api/products', usage: '19%' },
                                { method: 'PUT', path: '/api/clients/:id', usage: '12%' },
                                { method: 'GET', path: '/api/system/status', usage: '7%' }
                            ].map((endpoint, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-mono font-semibold ${
                                            endpoint.method === 'GET' ? 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300' :
                                            endpoint.method === 'POST' ? 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300' :
                                            'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300'
                                        }`}>
                                            {endpoint.method}
                                        </span>
                                        <code className="text-sm">{endpoint.path}</code>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{endpoint.usage}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Webhook className="w-5 h-5" />
                            Eventos de Webhook Ativos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { event: 'client.created', count: 156, category: 'Clientes' },
                                { event: 'sale.completed', count: 89, category: 'Vendas' },
                                { event: 'product.updated', count: 67, category: 'Produtos' },
                                { event: 'container.started', count: 23, category: 'Docker' },
                                { event: 'user.login', count: 445, category: 'Usuários' }
                            ].map((webhook, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                    <div>
                                        <code className="text-sm font-mono">{webhook.event}</code>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{webhook.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">{webhook.count}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">eventos/dia</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default IntegracoesVisaoGeral;