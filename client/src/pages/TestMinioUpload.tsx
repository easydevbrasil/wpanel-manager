import React, { useState } from 'react';
import { MinioFileUpload } from '../components/MinioFileUpload';

const TestMinioUpload: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleUploadSuccess = (file: any) => {
    setMessage(`Arquivo enviado com sucesso: ${file.originalName}`);
    setMessageType('success');
    console.log('Upload success:', file);
  };

  const handleUploadError = (error: string) => {
    setMessage(`Erro no upload: ${error}`);
    setMessageType('error');
    console.error('Upload error:', error);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Teste de Upload para MinIO S3
        </h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Produtos */}
          <div className="bg-white p-6 rounded-lg shadow-lg border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload de Produtos
            </h2>
            <MinioFileUpload
              type="products"
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              maxFiles={3}
              className="mb-4"
            />
          </div>

          {/* Clientes */}
          <div className="bg-white p-6 rounded-lg shadow-lg border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload de Clientes
            </h2>
            <MinioFileUpload
              type="clients"
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              maxFiles={5}
              className="mb-4"
            />
          </div>

          {/* Fornecedores */}
          <div className="bg-white p-6 rounded-lg shadow-lg border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload de Fornecedores
            </h2>
            <MinioFileUpload
              type="suppliers"
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              maxFiles={3}
              className="mb-4"
            />
          </div>

          {/* Geral */}
          <div className="bg-white p-6 rounded-lg shadow-lg border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload Geral
            </h2>
            <MinioFileUpload
              type="general"
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              maxFiles={10}
              className="mb-4"
            />
          </div>
        </div>

        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Informações sobre o Upload
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Formatos aceitos: Imagens, PDF, DOC, DOCX, XLS, XLSX, TXT</li>
            <li>• Tamanho máximo: 10MB por arquivo</li>
            <li>• Os arquivos são organizados por categoria (products, clients, suppliers, general)</li>
            <li>• Versionamento automático habilitado</li>
            <li>• URLs presignadas válidas por 24 horas</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestMinioUpload;