import { useState, useCallback } from 'react';

interface UploadedFile {
  objectName: string;
  originalName: string;
  size: number;
  mimeType: string;
  presignedUrl: string;
}

interface UseMinioUploadOptions {
  onUploadSuccess?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
}

export const useMinioUpload = (type: 'products' | 'clients' | 'suppliers' | 'general', options?: UseMinioUploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    setUploading(true);
    setError(null);

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
      options?.onUploadSuccess?.(uploadedFile);
      
      return uploadedFile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
      setError(errorMessage);
      options?.onUploadError?.(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, [type, options]);

  const uploadFiles = useCallback(async (files: FileList): Promise<UploadedFile[]> => {
    const uploadedFiles: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadedFile = await uploadFile(file);
      if (uploadedFile) {
        uploadedFiles.push(uploadedFile);
      }
    }
    
    return uploadedFiles;
  }, [uploadFile]);

  const deleteFile = useCallback(async (objectName: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/minio/file/${encodeURIComponent(objectName)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(file => file.objectName !== objectName));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      return false;
    }
  }, []);

  const getPresignedUrl = useCallback(async (objectName: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/minio/presigned/${encodeURIComponent(objectName)}`);
      
      if (response.ok) {
        const result = await response.json();
        return result.presignedUrl;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter URL do arquivo:', error);
      return null;
    }
  }, []);

  const listFiles = useCallback(async (): Promise<any[]> => {
    try {
      const response = await fetch(`/api/minio/files/${type}`);
      
      if (response.ok) {
        const result = await response.json();
        return result.files || [];
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      return [];
    }
  }, [type]);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploading,
    uploadedFiles,
    error,
    uploadFile,
    uploadFiles,
    deleteFile,
    getPresignedUrl,
    listFiles,
    clearFiles,
    clearError,
  };
};

export default useMinioUpload;