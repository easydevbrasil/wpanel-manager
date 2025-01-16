import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Code, 
    Terminal, 
    Key, 
    Globe, 
    Copy, 
    Play, 
    BookOpen, 
    Shield,
    Database,
    Zap,
    FileText,
    Settings,
    CheckCircle,
    XCircle
} from 'lucide-react';

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

interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    category: string;
    authenticated: boolean;
    parameters?: any;
    response?: any;
}

const apiEndpoints: APIEndpoint[] = [
    // Clientes
    { method: 'GET', path: '/api/clients', description: 'Listar todos os clientes', category: 'Clientes', authenticated: true },
    { method: 'POST', path: '/api/clients', description: 'Criar novo cliente', category: 'Clientes', authenticated: true },
    { method: 'GET', path: '/api/clients/:id', description: 'Obter cliente específico', category: 'Clientes', authenticated: true },
    { method: 'PUT', path: '/api/clients/:id', description: 'Atualizar cliente', category: 'Clientes', authenticated: true },
    { method: 'DELETE', path: '/api/clients/:id', description: 'Remover cliente', category: 'Clientes', authenticated: true },
    
    // Produtos
    { method: 'GET', path: '/api/products', description: 'Listar todos os produtos', category: 'Produtos', authenticated: true },
    { method: 'POST', path: '/api/products', description: 'Criar novo produto', category: 'Produtos', authenticated: true },
    { method: 'GET', path: '/api/products/:id', description: 'Obter produto específico', category: 'Produtos', authenticated: true },
    { method: 'PUT', path: '/api/products/:id', description: 'Atualizar produto', category: 'Produtos', authenticated: true },
    { method: 'DELETE', path: '/api/products/:id', description: 'Remover produto', category: 'Produtos', authenticated: true },
    
    // Vendas
    { method: 'GET', path: '/api/sales', description: 'Listar todas as vendas', category: 'Vendas', authenticated: true },
    { method: 'POST', path: '/api/sales', description: 'Criar nova venda', category: 'Vendas', authenticated: true },
    { method: 'GET', path: '/api/sales/:id', description: 'Obter venda específica', category: 'Vendas', authenticated: true },
    { method: 'PUT', path: '/api/sales/:id', description: 'Atualizar venda', category: 'Vendas', authenticated: true },
    
    // Fornecedores
    { method: 'GET', path: '/api/suppliers', description: 'Listar fornecedores', category: 'Fornecedores', authenticated: true },
    { method: 'POST', path: '/api/suppliers', description: 'Criar fornecedor', category: 'Fornecedores', authenticated: true },
    
    // Sistema
    { method: 'GET', path: '/api/system/status', description: 'Status do sistema', category: 'Sistema', authenticated: false },
    { method: 'GET', path: '/api/system/health', description: 'Health check', category: 'Sistema', authenticated: false },
    
    // Docker
    { method: 'GET', path: '/api/docker/containers', description: 'Listar containers', category: 'Docker', authenticated: true },
    { method: 'POST', path: '/api/docker/containers/:id/start', description: 'Iniciar container', category: 'Docker', authenticated: true },
    { method: 'POST', path: '/api/docker/containers/:id/stop', description: 'Parar container', category: 'Docker', authenticated: true },
    
    // Nginx
    { method: 'GET', path: '/api/nginx/hosts', description: 'Listar hosts', category: 'Nginx', authenticated: true },
    { method: 'POST', path: '/api/nginx/hosts', description: 'Criar host', category: 'Nginx', authenticated: true },
    
    // Autenticação
    { method: 'POST', path: '/api/auth/login', description: 'Fazer login', category: 'Autenticação', authenticated: false },
    { method: 'POST', path: '/api/auth/logout', description: 'Fazer logout', category: 'Autenticação', authenticated: true },
    { method: 'GET', path: '/api/auth/me', description: 'Dados do usuário atual', category: 'Autenticação', authenticated: true },
];

