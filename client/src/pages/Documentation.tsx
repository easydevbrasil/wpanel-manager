import React, { useState } from "react";

const tabs = [
    { label: "Resumo", key: "resumo" },
    { label: "API", key: "api" },
    { label: "Webhook", key: "webhook" },
];

export default function Documentation() {
    const [activeTab, setActiveTab] = React.useState("resumo");
    const [selectedEndpoint, setSelectedEndpoint] = React.useState("");
    const [testRequest, setTestRequest] = React.useState("");
    const [testResponse, setTestResponse] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState("Todos");
    const [selectedEndpointObj, setSelectedEndpointObj] = React.useState<any>(null);

    const endpoints = [
        // Autenticação
        {
            method: "POST",
            path: "/api/auth/login",
            description: "Autenticação do usuário",
            category: "Auth",
            example: `{
  "username": "admin",
  "password": "password"
}`,
            response: `{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin"
  }
}`
        },
        {
            method: "POST",
            path: "/api/auth/logout",
            description: "Logout do usuário",
            category: "Auth",
            example: "Authorization: Bearer <token>",
            response: `{
  "message": "Logout realizado com sucesso"
}`
        },
        {
            method: "GET",
            path: "/api/auth/verify",
            description: "Verificar token de autenticação",
            category: "Auth",
            example: "Authorization: Bearer <token>",
            response: `{
  "valid": true,
  "user": {
    "id": 1,
    "username": "admin"
  }
}`
        },

        // Usuário
        {
            method: "GET",
            path: "/api/user",
            description: "Obter dados do usuário logado",
            category: "User",
            example: "Authorization: Bearer <token>",
            response: `{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com"
}`
        },
        {
            method: "GET",
            path: "/api/user/preferences",
            description: "Buscar preferências do usuário",
            category: "User",
            example: "Authorization: Bearer <token>",
            response: `{
  "sidebarCollapsed": true,
  "theme": "dark"
}`
        },
        {
            method: "PUT",
            path: "/api/user/preferences",
            description: "Atualizar preferências do usuário",
            category: "User",
            example: `{
  "sidebarCollapsed": false,
  "theme": "light"
}`,
            response: `{
  "success": true,
  "preferences": {
    "sidebarCollapsed": false,
    "theme": "light"
  }
}`
        },

        // Docker
        {
            method: "GET",
            path: "/api/docker/containers",
            description: "Listar containers Docker",
            category: "Docker",
            example: "Authorization: Bearer <token>",
            response: `[
  {
    "id": "abc123",
    "name": "nginx",
    "status": "running",
    "image": "nginx:latest"
  }
]`
        },
        {
            method: "POST",
            path: "/api/docker/containers",
            description: "Criar novo container",
            category: "Docker",
            example: `{
  "image": "nginx:latest",
  "name": "my-nginx",
  "ports": {"80/tcp": [{"HostPort": "8080"}]}
}`,
            response: `{
  "id": "def456",
  "message": "Container criado com sucesso"
}`
        },
        {
            method: "POST",
            path: "/api/docker/containers/:id/start",
            description: "Iniciar container",
            category: "Docker",
            example: "Authorization: Bearer <token>",
            response: `{
  "success": true,
  "message": "Container iniciado"
}`
        },
        {
            method: "POST",
            path: "/api/docker/containers/:id/stop",
            description: "Parar container",
            category: "Docker",
            example: "Authorization: Bearer <token>",
            response: `{
  "success": true,
  "message": "Container parado"
}`
        },

        // Firewall
        {
            method: "GET",
            path: "/api/firewall/rules",
            description: "Listar regras do firewall",
            category: "Firewall",
            example: "Authorization: Bearer <token>",
            response: `[
  {
    "id": 1,
    "port": 80,
    "protocol": "tcp",
    "action": "ACCEPT"
  }
]`
        },
        {
            method: "POST",
            path: "/api/firewall/rules",
            description: "Criar regra de firewall",
            category: "Firewall",
            example: `{
  "port": 443,
  "protocol": "tcp",
  "action": "ACCEPT",
  "source": "0.0.0.0/0"
}`,
            response: `{
  "id": 2,
  "success": true,
  "message": "Regra criada com sucesso"
}`
        },
        {
            method: "DELETE",
            path: "/api/firewall/rules/:id",
            description: "Remover regra de firewall",
            category: "Firewall",
            example: "Authorization: Bearer <token>",
            response: `{
  "success": true,
  "message": "Regra removida"
}`
        },

        // Sistema
        {
            method: "GET",
            path: "/api/system/stats",
            description: "Estatísticas do sistema",
            category: "System",
            example: "Authorization: Bearer <token>",
            response: `{
  "cpu": 45.2,
  "memory": 67.8,
  "disk": 34.5,
  "uptime": 3600
}`
        },
        {
            method: "GET",
            path: "/api/dashboard/stats",
            description: "Estatísticas do dashboard",
            category: "System",
            example: "Authorization: Bearer <token>",
            response: `{
  "totalClients": 150,
  "totalExpenses": 25000,
  "totalSales": 45000
}`
        },

        // Email
        {
            method: "GET",
            path: "/api/emails",
            description: "Listar contas de email",
            category: "Email",
            example: "Authorization: Bearer <token>",
            response: `[
  {
    "id": 1,
    "email": "user@domain.com",
    "quota": 1000,
    "used": 250
  }
]`
        },
        {
            method: "POST",
            path: "/api/emails",
            description: "Criar conta de email",
            category: "Email",
            example: `{
  "email": "newuser@domain.com",
  "password": "securepass",
  "quota": 1000
}`,
            response: `{
  "id": 2,
  "success": true,
  "message": "Conta criada"
}`
        },

        // Clientes
        {
            method: "GET",
            path: "/api/clients",
            description: "Listar clientes",
            category: "Business",
            example: "Authorization: Bearer <token>",
            response: `[
  {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "(11) 99999-9999"
  }
]`
        },
        {
            method: "POST",
            path: "/api/clients",
            description: "Criar novo cliente",
            category: "Business",
            example: `{
  "name": "Maria Santos",
  "email": "maria@example.com",
  "phone": "(11) 88888-8888"
}`,
            response: `{
  "id": 2,
  "success": true
}`
        },

        // Despesas
        {
            method: "GET",
            path: "/api/expenses",
            description: "Listar despesas",
            category: "Business",
            example: "Authorization: Bearer <token>",
            response: `[
  {
    "id": 1,
    "description": "Hospedagem servidor",
    "amount": 150.00,
    "date": "2025-01-15"
  }
]`
        },
        {
            method: "POST",
            path: "/api/expenses",
            description: "Criar nova despesa",
            category: "Business",
            example: `{
  "description": "Domínio anual",
  "amount": 50.00,
  "category": "infraestrutura"
}`,
            response: `{
  "id": 2,
  "success": true
}`
        },

        // Fornecedores
        {
            method: "GET",
            path: "/api/providers",
            description: "Listar fornecedores",
            category: "Business",
            example: "Authorization: Bearer <token>",
            response: `[
  {
    "id": 1,
    "name": "AWS",
    "contact": "suporte@aws.com"
  }
]`
        }
    ];

    // Filtro de endpoints por categoria
    const filteredEndpoints = selectedCategory === "Todos"
        ? endpoints
        : endpoints.filter(endpoint => endpoint.category === selectedCategory);

    const handleTestEndpoint = () => {
        if (selectedEndpoint) {
            setTestResponse(`{
  "success": true,
  "data": "Resposta simulada para ${selectedEndpoint}",
  "timestamp": "${new Date().toISOString()}"
}`);
        }
    };

    return (
        <div className="documentation-page p-6 bg-background text-foreground">
            <h1 className="text-3xl font-bold mb-6 text-foreground">📚 Documentação WPanel</h1>

            <div className="flex gap-2 mb-6 border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`px-4 py-2 border-b-2 transition-all ${activeTab === tab.key
                            ? "border-primary font-semibold text-primary"
                            : "border-transparent hover:border-muted-foreground text-muted-foreground hover:text-foreground"
                            }`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-96">
                {activeTab === "resumo" && (
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                            <h2 className="text-2xl font-bold mb-4 text-foreground">🏗️ WPanel - Sistema de Gerenciamento</h2>
                            <p className="text-muted-foreground mb-4">
                                Plataforma completa para administração de servidores Linux com interface moderna e intuitiva.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-primary/10 border border-primary/20 p-4 rounded">
                                    <h3 className="font-semibold text-primary">Frontend</h3>
                                    <p className="text-sm text-muted-foreground">React + TypeScript</p>
                                </div>
                                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded">
                                    <h3 className="font-semibold text-green-700 dark:text-green-400">Backend</h3>
                                    <p className="text-sm text-muted-foreground">Node.js + Express</p>
                                </div>
                                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded">
                                    <h3 className="font-semibold text-purple-700 dark:text-purple-400">Database</h3>
                                    <p className="text-sm text-muted-foreground">PostgreSQL</p>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mb-3 text-foreground">⚡ Principais Funcionalidades</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="border border-border p-3 rounded bg-card">
                                    <h4 className="font-medium text-foreground">🐳 Docker</h4>
                                    <p className="text-sm text-muted-foreground">Gerenciamento completo de containers</p>
                                </div>
                                <div className="border border-border p-3 rounded bg-card">
                                    <h4 className="font-medium text-foreground">🛡️ Firewall</h4>
                                    <p className="text-sm text-muted-foreground">Configuração de regras de segurança</p>
                                </div>
                                <div className="border border-border p-3 rounded bg-card">
                                    <h4 className="font-medium text-foreground">📧 Email</h4>
                                    <p className="text-sm text-muted-foreground">Contas e configurações de email</p>
                                </div>
                                <div className="border border-border p-3 rounded bg-card">
                                    <h4 className="font-medium">🌐 DNS</h4>
                                    <p className="text-sm text-gray-600">Gerenciamento de DNS e hosts</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold mb-3 text-foreground">🚀 Guia Rápido</h3>
                            <ol className="list-decimal list-inside space-y-2 text-foreground">
                                <li><strong>Login:</strong> Acesse com suas credenciais</li>
                                <li><strong>Dashboard:</strong> Visualize métricas do sistema</li>
                                <li><strong>Sidebar:</strong> Navegue pelos módulos (colapsável)</li>
                                <li><strong>API:</strong> Integre com sistemas externos</li>
                                <li><strong>Webhooks:</strong> Configure automações</li>
                            </ol>
                        </div>
                    </div>
                )}

                {activeTab === "api" && (
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 text-foreground">🔌 API WPanel</h2>
                            <p className="text-muted-foreground mb-6">
                                API REST completa para integração com sistemas externos. Todas as rotas do sistema documentadas.
                            </p>

                            {/* Filtros por categoria */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {['Todos', 'Auth', 'User', 'Docker', 'Firewall', 'System', 'Email', 'Business'].map((category) => (
                                    <button
                                        key={category}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${selectedCategory === category
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                            }`}
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>

                            {/* Testador de API Interativo */}
                            <div className="bg-slate-50 dark:bg-slate-800 border border-border rounded-lg p-4 mb-6">
                                <h3 className="text-lg font-semibold mb-3 text-foreground">🧪 Testador Interativo</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <select
                                            className="w-full p-2 border border-border rounded bg-background text-foreground"
                                            onChange={(e) => {
                                                setSelectedEndpoint(e.target.value);
                                                setSelectedEndpointObj(endpoints.find(ep => ep.path === e.target.value) || null);
                                            }}
                                        >
                                            <option value="">Selecione uma rota para testar</option>
                                            {filteredEndpoints.map((endpoint, index) => (
                                                <option key={index} value={endpoint.path}>
                                                    {endpoint.method} {endpoint.path}
                                                </option>
                                            ))}
                                        </select>

                                        {selectedEndpointObj && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium mb-1 text-foreground">Token (se necessário)</label>
                                                    <input
                                                        type="text"
                                                        className="w-full p-2 border border-border rounded bg-background text-foreground"
                                                        placeholder="Bearer token..."
                                                    />
                                                </div>

                                                {selectedEndpointObj.method !== 'GET' && (
                                                    <div>
                                                        <label className="block text-sm font-medium mb-1 text-foreground">Body (JSON)</label>
                                                        <textarea
                                                            className="w-full p-2 border border-border rounded bg-background text-foreground h-24"
                                                            placeholder="{ ... }"
                                                            value={testRequest}
                                                            onChange={(e) => setTestRequest(e.target.value)}
                                                        />
                                                    </div>
                                                )}

                                                <button
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors"
                                                    onClick={handleTestEndpoint}
                                                >
                                                    🚀 Testar Endpoint
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="bg-slate-900 text-green-400 p-4 rounded font-mono text-sm">
                                        <div className="mb-2 text-slate-400">// Resposta aparecerá aqui</div>
                                        {testResponse ? (
                                            <pre className="whitespace-pre-wrap">
                                                {testResponse}
                                            </pre>
                                        ) : selectedEndpointObj ? (
                                            <pre className="whitespace-pre-wrap">
                                                {selectedEndpointObj.response}
                                            </pre>
                                        ) : (
                                            <div className="text-slate-600">Selecione um endpoint para ver a resposta de exemplo</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Lista de endpoints */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-foreground">📋 Endpoints por Categoria</h3>
                                <div className="divide-y divide-border">
                                    {filteredEndpoints.map((endpoint, index) => (
                                        <div key={index} className="py-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${endpoint.method === "GET"
                                                        ? "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                                        : endpoint.method === "POST"
                                                            ? "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                                                            : endpoint.method === "PUT"
                                                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                                                                : "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                                    }`}>
                                                    {endpoint.method}
                                                </span>
                                                <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                                                <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                                                    {endpoint.category}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground text-sm mb-3">{endpoint.description}</p>

                                            <details className="cursor-pointer">
                                                <summary className="text-sm font-medium text-primary hover:text-primary/80 mb-2">
                                                    📋 Ver exemplo completo
                                                </summary>

                                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
                                                    <div>
                                                        <h5 className="font-medium text-foreground mb-2">Request:</h5>
                                                        <pre className="bg-slate-900 text-green-400 p-3 rounded text-xs overflow-auto">
                                                            {`curl -X ${endpoint.method} "http://localhost:3000${endpoint.path}" \\
  -H "Content-Type: application/json" \\
  ${endpoint.example.includes('Authorization') ? endpoint.example :
                                                                    endpoint.method !== 'GET' ? `-d '${endpoint.example}'` : ''}
`}
                                                        </pre>
                                                    </div>

                                                    <div>
                                                        <h5 className="font-medium text-foreground mb-2">Response:</h5>
                                                        <pre className="bg-slate-900 text-blue-400 p-3 rounded text-xs overflow-auto">
                                                            {endpoint.response}
                                                        </pre>
                                                    </div>
                                                </div>
                                            </details>
                                        </div>
                                    ))}
                                </div>

                                {filteredEndpoints.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Nenhum endpoint encontrado para a categoria "{selectedCategory}"
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "webhook" && (
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 text-foreground">🔗 Sistema de Webhooks</h2>
                            <p className="text-muted-foreground mb-6">
                                Configure automações e integrações via webhooks para receber notificações em tempo real sobre eventos do sistema.
                            </p>

                            {/* Configuração de Webhook */}
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6">
                                <h3 className="text-lg font-semibold mb-4 text-foreground">⚙️ Configuração de Webhook</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                URL do Webhook
                                            </label>
                                            <input
                                                type="url"
                                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                                placeholder="https://seu-site.com/webhook"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                Secret Token
                                            </label>
                                            <input
                                                type="password"
                                                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                                                placeholder="Token para validação de segurança"
                                            />
                                        </div>

                                        <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                                            💾 Salvar Configuração
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Eventos para Notificar
                                            </label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {[
                                                    { id: 'container.started', label: 'Container Iniciado' },
                                                    { id: 'container.stopped', label: 'Container Parado' },
                                                    { id: 'container.created', label: 'Container Criado' },
                                                    { id: 'system.cpu.alert', label: 'Alerta de CPU' },
                                                    { id: 'system.memory.alert', label: 'Alerta de Memória' },
                                                    { id: 'system.disk.alert', label: 'Alerta de Disco' },
                                                    { id: 'firewall.rule.created', label: 'Regra de Firewall Criada' },
                                                    { id: 'firewall.rule.deleted', label: 'Regra de Firewall Removida' },
                                                    { id: 'auth.login.success', label: 'Login Realizado' },
                                                    { id: 'auth.login.failed', label: 'Tentativa de Login Falhada' },
                                                    { id: 'client.created', label: 'Cliente Criado' },
                                                    { id: 'expense.created', label: 'Despesa Registrada' },
                                                    { id: 'email.account.created', label: 'Conta de Email Criada' }
                                                ].map(event => (
                                                    <label key={event.id} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="mr-2 text-blue-600 bg-background border-border rounded"
                                                        />
                                                        <span className="text-sm text-foreground">{event.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Documentação de Eventos */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-foreground">📡 Eventos Disponíveis</h3>

                                {/* Container Events */}
                                <div className="bg-card border border-border rounded-lg p-4">
                                    <h4 className="font-medium text-foreground mb-2">� Container Events</h4>
                                    <p className="text-muted-foreground text-sm mb-3">
                                        Disparado quando containers Docker mudam de status
                                    </p>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded p-3">
                                        <div className="text-xs text-muted-foreground mb-2">POST /your-webhook-url</div>
                                        <pre className="text-xs text-foreground whitespace-pre-wrap">
                                            {`{
  "event": "container.started",
  "timestamp": "2025-01-15T10:00:00Z",
  "data": {
    "container": {
      "id": "abc123def456",
      "name": "nginx-proxy",
      "image": "nginx:latest",
      "status": "running",
      "ports": ["80:80", "443:443"]
    }
  }
}`}
                                        </pre>
                                    </div>
                                </div>

                                {/* System Events */}
                                <div className="bg-card border border-border rounded-lg p-4">
                                    <h4 className="font-medium text-foreground mb-2">🖥️ System Alerts</h4>
                                    <p className="text-muted-foreground text-sm mb-3">
                                        Alertas de recursos do sistema (CPU, memória, disco)
                                    </p>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded p-3">
                                        <div className="text-xs text-muted-foreground mb-2">POST /your-webhook-url</div>
                                        <pre className="text-xs text-foreground whitespace-pre-wrap">
                                            {`{
  "event": "system.cpu.alert",
  "timestamp": "2025-01-15T10:00:00Z",
  "data": {
    "alert": {
      "type": "high_cpu",
      "current_value": 95.5,
      "threshold": 90,
      "severity": "critical",
      "message": "CPU usage is critically high"
    }
  }
}`}
                                        </pre>
                                    </div>
                                </div>

                                {/* Firewall Events */}
                                <div className="bg-card border border-border rounded-lg p-4">
                                    <h4 className="font-medium text-foreground mb-2">🔥 Firewall Events</h4>
                                    <p className="text-muted-foreground text-sm mb-3">
                                        Alterações nas regras de firewall
                                    </p>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded p-3">
                                        <div className="text-xs text-muted-foreground mb-2">POST /your-webhook-url</div>
                                        <pre className="text-xs text-foreground whitespace-pre-wrap">
                                            {`{
  "event": "firewall.rule.created",
  "timestamp": "2025-01-15T10:00:00Z",
  "data": {
    "rule": {
      "id": 15,
      "port": 443,
      "protocol": "tcp",
      "action": "ACCEPT",
      "source": "192.168.1.0/24",
      "description": "Allow HTTPS from local network"
    }
  }
}`}
                                        </pre>
                                    </div>
                                </div>

                                {/* Business Events */}
                                <div className="bg-card border border-border rounded-lg p-4">
                                    <h4 className="font-medium text-foreground mb-2">💼 Business Events</h4>
                                    <p className="text-muted-foreground text-sm mb-3">
                                        Eventos de clientes, despesas e transações
                                    </p>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded p-3">
                                        <div className="text-xs text-muted-foreground mb-2">POST /your-webhook-url</div>
                                        <pre className="text-xs text-foreground whitespace-pre-wrap">
                                            {`{
  "event": "client.created",
  "timestamp": "2025-01-15T10:00:00Z",
  "data": {
    "client": {
      "id": 25,
      "name": "João Silva",
      "email": "joao@example.com",
      "phone": "(11) 99999-9999",
      "created_at": "2025-01-15T10:00:00Z"
    }
  }
}`}
                                        </pre>
                                    </div>
                                </div>

                                {/* Authentication Events */}
                                <div className="bg-card border border-border rounded-lg p-4">
                                    <h4 className="font-medium text-foreground mb-2">🔐 Authentication Events</h4>
                                    <p className="text-muted-foreground text-sm mb-3">
                                        Eventos de login, logout e segurança
                                    </p>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded p-3">
                                        <div className="text-xs text-muted-foreground mb-2">POST /your-webhook-url</div>
                                        <pre className="text-xs text-foreground whitespace-pre-wrap">
                                            {`{
  "event": "auth.login.failed",
  "timestamp": "2025-01-15T10:00:00Z",
  "data": {
    "attempt": {
      "username": "admin",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "reason": "invalid_password",
      "attempt_count": 3
    }
  }
}`}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {/* Implementação */}
                            <div className="bg-card border border-border rounded-lg p-4">
                                <h3 className="text-lg font-semibold mb-4 text-foreground">🛠️ Implementação do Webhook</h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-foreground mb-2">Validação de Assinatura</h4>
                                        <pre className="bg-slate-900 text-green-400 p-3 rounded text-xs overflow-auto">
                                            {`const crypto = require('crypto');

function validateWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature), 
    Buffer.from(digest)
  );
}

// Headers enviados:
// X-WPanel-Signature: sha256=abc123...
// X-WPanel-Delivery: uuid4
// User-Agent: WPanel-Hookshot/1.0`}
                                        </pre>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-foreground mb-2">Exemplo de Handler</h4>
                                        <pre className="bg-slate-900 text-blue-400 p-3 rounded text-xs overflow-auto">
                                            {`app.post('/webhook', (req, res) => {
  const signature = req.headers['x-wpanel-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!validateWebhook(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Unauthorized');
  }
  
  const { event, timestamp, data } = req.body;
  
  switch(event) {
    case 'container.started':
      console.log('Container iniciado:', data.container.name);
      break;
    case 'system.cpu.alert':
      console.log('Alerta de CPU:', data.alert.current_value + '%');
      break;
    default:
      console.log('Evento não tratado:', event);
  }
  
  res.status(200).send('OK');
});`}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}