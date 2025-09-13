// @ts-ignore
import fetch from 'node-fetch';

export interface CloudflareDNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied: boolean;
  zone_id: string;
  zone_name: string;
  created_on: string;
  modified_on: string;
  data?: any;
  meta?: {
    auto_added: boolean;
    managed_by_apps: boolean;
    managed_by_argo_tunnel: boolean;
  };
}

export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  development_mode: number;
  name_servers: string[];
  original_name_servers: string[];
  original_registrar: string;
  original_dnshost: string;
  modified_on: string;
  created_on: string;
  activated_on: string;
  meta: {
    step: number;
    custom_certificate_quota: number;
    page_rule_quota: number;
    phishing_detected: boolean;
    multiple_railguns_allowed: boolean;
  };
}

export interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{
    code: number;
    message: string;
  }>;
  messages: Array<{
    code: number;
    message: string;
  }>;
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    count: number;
    total_count: number;
    total_pages: number;
  };
}

class CloudflareService {
  private email: string;
  private apiKey: string;
  private zoneId: string;
  private baseUrl: string;
  private initialized: boolean = false;

  constructor() {
    // Don't initialize immediately - wait for env vars to be loaded
    this.email = '';
    this.apiKey = '';
    this.zoneId = '';
    this.baseUrl = 'https://api.cloudflare.com/client/v4';
  }

  private initialize() {
    if (this.initialized) return;
    
    this.email = process.env.CLOUDFLARE_EMAIL || '';
    this.apiKey = process.env.CLOUDFLARE_API_KEY || '';
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID || '';

    console.log('Cloudflare initialization:', {
      email: this.email ? `${this.email.substring(0, 5)}...` : 'NOT SET',
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT SET',
      zoneId: this.zoneId ? `${this.zoneId.substring(0, 8)}...` : 'NOT SET'
    });

    if (!this.email || !this.apiKey || !this.zoneId) {
      console.warn('Cloudflare credentials not configured properly');
    }
    
    this.initialized = true;
  }

  private async makeRequest<T>(endpoint: string, options: any = {}): Promise<CloudflareResponse<T>> {
    this.initialize(); // Initialize before making any request
    
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'X-Auth-Email': this.email,
      'X-Auth-Key': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'WPanel-CloudflareIntegration/1.0'
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      });

      const data = await response.json() as any;

      if (!response.ok) {
        console.error(`Cloudflare API error (${response.status}):`, data);
        throw new Error(`Cloudflare API error: ${response.status} - ${JSON.stringify(data.errors || data)}`);
      }

      return data as CloudflareResponse<T>;
    } catch (error) {
      console.error(`Error making Cloudflare API request to ${endpoint}:`, error);
      throw error;
    }
  }

  // Get zone details
  async getZone(): Promise<CloudflareZone> {
    const response = await this.makeRequest<CloudflareZone>(`/zones/${this.zoneId}`);
    
    if (!response.success) {
      throw new Error(`Failed to get zone: ${response.errors.map(e => e.message).join(', ')}`);
    }
    
    return response.result;
  }

  // List DNS records
  async listDNSRecords(type?: string, name?: string): Promise<CloudflareDNSRecord[]> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (name) params.append('name', name);
    
    const queryString = params.toString();
    const endpoint = `/zones/${this.zoneId}/dns_records${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<CloudflareDNSRecord[]>(endpoint);
    
    if (!response.success) {
      throw new Error(`Failed to list DNS records: ${response.errors.map(e => e.message).join(', ')}`);
    }
    
    return response.result;
  }

  // Get specific DNS record
  async getDNSRecord(recordId: string): Promise<CloudflareDNSRecord> {
    const response = await this.makeRequest<CloudflareDNSRecord>(`/zones/${this.zoneId}/dns_records/${recordId}`);
    
    if (!response.success) {
      throw new Error(`Failed to get DNS record: ${response.errors.map(e => e.message).join(', ')}`);
    }
    
    return response.result;
  }

  // Create DNS record
  async createDNSRecord(recordData: {
    type: string;
    name: string;
    content: string;
    ttl?: number;
    priority?: number;
    proxied?: boolean;
  }): Promise<CloudflareDNSRecord> {
    const data = {
      type: recordData.type,
      name: recordData.name,
      content: recordData.content,
      ttl: recordData.ttl || 1, // 1 = Auto
      ...(recordData.priority && { priority: recordData.priority }),
      ...(recordData.proxied !== undefined && { proxied: recordData.proxied })
    };

    const response = await this.makeRequest<CloudflareDNSRecord>(`/zones/${this.zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.success) {
      throw new Error(`Failed to create DNS record: ${response.errors.map(e => e.message).join(', ')}`);
    }
    
    return response.result;
  }

  // Update DNS record
  async updateDNSRecord(recordId: string, recordData: {
    type?: string;
    name?: string;
    content?: string;
    ttl?: number;
    priority?: number;
    proxied?: boolean;
  }): Promise<CloudflareDNSRecord> {
    const response = await this.makeRequest<CloudflareDNSRecord>(`/zones/${this.zoneId}/dns_records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(recordData)
    });
    
    if (!response.success) {
      throw new Error(`Failed to update DNS record: ${response.errors.map(e => e.message).join(', ')}`);
    }
    
    return response.result;
  }

  // Delete DNS record
  async deleteDNSRecord(recordId: string): Promise<{ id: string }> {
    const response = await this.makeRequest<{ id: string }>(`/zones/${this.zoneId}/dns_records/${recordId}`, {
      method: 'DELETE'
    });
    
    if (!response.success) {
      throw new Error(`Failed to delete DNS record: ${response.errors.map(e => e.message).join(', ')}`);
    }
    
    return response.result;
  }

  // Test connection to Cloudflare API
  async testConnection(): Promise<boolean> {
    try {
      await this.getZone();
      return true;
    } catch (error) {
      console.error('Cloudflare connection test failed:', error);
      return false;
    }
  }

  // Get account information
  async getAccountInfo() {
    return {
      email: this.email,
      zoneId: this.zoneId,
      baseUrl: this.baseUrl,
      isConnected: await this.testConnection()
    };
  }

  // Sync specific DNS record types (utility method)
  async syncDNSRecords(types: string[] = ['A', 'AAAA', 'CNAME', 'MX', 'TXT']): Promise<{
    total: number;
    byType: Record<string, number>;
    records: CloudflareDNSRecord[];
  }> {
    const allRecords: CloudflareDNSRecord[] = [];
    const byType: Record<string, number> = {};
    
    for (const type of types) {
      try {
        const records = await this.listDNSRecords(type);
        allRecords.push(...records);
        byType[type] = records.length;
      } catch (error) {
        console.error(`Failed to sync ${type} records:`, error);
        byType[type] = 0;
      }
    }
    
    return {
      total: allRecords.length,
      byType,
      records: allRecords
    };
  }
}

export const cloudflareService = new CloudflareService();
