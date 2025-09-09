import { Request, Response, NextFunction } from 'express';

// API Keys - Em produção, isso deveria vir de uma base de dados ou variáveis de ambiente
const VALID_API_KEYS = new Set([
  'wpanel-dev-key-2025',
  'wpanel-admin-key-secure',
  'wpanel-readonly-key-123'
]);

interface AuthenticatedRequest extends Request {
  apiKey?: string;
}

// Middleware para verificar API Key
export const authenticateApiKey = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Permitir acesso às rotas estáticas e de login
  if (req.path.startsWith('/api/auth') || 
      req.path === '/' || 
      req.path.startsWith('/assets') ||
      req.path.startsWith('/src') ||
      req.path.includes('.js') ||
      req.path.includes('.css') ||
      req.path.includes('.html') ||
      req.path.includes('.png') ||
      req.path.includes('.jpg') ||
      req.path.includes('.ico')) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required. Include X-API-Key header.',
      error: 'MISSING_API_KEY'
    });
  }

  if (!VALID_API_KEYS.has(apiKey)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid API key.',
      error: 'INVALID_API_KEY'
    });
  }

  // API key válida, continuar
  req.apiKey = apiKey;
  next();
};

// Função para gerar nova API key (para administradores)
export const generateApiKey = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `wpanel-${timestamp}-${random}`;
};

// Função para adicionar nova API key (simulação - em produção seria salva no banco)
export const addApiKey = (apiKey: string): boolean => {
  if (VALID_API_KEYS.has(apiKey)) {
    return false; // Já existe
  }
  VALID_API_KEYS.add(apiKey);
  return true;
};

// Função para remover API key
export const removeApiKey = (apiKey: string): boolean => {
  return VALID_API_KEYS.delete(apiKey);
};

// Função para listar API keys (apenas para administradores)
export const listApiKeys = (): string[] => {
  return Array.from(VALID_API_KEYS);
};

export { AuthenticatedRequest };