const codeExamples = {
    javascript: `// Exemplo usando fetch API
const response = await fetch('https://sua-instancia.com/api/clients', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer seu-token-jwt',
        'Content-Type': 'application/json'
    }
});

const clients = await response.json();
console.log(clients);`,
    
    curl: `# Exemplo usando cURL
curl -X GET "https://sua-instancia.com/api/clients" \\
     -H "Authorization: Bearer seu-token-jwt" \\
     -H "Content-Type: application/json"`,
     
    python: `# Exemplo usando Python requests
import requests

headers = {
    'Authorization': 'Bearer seu-token-jwt',
    'Content-Type': 'application/json'
}

response = requests.get('https://sua-instancia.com/api/clients', headers=headers)
clients = response.json()
print(clients)`,

    php: `<?php
// Exemplo usando PHP cURL
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://sua-instancia.com/api/clients',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer seu-token-jwt',
        'Content-Type: application/json'
    ]
]);

$response = curl_exec($curl);
$clients = json_decode($response, true);
curl_close($curl);

print_r($clients);
?>`
};

const responseExamples = {
    success: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": "(11) 99999-9999",
      "created_at": "2025-01-16T18:00:00Z",
      "updated_at": "2025-01-16T18:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 123,
    "per_page": 25
  }
}`,
    
    error: `{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos fornecidos",
    "details": {
      "email": ["O campo email é obrigatório"],
      "name": ["O campo nome deve ter pelo menos 2 caracteres"]
    }
  },
  "timestamp": "2025-01-16T18:00:00Z"
}`
};

const IntegracoesAPI: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
    const [selectedCodeExample, setSelectedCodeExample] = useState<string>('javascript');
    const [apiKey, setApiKey] = useState<string>('wpanel_test_key_' + Math.random().toString(36).substring(7));
    const [baseUrl, setBaseUrl] = useState<string>('https://sua-instancia.wpanel.com');
    const [testResult, setTestResult] = useState<any>(null);
    const [isTestingAPI, setIsTestingAPI] = useState<boolean>(false);
    
    const categories = ['Todos', ...Array.from(new Set(apiEndpoints.map(e => e.category)))];
    const filteredEndpoints = selectedCategory === 'Todos' 
        ? apiEndpoints 
        : apiEndpoints.filter(e => e.category === selectedCategory);
    
    const getMethodColor = (method: string) => {
        switch (method) {
            case 'GET': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
            case 'POST': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
            case 'PUT': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300';
            case 'DELETE': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
            case 'PATCH': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
        }
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };
    
    const generateApiKey = () => {
        const prefix = 'wpanel_';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setApiKey(prefix + result);
    };
    
    const testApiEndpoint = async () => {
        if (!selectedEndpoint) return;
        
        setIsTestingAPI(true);
        
        // Simular resposta da API
        setTimeout(() => {
            setTestResult({
                success: true,
                status: 200,
                statusText: 'OK',
                data: { test: true, endpoint: selectedEndpoint.path },
                timestamp: new Date().toISOString()
            });
            setIsTestingAPI(false);
        }, 1200);
    };

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Terminal className="w-5 h-5" />
                        API REST - Documentação e Testes
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400">
                        Documentação completa da API REST para integração com sistemas externos
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* API Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-500" />
                                Base URL
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        URL da Instância
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={baseUrl}
                                            onChange={e => setBaseUrl(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground"
                                            placeholder="https://sua-instancia.wpanel.com"
                                        />
                                        <Button onClick={() => copyToClipboard(baseUrl)} variant="outline" size="sm">
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>• Todas as requisições devem usar HTTPS</p>
                                    <p>• Rate limit: 1000 requisições/hora</p>
                                    <p>• Timeout: 30 segundos</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Key className="w-5 h-5 text-orange-500" />
                                Autenticação
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        API Key
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={e => setApiKey(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground font-mono text-sm"
                                        />
                                        <Button onClick={generateApiKey} variant="outline" size="sm">
                                            <Zap className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <p>• Header: <code>Authorization: Bearer {apiKey.substring(0, 12)}...</code></p>
                                    <p>• Válido por 30 dias</p>
                                    <p>• Renovação automática disponível</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* API Endpoints */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Database className="w-5 h-5 text-green-500" />
                            Endpoints Disponíveis
                        </h3>
                        
                        {/* Category Filter */}
                        <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                                {categories.map(category => (
                                    <Button
                                        key={category}
                                        variant={selectedCategory === category ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Endpoints List */}
                        <div className="space-y-2">
                            {filteredEndpoints.map((endpoint, index) => (
                                <div
                                    key={index}
                                    className={`p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                        selectedEndpoint === endpoint ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''
                                    }`}
                                    onClick={() => setSelectedEndpoint(endpoint)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded text-xs font-mono font-semibold ${getMethodColor(endpoint.method)}`}>
                                                {endpoint.method}
                                            </span>
                                            <code className="text-sm font-mono">{endpoint.path}</code>
                                            {endpoint.authenticated && (
                                                <div title="Requer autenticação">
                                                    <Shield className="w-4 h-4 text-yellow-500" />
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{endpoint.category}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{endpoint.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Code Examples */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Code className="w-5 h-5 text-purple-500" />
                            Exemplos de Código
                        </h3>
                        
                        {/* Language Selector */}
                        <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(codeExamples).map(lang => (
                                    <Button
                                        key={lang}
                                        variant={selectedCodeExample === lang ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedCodeExample(lang)}
                                    >
                                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Code Editor */}
                        <div className="relative">
                            <Button
                                onClick={() => copyToClipboard(codeExamples[selectedCodeExample as keyof typeof codeExamples])}
                                className="absolute top-2 right-2 z-10"
                                variant="outline"
                                size="sm"
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                            <CodeEditor
                                value={codeExamples[selectedCodeExample as keyof typeof codeExamples]}
                                onChange={() => {}}
                                language={selectedCodeExample}
                            />
                        </div>
                    </div>

                    {/* Response Examples */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Resposta de Sucesso
                            </h3>
                            <CodeEditor
                                value={responseExamples.success}
                                onChange={() => {}}
                                language="json"
                            />
                        </div>
                        
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-red-500" />
                                Resposta de Erro
                            </h3>
                            <CodeEditor
                                value={responseExamples.error}
                                onChange={() => {}}
                                language="json"
                            />
                        </div>
                    </div>

                    {/* API Testing */}
                    {selectedEndpoint && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Play className="w-5 h-5 text-blue-500" />
                                Testar Endpoint
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-mono font-semibold ${getMethodColor(selectedEndpoint.method)}`}>
                                            {selectedEndpoint.method}
                                        </span>
                                        <code className="text-sm font-mono">{baseUrl}{selectedEndpoint.path}</code>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedEndpoint.description}</p>
                                </div>
                                
                                <Button 
                                    onClick={testApiEndpoint} 
                                    disabled={isTestingAPI} 
                                    className="w-full"
                                >
                                    {isTestingAPI ? (
                                        <>
                                            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                                            Testando...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Executar Teste
                                        </>
                                    )}
                                </Button>
                                
                                {testResult && (
                                    <div className="mt-4">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-green-500" />
                                            Resultado do Teste
                                        </h4>
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
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{testResult.status} {testResult.statusText}</div>
                                            </div>
                                            <div className="p-4 font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-x-auto max-h-96 overflow-y-auto">
                                                <pre className="whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quick Reference */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-500" />
                            Referência Rápida
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium text-green-600 dark:text-green-400">Códigos de Status</h4>
                                <div className="text-sm space-y-1">
                                    <p><code>200</code> - Sucesso</p>
                                    <p><code>201</code> - Criado</p>
                                    <p><code>400</code> - Erro de validação</p>
                                    <p><code>401</code> - Não autorizado</p>
                                    <p><code>404</code> - Não encontrado</p>
                                    <p><code>500</code> - Erro interno</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="font-medium text-blue-600 dark:text-blue-400">Parâmetros Comuns</h4>
                                <div className="text-sm space-y-1">
                                    <p><code>page</code> - Página atual</p>
                                    <p><code>limit</code> - Itens por página</p>
                                    <p><code>search</code> - Busca textual</p>
                                    <p><code>sort</code> - Campo de ordenação</p>
                                    <p><code>order</code> - asc ou desc</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="font-medium text-purple-600 dark:text-purple-400">Headers Importantes</h4>
                                <div className="text-sm space-y-1">
                                    <p><code>Authorization</code> - Token JWT</p>
                                    <p><code>Content-Type</code> - application/json</p>
                                    <p><code>Accept</code> - application/json</p>
                                    <p><code>X-Request-ID</code> - ID da requisição</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default IntegracoesAPI;