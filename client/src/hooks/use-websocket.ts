import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ToastSounds } from '@/utils/toast-sounds';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: string;
}

export function useWebSocket() {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectedAt, setConnectedAt] = useState<Date | null>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transmissionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Helper function to show toast notifications with sounds and icons
  const showToast = useCallback((type: string, data?: any) => {
    // Determine sound type and variant based on operation
    let soundType: 'success' | 'error' | 'info' | 'warning' = 'info';
    let variant: 'default' | 'destructive' = 'default';
    
    if (type.includes('deleted')) {
      soundType = 'error';
      variant = 'destructive';
    } else if (type.includes('created')) {
      soundType = 'success';
    } else if (type.includes('updated')) {
      soundType = 'info';
    }

    // Get icon emoji based on type
    let iconEmoji = 'ℹ️';
    if (type.includes('deleted')) iconEmoji = '🗑️';
    else if (type.includes('created')) iconEmoji = '✅';
    else if (type.includes('updated')) iconEmoji = 'ℹ️';
    else if (type.includes('client')) iconEmoji = '👤';
    else if (type.includes('product')) iconEmoji = '📦';
    else if (type.includes('supplier')) iconEmoji = '🚛';
    else if (type.includes('sale')) iconEmoji = '🛒';
    else if (type.includes('ticket')) iconEmoji = '🎫';

    const actionMap: Record<string, { title: string; description: string }> = {
      'client_created': { title: 'Cliente criado', description: `${data?.name} foi adicionado com sucesso` },
      'client_updated': { title: 'Cliente atualizado', description: `${data?.name} foi modificado` },
      'client_deleted': { title: 'Cliente removido', description: 'Cliente foi excluído do sistema' },
      'product_created': { title: 'Produto criado', description: `${data?.name} foi adicionado ao catálogo` },
      'product_updated': { title: 'Produto atualizado', description: `${data?.name} foi modificado` },
      'product_deleted': { title: 'Produto removido', description: 'Produto foi excluído do catálogo' },
      'supplier_created': { title: 'Fornecedor criado', description: `${data?.name} foi adicionado` },
      'supplier_updated': { title: 'Fornecedor atualizado', description: `${data?.name} foi modificado` },
      'supplier_deleted': { title: 'Fornecedor removido', description: 'Fornecedor foi excluído' },
      'sale_created': { title: 'Venda criada', description: `Venda ${data?.saleNumber} foi registrada` },
      'sale_updated': { title: 'Venda atualizada', description: `Venda ${data?.saleNumber} foi modificada` },
      'sale_deleted': { title: 'Venda removida', description: 'Venda foi excluída do sistema' },
      'ticket_created': { title: 'Ticket criado', description: `Ticket ${data?.ticketNumber} foi aberto` },
      'ticket_updated': { title: 'Ticket atualizado', description: `Ticket ${data?.ticketNumber} foi modificado` },
      'ticket_deleted': { title: 'Ticket removido', description: 'Ticket foi excluído' },
      'ticket_message_created': { title: 'Nova mensagem', description: 'Mensagem adicionada ao ticket' },
    };

    const config = actionMap[type];
    if (config) {
      // Play sound
      ToastSounds.playSound(soundType);
      
      // Show toast with icon emoji
      toast({
        title: `${iconEmoji} ${config.title}`,
        description: config.description,
        variant: variant,
      });
    }
  }, [toast]);

  const connect = useCallback(() => {
    try {
      setStatus('connecting');
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setStatus('connected');
        setConnectedAt(new Date());
        
        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Show transmission animation for data messages
          if (message.type !== 'connection' && message.type !== 'pong') {
            setIsTransmitting(true);
            if (transmissionTimeoutRef.current) {
              clearTimeout(transmissionTimeoutRef.current);
            }
            transmissionTimeoutRef.current = setTimeout(() => {
              setIsTransmitting(false);
            }, 2000);
          }

          // Handle different message types and invalidate queries
          switch (message.type) {
            // Client operations
            case 'client_created':
            case 'client_updated':
            case 'client_deleted':
              queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
              showToast(message.type, message.data);
              break;
            
            // Product operations
            case 'product_created':
            case 'product_updated':
            case 'product_deleted':
              queryClient.invalidateQueries({ queryKey: ['/api/products'] });
              showToast(message.type, message.data);
              break;
            
            // Supplier operations
            case 'supplier_created':
            case 'supplier_updated':
            case 'supplier_deleted':
              queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
              showToast(message.type, message.data);
              break;
            
            // Sales operations
            case 'sale_created':
            case 'sale_updated':
            case 'sale_deleted':
              queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
              // Also invalidate sale items
              if (message.data && message.data.id) {
                queryClient.invalidateQueries({ 
                  queryKey: ['/api/sales', message.data.id, 'items'] 
                });
              }
              showToast(message.type, message.data);
              break;
            
            // Support ticket operations
            case 'ticket_created':
            case 'ticket_updated':
            case 'ticket_deleted':
              queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
              queryClient.invalidateQueries({ queryKey: ['/api/support/categories'] });
              showToast(message.type, message.data);
              break;
            
            case 'ticket_message_created':
              queryClient.invalidateQueries({ 
                queryKey: ['/api/support/tickets', message.data.ticketId, 'messages'] 
              });
              queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
              showToast(message.type, message.data);
              break;
            
            // System messages
            case 'connection':
              console.log('WebSocket connection confirmed');
              break;
            case 'pong':
              // Keep-alive response
              break;
            
            default:
              console.log('Unknown WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setStatus('disconnected');
        setConnectedAt(null);
        wsRef.current = null;
        
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setStatus('error');
      
      // Retry connection after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  }, [queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (transmissionTimeoutRef.current) {
      clearTimeout(transmissionTimeoutRef.current);
      transmissionTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setStatus('disconnected');
    setIsTransmitting(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    lastMessage,
    connectedAt,
    isTransmitting,
    connect,
    disconnect,
    sendMessage,
    isConnected: status === 'connected'
  };
}