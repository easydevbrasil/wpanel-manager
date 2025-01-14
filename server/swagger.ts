import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Documentação da API WPanel',
      version: '1.0.0',
      description: 'Documentação da API para WPanel - Sistema de Gerenciamento de Containers Docker',
      contact: {
        name: 'EasyDev Brasil',
        email: 'easydevbrasil@proton.me',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://wpanel.easydev.com.br' : 'http://localhost:8000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        sessionToken: {
          type: 'apiKey',
          in: 'header',
          name: 'session-token',
          description: 'Session token for authentication',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session',
          description: 'Session cookie for authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            error: {
              type: 'string',
              description: 'Detailed error information',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
              description: 'User role',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
          },
        },
        DockerContainer: {
          type: 'object',
          properties: {
            Id: {
              type: 'string',
              description: 'Container ID',
            },
            Names: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Container names',
            },
            Image: {
              type: 'string',
              description: 'Container image',
            },
            State: {
              type: 'string',
              enum: ['running', 'exited', 'created', 'restarting', 'removing', 'paused', 'dead'],
              description: 'Container state',
            },
            Status: {
              type: 'string',
              description: 'Container status description',
            },
            Ports: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Container port mappings',
            },
          },
        },
        ContainerStats: {
          type: 'object',
          properties: {
            cpu: {
              type: 'number',
              description: 'CPU usage percentage',
            },
            memory: {
              type: 'number',
              description: 'Memory usage percentage',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Stats timestamp',
            },
            raw: {
              type: 'object',
              description: 'Raw stats data from Docker',
            },
          },
        },
        NginxHost: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'Domain name',
            },
            configFile: {
              type: 'string',
              description: 'Nginx configuration file name',
            },
            sslEnabled: {
              type: 'boolean',
              description: 'SSL/TLS enabled status',
            },
            sslExpiry: {
              type: 'string',
              format: 'date-time',
              description: 'SSL certificate expiry date',
            },
          },
        },
        DNSRecord: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'DNS record ID',
            },
            type: {
              type: 'string',
              enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'],
              description: 'DNS record type',
            },
            name: {
              type: 'string',
              description: 'DNS record name',
            },
            content: {
              type: 'string',
              description: 'DNS record content/value',
            },
            ttl: {
              type: 'integer',
              description: 'Time to live in seconds',
            },
            proxied: {
              type: 'boolean',
              description: 'Cloudflare proxy status',
            },
          },
        },
        Expense: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Expense ID',
            },
            description: {
              type: 'string',
              description: 'Expense description',
            },
            amount: {
              type: 'number',
              description: 'Expense amount',
            },
            currency: {
              type: 'string',
              description: 'Currency code (e.g., BRL, USD)',
            },
            category: {
              type: 'string',
              description: 'Expense category',
            },
            paymentMethod: {
              type: 'string',
              description: 'Payment method used',
            },
            status: {
              type: 'string',
              enum: ['pending', 'paid', 'overdue'],
              description: 'Expense status',
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Expense date',
            },
            dueDate: {
              type: 'string',
              format: 'date',
              description: 'Due date for payment',
            },
          },
        },
        SystemStats: {
          type: 'object',
          properties: {
            cpu: {
              type: 'object',
              properties: {
                usage: {
                  type: 'number',
                  description: 'CPU usage percentage',
                },
                cores: {
                  type: 'integer',
                  description: 'Number of CPU cores',
                },
                model: {
                  type: 'string',
                  description: 'CPU model name',
                },
              },
            },
            memory: {
              type: 'object',
              properties: {
                total: {
                  type: 'number',
                  description: 'Total memory in bytes',
                },
                used: {
                  type: 'number',
                  description: 'Used memory in bytes',
                },
                free: {
                  type: 'number',
                  description: 'Free memory in bytes',
                },
                usagePercent: {
                  type: 'number',
                  description: 'Memory usage percentage',
                },
              },
            },
            disk: {
              type: 'object',
              properties: {
                total: {
                  type: 'number',
                  description: 'Total disk space in bytes',
                },
                used: {
                  type: 'number',
                  description: 'Used disk space in bytes',
                },
                free: {
                  type: 'number',
                  description: 'Free disk space in bytes',
                },
                usagePercent: {
                  type: 'number',
                  description: 'Disk usage percentage',
                },
              },
            },
            uptime: {
              type: 'number',
              description: 'System uptime in seconds',
            },
          },
        },
      },
    },
    security: [
      {
        sessionToken: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./server/routes.ts'], // Caminho para os arquivos com anotações JSDoc
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  // Swagger UI
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WPanel API Documentation',
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  }));

  // Swagger JSON endpoint
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}

export { specs };