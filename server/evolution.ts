// Evolution API Service
// Manages Evolution API instances, connections, and QR codes

export interface EvolutionInstance {
  instanceName: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qrcode';
  qrcode?: string;
  webhook?: string;
  webhookByEvents?: boolean;
  events?: string[];
  profileName?: string;
  profilePictureUrl?: string;
  owner?: string;
  profileStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvolutionQRCode {
  base64: string;
  code: string;
  count: number;
}

export interface EvolutionWebhook {
  url: string;
  enabled: boolean;
  events: string[];
}

export interface EvolutionResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class EvolutionService {
  private baseUrl: string;
  private apiKey: string;
  private defaultInstance: string;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_ENDPOINT || '';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
    this.defaultInstance = process.env.EVOLUTION_INSTANCE || '';

    console.log('Evolution API initialization:', {
      baseUrl: this.baseUrl,
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'not set',
      defaultInstance: this.defaultInstance
    });

    if (!this.baseUrl || !this.apiKey) {
      console.warn('Evolution API credentials not configured properly');
    }
  }

  private async makeRequest<T>(endpoint: string, options: any = {}): Promise<EvolutionResponse<T>> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Evolution API credentials not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'ApiKey': this.apiKey,
      ...options.headers
    };

    try {
      console.log(`Making Evolution API request to: ${url}`);
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`Evolution API error (${response.status}):`, data);
        throw new Error(`Evolution API error: ${response.status} - ${JSON.stringify(data.error || data)}`);
      }

      return {
        success: true,
        data: data as T
      };
    } catch (error) {
      console.error(`Error making Evolution API request to ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Create a new instance
  async createInstance(instanceName: string, webhook?: EvolutionWebhook): Promise<EvolutionResponse<EvolutionInstance>> {
    const body: any = {
      instanceName,
      token: this.apiKey,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    };

    if (webhook) {
      body.webhook_url = webhook.url;
      body.webhook_by_events = webhook.enabled;
      body.events = webhook.events;
    }

    return await this.makeRequest<EvolutionInstance>('/instance/create', {
      method: 'POST',
      body
    });
  }

  // Get instance information
  async getInstance(instanceName?: string): Promise<EvolutionResponse<EvolutionInstance>> {
    const instance = instanceName || this.defaultInstance;
    return await this.makeRequest<EvolutionInstance>(`/instance/fetchInstances?instanceName=${instance}`);
  }

  // Get all instances
  async getAllInstances(): Promise<EvolutionResponse<EvolutionInstance[]>> {
    return await this.makeRequest<EvolutionInstance[]>('/instance/fetchInstances');
  }

  // Connect instance (generate QR code)
  async connectInstance(instanceName?: string): Promise<EvolutionResponse<EvolutionQRCode>> {
    const instance = instanceName || this.defaultInstance;
    return await this.makeRequest<EvolutionQRCode>(`/instance/connect/${instance}`, {
      method: 'GET'
    });
  }

  // Get instance connection status
  async getInstanceStatus(instanceName?: string): Promise<EvolutionResponse<{ instance: EvolutionInstance }>> {
    const instance = instanceName || this.defaultInstance;
    return await this.makeRequest<{ instance: EvolutionInstance }>(`/instance/connectionState/${instance}`);
  }

  // Restart instance
  async restartInstance(instanceName?: string): Promise<EvolutionResponse<any>> {
    const instance = instanceName || this.defaultInstance;
    return await this.makeRequest<any>(`/instance/restart/${instance}`, {
      method: 'PUT'
    });
  }

  // Delete instance
  async deleteInstance(instanceName?: string): Promise<EvolutionResponse<any>> {
    const instance = instanceName || this.defaultInstance;
    return await this.makeRequest<any>(`/instance/delete/${instance}`, {
      method: 'DELETE'
    });
  }

  // Logout instance
  async logoutInstance(instanceName?: string): Promise<EvolutionResponse<any>> {
    const instance = instanceName || this.defaultInstance;
    return await this.makeRequest<any>(`/instance/logout/${instance}`, {
      method: 'DELETE'
    });
  }

  // Set webhook
  async setWebhook(instanceName: string, webhook: EvolutionWebhook): Promise<EvolutionResponse<any>> {
    return await this.makeRequest<any>(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: {
        url: webhook.url,
        enabled: webhook.enabled,
        events: webhook.events
      }
    });
  }

  // Get webhook
  async getWebhook(instanceName?: string): Promise<EvolutionResponse<EvolutionWebhook>> {
    const instance = instanceName || this.defaultInstance;
    return await this.makeRequest<EvolutionWebhook>(`/webhook/find/${instance}`);
  }

  // Send text message
  async sendMessage(instanceName: string, number: string, text: string): Promise<EvolutionResponse<any>> {
    return await this.makeRequest<any>(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: {
        number,
        text
      }
    });
  }

  // Get chat history
  async getChatHistory(instanceName: string, number: string, limit: number = 50): Promise<EvolutionResponse<any[]>> {
    return await this.makeRequest<any[]>(`/chat/findMessages/${instanceName}?number=${number}&limit=${limit}`);
  }

  // Get contacts
  async getContacts(instanceName?: string): Promise<EvolutionResponse<any[]>> {
    const instance = instanceName || this.defaultInstance;
    return await this.makeRequest<any[]>(`/chat/findContacts/${instance}`);
  }

  // Get profile picture
  async getProfilePicture(instanceName: string, number: string): Promise<EvolutionResponse<{ profilePictureUrl: string }>> {
    return await this.makeRequest<{ profilePictureUrl: string }>(`/chat/whatsappProfile/${instanceName}?number=${number}`);
  }
}

// Export singleton instance
export const evolutionService = new EvolutionService();