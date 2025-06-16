import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Package,
  Truck,
  ShoppingCart,
  Headphones,
  Mail,
  Play,
  Download,
  Copy,
  Code,
  FileText,
  Settings,
  ChevronRight,
} from "lucide-react";

// VS Code style editor component
function CodeEditor({ value, onChange, language = "json" }: { 
  value: string; 
  onChange: (value: string) => void; 
  language?: string; 
}) {
  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Editor header */}
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
      
      {/* Editor content */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm border-none outline-none resize-none leading-6"
          style={{
            fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
          }}
          spellCheck={false}
        />
        
        {/* Line numbers */}
        <div className="absolute top-0 left-0 p-4 pr-2 text-gray-400 dark:text-gray-600 font-mono text-sm leading-6 pointer-events-none select-none">
          {value.split('\n').map((_, index) => (
            <div key={index} className="text-right w-6">
              {index + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sidebar category component
function CategorySidebar({ selectedCategory, onSelectCategory }: {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}) {
  const categories = [
    { id: 'clients', label: 'Clientes', icon: Users, count: 8 },
    { id: 'products', label: 'Produtos', icon: Package, count: 12 },
    { id: 'suppliers', label: 'Fornecedores', icon: Truck, count: 6 },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart, count: 10 },
    { id: 'support', label: 'Suporte', icon: Headphones, count: 7 },
    { id: 'email-accounts', label: 'Contas Email', icon: Mail, count: 5 },
    { id: 'system', label: 'Sistema', icon: Settings, count: 4 },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Referência da API
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Teste interativo das rotas
        </p>
      </div>
      
      <ScrollArea className="h-full">
        <div className="p-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <category.icon className="w-5 h-5" />
                <span className="font-medium">{category.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// API endpoint component with VS Code editor
function APIEndpointCard({ method, endpoint, description, examplePayload, resourceId }: {
  method: string;
  endpoint: string;
  description: string;
  examplePayload?: any;
  resourceId?: boolean;
}) {
  const [payload, setPayload] = useState(JSON.stringify(examplePayload || {}, null, 2));
  const [customId, setCustomId] = useState('1');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'POST': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const executeRequest = async () => {
    setIsLoading(true);
    try {
      const url = resourceId ? endpoint.replace(':id', customId) : endpoint;
      const options: RequestInit = {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json' },
      };

      if (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'DELETE') {
        try {
          options.body = JSON.stringify(JSON.parse(payload));
        } catch (e) {
          throw new Error('Invalid JSON payload');
        }
      }

      const response = await fetch(url, options);
      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error) {
      setResult({ 
        status: 'Error', 
        data: { error: error instanceof Error ? error.message : 'Unknown error' } 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResult = (format: 'json' | 'txt') => {
    if (!result) return;
    
    const content = format === 'json' 
      ? JSON.stringify(result, null, 2)
      : `Status: ${result.status}\n\nData:\n${JSON.stringify(result.data, null, 2)}`;
    
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-result.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge className={getMethodColor(method)}>
              {method.toUpperCase()}
            </Badge>
            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {endpoint}
            </code>
          </div>
          <Button
            onClick={executeRequest}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>{isLoading ? 'Executando...' : 'Executar'}</span>
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {resourceId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ID do Recurso
            </label>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="1"
            />
          </div>
        )}

        {(method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payload JSON
            </label>
            <CodeEditor
              value={payload}
              onChange={setPayload}
              language="json"
            />
          </div>
        )}

        {result && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Resultado da API
              </label>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadResult('json')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadResult('txt')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  TXT
                </Button>
              </div>
            </div>
            
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  response.json
                </span>
                <Badge variant={result.status < 400 ? "default" : "destructive"}>
                  {result.status}
                </Badge>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900">
                <pre className="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Help() {
  const [selectedCategory, setSelectedCategory] = useState('clients');

  const getEndpointsForCategory = (category: string): Array<{
    method: string;
    endpoint: string;
    description: string;
    examplePayload?: any;
    resourceId?: boolean;
  }> => {
    switch (category) {
      case 'clients':
        return [
          {
            method: 'GET',
            endpoint: '/api/clients',
            description: 'Obter todos os clientes',
          },
          {
            method: 'GET',
            endpoint: '/api/clients/:id',
            description: 'Obter um cliente específico',
            resourceId: true,
          },
          {
            method: 'POST',
            endpoint: '/api/clients',
            description: 'Criar um novo cliente',
            examplePayload: {
              name: "João Silva",
              email: "joao@email.com",
              phone: "(11) 99999-9999",
              address: "Rua das Flores, 123",
              city: "São Paulo",
              state: "SP",
              zipCode: "01234-567"
            },
          },
          {
            method: 'PUT',
            endpoint: '/api/clients/:id',
            description: 'Atualizar um cliente',
            resourceId: true,
            examplePayload: {
              name: "João Silva Santos",
              email: "joao.santos@email.com"
            },
          },
          {
            method: 'DELETE',
            endpoint: '/api/clients/:id',
            description: 'Excluir um cliente',
            resourceId: true,
          },
        ];
      
      case 'products':
        return [
          {
            method: 'GET',
            endpoint: '/api/products',
            description: 'Obter todos os produtos',
          },
          {
            method: 'POST',
            endpoint: '/api/products',
            description: 'Criar um novo produto',
            examplePayload: {
              name: "Smartphone XYZ",
              sku: "SMART-001",
              price: 1299.99,
              cost: 800.00,
              categoryId: 1,
              manufacturerId: 1,
              stock: 50,
              description: "Smartphone com 128GB"
            },
          },
        ];

      case 'sales':
        return [
          {
            method: 'GET',
            endpoint: '/api/sales',
            description: 'Obter todas as vendas',
          },
          {
            method: 'POST',
            endpoint: '/api/sales',
            description: 'Criar uma nova venda',
            examplePayload: {
              clientId: 1,
              totalAmount: 1299.99,
              paymentMethod: "credit_card",
              status: "pending"
            },
          },
        ];

      case 'email-accounts':
        return [
          {
            method: 'GET',
            endpoint: '/api/email-accounts',
            description: 'Obter todas as contas de email',
          },
          {
            method: 'POST',
            endpoint: '/api/email-accounts',
            description: 'Criar uma nova conta de email',
            examplePayload: {
              name: "Email Corporativo",
              email: "admin@empresa.com",
              provider: "smtp",
              smtpHost: "smtp.empresa.com",
              smtpPort: 587,
              smtpSecure: true
            },
          },
        ];

      default:
        return [];
    }
  };

  const endpoints = getEndpointsForCategory(selectedCategory);

  return (
    <div className="flex h-screen overflow-hidden">
      <CategorySidebar 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory} 
      />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Documentação da API
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Teste interativo das rotas da API com editor estilo VS Code
            </p>
          </div>

          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <APIEndpointCard
                key={index}
                method={endpoint.method}
                endpoint={endpoint.endpoint}
                description={endpoint.description}
                examplePayload={endpoint.examplePayload}
                resourceId={endpoint.resourceId || false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}