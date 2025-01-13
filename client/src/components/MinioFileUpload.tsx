import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, FileText, Download } from 'lucide-react';

interface UploadedFile {
  objectName: string;
  originalName: string;
  size: number;
  mimeType: string;
  presignedUrl: string;
}

interface MinioFileUploadProps {
  type: 'products' | 'clients' | 'suppliers' | 'general';
  onUploadSuccess?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  accept?: string;
}

export const MinioFileUpload: React.FC<MinioFileUploadProps> = ({
  type,
  onUploadSuccess,
  onUploadError,
  maxFiles = 5,
  disabled = false,
  className = '',
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt'
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-4 h-4 text-red-500" />;
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="w-4 h-4 text-blue-500" />;
    } else if (mimeType.includes('excel') || mimeType.includes('sheet')) {
      return <FileText className="w-4 h-4 text-green-500" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (files: FileList) => {
    if (disabled || uploading) return;
    
    if (uploadedFiles.length + files.length > maxFiles) {
      const error = `Máximo de ${maxFiles} arquivos permitidos`;
      onUploadError?.(error);
      return;
    }

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/minio/upload/${type}`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro no upload');
        }

        const result = await response.json();
        const uploadedFile: UploadedFile = {
          objectName: result.objectName,
          originalName: result.originalName,
          size: result.size,
          mimeType: result.mimeType,
          presignedUrl: result.presignedUrl,
        };

        setUploadedFiles(prev => [...prev, uploadedFile]);
        onUploadSuccess?.(uploadedFile);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
        onUploadError?.(errorMessage);
      }
    }

    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  const removeFile = async (objectName: string) => {
    try {
      const response = await fetch(`/api/minio/file/${encodeURIComponent(objectName)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(file => file.objectName !== objectName));
      }
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
    }
  };

  const downloadFile = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.presignedUrl;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600">
          {uploading ? 'Enviando arquivos...' : 'Clique ou arraste arquivos aqui'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Máximo: {maxFiles} arquivos | Formatos: imagens, PDF, DOC, XLS, TXT
        </p>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Arquivos enviados:</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(file.mimeType)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadFile(file)}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeFile(file.objectName)}
                  className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                  title="Remover"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MinioFileUpload;