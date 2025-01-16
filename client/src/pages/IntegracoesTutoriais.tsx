import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Package, ShoppingCart } from 'lucide-react';

const IntegracoesTutoriais: React.FC = () => (
    <div className="p-6 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Guia de Início Rápido</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">Demonstrações práticas das funcionalidades do sistema</p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Exemplo Clientes */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" />Gestão de Clientes</h3>
                    {/* ...conteúdo... */}
                </div>
                {/* Exemplo Produtos */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Package className="w-5 h-5 text-green-500" />Controle de Produtos</h3>
                    {/* ...conteúdo... */}
                </div>
                {/* Exemplo Vendas */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-purple-500" />Processamento de Vendas</h3>
                    {/* ...conteúdo... */}
                </div>
            </CardContent>
        </Card>
    </div>
);

export default IntegracoesTutoriais;
