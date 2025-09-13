// @ts-ignore
import fetch from 'node-fetch';

export interface AsaasPayment {
  id: string;
  object: string;
  dateCreated: string;
  customer: string;
  customerName?: string;
  paymentLink?: string;
  value: number;
  netValue?: number;
  originalValue?: number;
  interestValue?: number;
  description: string;
  billingType: string;
  pixTransaction?: any;
  status: string;
  dueDate: string;
  originalDueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  transactionReceiptUrl?: string;
  nossoNumero?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  invoiceNumber?: string;
}

export interface AsaasBalance {
  totalBalance: number;
}

export interface AsaasPaymentsList {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasPayment[];
}

class AsaasService {
  private apiKey: string;
  private baseUrl: string;
  private walletId: string;
  private initialized: boolean = false;

  constructor() {
    // Don't initialize immediately - wait for env vars to be loaded
    this.apiKey = '';
    this.walletId = '';
    this.baseUrl = '';
  }

  private initialize() {
    if (this.initialized) return;
    
    this.apiKey = process.env.ASAAS_API_KEY || '';
    this.walletId = process.env.ASAAS_WALLET_ID || '';
    
    // Determine base URL based on mode (sandbox or production)
    const mode = process.env.ASAAS_API_MODE || 'sandbox';
    this.baseUrl = mode === 'production' 
      ? 'https://api.asaas.com/v3' 
      : 'https://sandbox.asaas.com/api/v3';

    if (!this.apiKey || !this.walletId) {
      console.warn('Asaas API credentials not configured properly');
    }
    
    this.initialized = true;
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    this.initialize(); // Initialize before making any request
    
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'access_token': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'WPanel-AsaasIntegration/1.0'
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Asaas API error (${response.status}):`, errorText);
        throw new Error(`Asaas API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error making Asaas API request to ${endpoint}:`, error);
      throw error;
    }
  }

  async getPayments(limit: number = 50, offset: number = 0): Promise<AsaasPaymentsList> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    return await this.makeRequest(`/payments?${params}`);
  }

  async getBalance(): Promise<AsaasBalance> {
    return await this.makeRequest('/finance/balance');
  }

  async getPaymentById(paymentId: string): Promise<AsaasPayment> {
    return await this.makeRequest(`/payments/${paymentId}`);
  }

  async getPaymentsByStatus(status: string, limit: number = 50): Promise<AsaasPaymentsList> {
    const params = new URLSearchParams({
      status,
      limit: limit.toString()
    });

    return await this.makeRequest(`/payments?${params}`);
  }

  async getPaymentsByDateRange(dateFrom: string, dateTo: string, limit: number = 50): Promise<AsaasPaymentsList> {
    const params = new URLSearchParams({
      dateCreated: `[gte]${dateFrom}[lte]${dateTo}`,
      limit: limit.toString()
    });

    return await this.makeRequest(`/payments?${params}`);
  }

  // Calculate stats from payments data
  calculateStats(payments: AsaasPayment[]) {
    const stats = {
      totalReceived: 0,
      totalPending: 0,
      totalOverdue: 0,
      totalCanceled: 0,
      totalRefunded: 0
    };

    payments.forEach(payment => {
      switch (payment.status.toLowerCase()) {
        case 'received':
        case 'confirmed':
          stats.totalReceived += payment.value;
          break;
        case 'pending':
        case 'awaiting_payment':
          stats.totalPending += payment.value;
          break;
        case 'overdue':
          stats.totalOverdue += payment.value;
          break;
        case 'canceled':
          stats.totalCanceled += payment.value;
          break;
        case 'refunded':
          stats.totalRefunded += payment.value;
          break;
      }
    });

    return stats;
  }

  // Test connection to Asaas API
  async testConnection(): Promise<boolean> {
    try {
      await this.getBalance();
      return true;
    } catch (error) {
      console.error('Asaas connection test failed:', error);
      return false;
    }
  }

  // Get account information
  async getAccountInfo() {
    return {
      walletId: this.walletId,
      apiMode: process.env.ASAAS_API_MODE || 'sandbox',
      baseUrl: this.baseUrl,
      isConnected: await this.testConnection()
    };
  }

  // Create a new customer
  async createCustomer(customerData: {
    name: string;
    email: string;
    phone?: string;
    cpfCnpj?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  }) {
    return await this.makeRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  }

  // Create a new payment/charge
  async createPayment(paymentData: {
    customer: string;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
    value: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
    installmentCount?: number;
    installmentValue?: number;
    discount?: {
      value: number;
      dueDateLimitDays: number;
    };
    fine?: {
      value: number;
    };
    interest?: {
      value: number;
    };
    postalService?: boolean;
  }) {
    return await this.makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  // Get customer by ID
  async getCustomer(customerId: string) {
    return await this.makeRequest(`/customers/${customerId}`);
  }

  // List customers
  async getCustomers(limit: number = 50, offset: number = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    return await this.makeRequest(`/customers?${params}`);
  }

  // Update payment status
  async updatePayment(paymentId: string, updateData: any) {
    return await this.makeRequest(`/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  // Cancel payment
  async cancelPayment(paymentId: string) {
    return await this.makeRequest(`/payments/${paymentId}`, {
      method: 'DELETE'
    });
  }

  // Get payment statistics for dashboard
  async getPaymentStats() {
    try {
      const payments = await this.getPayments(1000); // Get more payments for accurate stats
      return this.calculateStats(payments.data);
    } catch (error) {
      console.error('Error getting payment stats:', error);
      return {
        totalReceived: 0,
        totalPending: 0,
        totalOverdue: 0,
        totalCanceled: 0,
        totalRefunded: 0
      };
    }
  }
}

export const asaasService = new AsaasService();
