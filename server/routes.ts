// Route to list nginx hosts from directory specified in .env
// This route must be defined after authenticateToken is declared
import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage as dbStorage } from "./storage";
import { cloudflareService } from "./cloudflare";
import { evolutionService } from "./evolution";

import { initializeTaskScheduler, getTaskScheduler, taskScheduler } from "./scheduler";
import { db } from "./db";
import MinioService from "./minio";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import multer from "multer";
import { spawn, exec } from "child_process";
import { promisify } from "util";
import os from "os";
import Docker from "dockerode";

// Helper function to detect Linux distribution
async function getLinuxDistribution(): Promise<string> {
  try {
    if (os.platform() !== 'linux') {
      return os.platform();
    }

    // Try to read /etc/os-release first
    if (fs.existsSync('/etc/os-release')) {
      const osRelease = await fs.promises.readFile('/etc/os-release', 'utf8');
      const lines = osRelease.split('\n');

      let distro = '';
      let codename = '';

      for (const line of lines) {
        if (line.startsWith('ID=')) {
          distro = line.split('=')[1].replace(/"/g, '').toLowerCase();
        }
        if (line.startsWith('VERSION_CODENAME=')) {
          codename = line.split('=')[1].replace(/"/g, '');
        }
      }

      if (distro && codename) {
        return `${distro} ${codename}`;
      } else if (distro) {
        return distro;
      }
    }

    // Fallback to other detection methods
    if (fs.existsSync('/etc/debian_version')) {
      return 'debian';
    }
    if (fs.existsSync('/etc/redhat-release')) {
      return 'rhel';
    }
    if (fs.existsSync('/etc/SuSE-release')) {
      return 'suse';
    }
    if (fs.existsSync('/etc/arch-release')) {
      return 'arch';
    }

    return 'linux';
  } catch (error) {
    console.error('Error detecting Linux distribution:', error);
    return 'linux';
  }
}

// Helper function to measure CPU usage
function getCpuUsageMeasure() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type as keyof typeof cpu.times];
    }
    idle += cpu.times.idle;
  }

  return { idle, total };
}

// Add CPU usage calculation helper
function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = getCpuUsageMeasure();
    setTimeout(() => {
      const endMeasure = getCpuUsageMeasure();
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;

      if (totalDifference === 0) {
        resolve(0);
        return;
      }

      const cpuPercentage = Math.max(0, Math.min(100,
        Math.round(100 - (100 * idleDifference) / totalDifference)
      ));

      resolve(cpuPercentage);
    }, 500); // Reduced timeout for more responsive updates
  });
}

// Function to get real disk usage
function getDiskUsage(): Promise<{ total: number; used: number; free: number; usagePercent: number }> {
  return new Promise((resolve, reject) => {
    // First get total disk size using lsblk
    exec("lsblk | grep 'disk' | awk '{print $4}'", (lsblkError, lsblkStdout, lsblkStderr) => {
      if (lsblkError) {
        console.error('Error getting disk size with lsblk:', lsblkError);
        // Fallback to df command
        exec('df -B1 /', (error, stdout, stderr) => {
          if (error) {
            console.error('Error getting disk usage:', error);
            // Fallback to mock data if command fails
            resolve({
              total: 100 * 1024 * 1024 * 1024, // 100GB
              used: 50 * 1024 * 1024 * 1024,   // 50GB
              free: 50 * 1024 * 1024 * 1024,   // 50GB
              usagePercent: 50
            });
            return;
          }

          try {
            const lines = stdout.trim().split('\n');
            if (lines.length < 2) {
              throw new Error('Invalid df output');
            }

            // Parse the output (second line contains the data)
            const data = lines[1].split(/\s+/);
            const total = parseInt(data[1]);
            const used = parseInt(data[2]);
            const free = parseInt(data[3]);
            const usagePercent = Math.round((used / total) * 100);

            resolve({
              total,
              used,
              free,
              usagePercent
            });
          } catch (parseError) {
            console.error('Error parsing disk usage:', parseError);
            // Fallback to mock data if parsing fails
            resolve({
              total: 100 * 1024 * 1024 * 1024, // 100GB
              used: 50 * 1024 * 1024 * 1024,   // 50GB
              free: 50 * 1024 * 1024 * 1024,   // 50GB
              usagePercent: 50
            });
          }
        });
        return;
      }

      try {
        // Parse lsblk output to get total disk size
        const diskSizes = lsblkStdout.trim().split('\n').filter(line => line.trim());
        let totalDiskSize = 0;

        for (const sizeStr of diskSizes) {
          if (sizeStr.trim()) {
            // Convert size string to bytes (e.g., "500G" -> bytes)
            const size = parseDiskSize(sizeStr.trim());
            totalDiskSize += size;
          }
        }

        // Now get usage information from df
        exec('df -B1 /', (dfError, dfStdout, dfStderr) => {
          if (dfError) {
            console.error('Error getting disk usage with df:', dfError);
            resolve({
              total: totalDiskSize,
              used: Math.round(totalDiskSize * 0.5), // Assume 50% used as fallback
              free: Math.round(totalDiskSize * 0.5),
              usagePercent: 50
            });
            return;
          }

          try {
            const lines = dfStdout.trim().split('\n');
            if (lines.length < 2) {
              throw new Error('Invalid df output');
            }

            // Parse the df output for usage info
            const data = lines[1].split(/\s+/);
            const used = parseInt(data[2]);
            const free = parseInt(data[3]);
            const usagePercent = Math.round((used / totalDiskSize) * 100);

            resolve({
              total: totalDiskSize,
              used,
              free,
              usagePercent
            });
          } catch (parseError) {
            console.error('Error parsing df output:', parseError);
            resolve({
              total: totalDiskSize,
              used: Math.round(totalDiskSize * 0.5),
              free: Math.round(totalDiskSize * 0.5),
              usagePercent: 50
            });
          }
        });
      } catch (parseError) {
        console.error('Error parsing lsblk output:', parseError);
        // Fallback to original df method
        exec('df -B1 /', (error, stdout, stderr) => {
          if (error) {
            console.error('Error getting disk usage:', error);
            resolve({
              total: 100 * 1024 * 1024 * 1024, // 100GB
              used: 50 * 1024 * 1024 * 1024,   // 50GB
              free: 50 * 1024 * 1024 * 1024,   // 50GB
              usagePercent: 50
            });
            return;
          }

          try {
            const lines = stdout.trim().split('\n');
            if (lines.length < 2) {
              throw new Error('Invalid df output');
            }

            const data = lines[1].split(/\s+/);
            const total = parseInt(data[1]);
            const used = parseInt(data[2]);
            const free = parseInt(data[3]);
            const usagePercent = Math.round((used / total) * 100);

            resolve({
              total,
              used,
              free,
              usagePercent
            });
          } catch (parseError) {
            console.error('Error parsing disk usage:', parseError);
            resolve({
              total: 100 * 1024 * 1024 * 1024, // 100GB
              used: 50 * 1024 * 1024 * 1024,   // 50GB
              free: 50 * 1024 * 1024 * 1024,   // 50GB
              usagePercent: 50
            });
          }
        });
      }
    });
  });
}

// Helper function to round memory to nearest GB
function roundMemoryToGB(bytes: number): number {
  const gb = bytes / (1024 * 1024 * 1024);
  return Math.round(gb) * (1024 * 1024 * 1024);
}

// Helper function to parse disk size strings like "500G", "2T", etc.
function parseDiskSize(sizeStr: string): number {
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?)$/i);
  if (!match) {
    return 0;
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers: { [key: string]: number } = {
    '': 1,
    'K': 1024,
    'M': 1024 * 1024,
    'G': 1024 * 1024 * 1024,
    'T': 1024 * 1024 * 1024 * 1024
  };

  return Math.round(value * (multipliers[unit] || 1));
}

// Function to get swap usage
function getSwapUsage(): Promise<{ total: number; used: number; free: number; usagePercent: number }> {
  return new Promise((resolve) => {
    exec('free -b', (error, stdout, stderr) => {
      if (error) {
        console.error('Error getting swap usage:', error);
        resolve({
          total: 0,
          used: 0,
          free: 0,
          usagePercent: 0
        });
        return;
      }

      try {
        const lines = stdout.trim().split('\n');
        const swapLine = lines.find(line => line.startsWith('Swap:'));

        if (!swapLine) {
          resolve({
            total: 0,
            used: 0,
            free: 0,
            usagePercent: 0
          });
          return;
        }

        const data = swapLine.split(/\s+/);
        const total = parseInt(data[1]);
        const used = parseInt(data[2]);
        const free = parseInt(data[3]);
        const usagePercent = total > 0 ? Math.round((used / total) * 100) : 0;

        resolve({
          total,
          used,
          free,
          usagePercent
        });
      } catch (parseError) {
        console.error('Error parsing swap usage:', parseError);
        resolve({
          total: 0,
          used: 0,
          free: 0,
          usagePercent: 0
        });
      }
    });
  });
}

// Cache for Proton Drive data (updated every 30 seconds)
let protonDriveCache: { total: number; used: number; free: number; usagePercent: number } | null = null;
let protonDriveCacheTime = 0;
const PROTON_CACHE_DURATION = 5000; // 5 seconds

// Memory and CPU history for charts
let cpuHistory: number[] = [];
let ramHistory: number[] = [];
let networkHistory: { rx: number; tx: number }[] = [];
const MAX_HISTORY_LENGTH = 20; // Keep last 20 data points

// Network stats tracking
let lastNetworkStats = { rx: 0, tx: 0, timestamp: 0 };
let totalNetworkStats = { rxTotal: 0, txTotal: 0 };

// Function to get network usage
function getNetworkUsage(): Promise<{ rx: number; tx: number }> {
  return new Promise((resolve) => {
    exec('cat /proc/net/dev', (error, stdout, stderr) => {
      if (error) {
        console.error('Error getting network stats:', error);
        resolve({ rx: 0, tx: 0 });
        return;
      }

      try {
        const lines = stdout.trim().split('\n');
        let totalRx = 0;
        let totalTx = 0;

        // Skip header lines and parse interface stats
        for (let i = 2; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line && !line.includes('lo:')) { // Skip loopback interface
            const parts = line.split(/\s+/);
            if (parts.length >= 10) {
              const interfaceName = parts[0].replace(':', '');
              // Skip virtual interfaces
              if (!interfaceName.includes('docker') && !interfaceName.includes('veth') && !interfaceName.includes('br-')) {
                totalRx += parseInt(parts[1]) || 0; // Received bytes
                totalTx += parseInt(parts[9]) || 0; // Transmitted bytes
              }
            }
          }
        }

        const now = Date.now();
        const timeDiff = (now - lastNetworkStats.timestamp) / 1000; // seconds

        let rxRate = 0;
        let txRate = 0;

        if (lastNetworkStats.timestamp > 0 && timeDiff > 0) {
          const rxDiff = totalRx - lastNetworkStats.rx;
          const txDiff = totalTx - lastNetworkStats.tx;
          rxRate = Math.max(0, Math.round(rxDiff / timeDiff / 1024)); // KB/s
          txRate = Math.max(0, Math.round(txDiff / timeDiff / 1024)); // KB/s
        }

        lastNetworkStats = { rx: totalRx, tx: totalTx, timestamp: now };

        // Update total accumulated stats
        if (rxRate > 0) totalNetworkStats.rxTotal += rxRate * 2; // 2 seconds interval
        if (txRate > 0) totalNetworkStats.txTotal += txRate * 2;

        resolve({ rx: rxRate, tx: txRate });
      } catch (parseError) {
        console.error('Error parsing network stats:', parseError);
        resolve({ rx: 0, tx: 0 });
      }
    });
  });
}

// Update history arrays
function updateSystemHistory() {
  getCpuUsage().then(cpu => {
    cpuHistory.push(cpu);
    if (cpuHistory.length > MAX_HISTORY_LENGTH) {
      cpuHistory.shift();
    }
  });

  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const ramUsage = Math.round((usedMemory / totalMemory) * 100);

  ramHistory.push(ramUsage);
  if (ramHistory.length > MAX_HISTORY_LENGTH) {
    ramHistory.shift();
  }

  getNetworkUsage().then(network => {
    networkHistory.push(network);
    if (networkHistory.length > MAX_HISTORY_LENGTH) {
      networkHistory.shift();
    }
  });

  // Clean up old container stats cache entries (older than 30 seconds)
  const now = Date.now();
  const maxCacheAge = 30000; // 30 seconds
  Object.keys(containerStatsCache).forEach(containerId => {
    if (now - containerStatsCache[containerId].timestamp > maxCacheAge) {
      delete containerStatsCache[containerId];
    }
  });
}

// Start updating history every 2 seconds
setInterval(updateSystemHistory, 2000);

// Function to get Proton Drive usage
function getProtonDriveUsage(): Promise<{ total: number; used: number; free: number; usagePercent: number }> {
  return new Promise((resolve) => {
    const now = Date.now();

    // Return cached data if it's still valid
    if (protonDriveCache && (now - protonDriveCacheTime) < PROTON_CACHE_DURATION) {
      resolve(protonDriveCache);
      return;
    }

    const configFile = process.env.PROTON_CONFIG_FILE || '/docker/config/rclone.conf';

    // Get total storage
    const instance = process.env.PROTONDRIVE_INSTANCE || 'proton';
    exec(`rclone about ${instance}: --json --config ${configFile}`, (error, stdout, stderr) => {
      if (error) {
        console.error('Error getting Proton Drive info:', error);
        const fallbackData = {
          total: 0,
          used: 0,
          free: 0,
          usagePercent: 0
        };
        protonDriveCache = fallbackData;
        protonDriveCacheTime = now;
        resolve(fallbackData);
        return;
      }
      try {
        const info = JSON.parse(stdout);
        // rclone about --json output example:
        // { "total": 21474836480, "used": 1234567890, "free": 20240268590 }
        const total = typeof info.total === 'number' ? info.total : 0;
        const used = typeof info.used === 'number' ? info.used : 0;
        const free = typeof info.free === 'number' ? info.free : (total - used);
        const usagePercent = total > 0 ? Math.round((used / total) * 100) : 0;
        const data = { total, used, free, usagePercent };
        protonDriveCache = data;
        protonDriveCacheTime = now;
        resolve(data);
      } catch (parseError) {
        console.error('Error parsing Proton Drive usage:', parseError);
        const fallbackData = {
          total: 0,
          used: 0,
          free: 0,
          usagePercent: 0
        };
        protonDriveCache = fallbackData;
        protonDriveCacheTime = now;
        resolve(fallbackData);
      }
    });
  });
}

// Helper function to parse Proton Drive size strings like "200GiB", "6.638GiB", etc.
function parseProtonDriveSize(sizeStr: string): number {
  if (!sizeStr || sizeStr.trim() === '') {
    return 0;
  }

  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(GiB|MiB|TiB|KiB|B)?$/i);
  if (!match) {
    return 0;
  }

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();

  const multipliers: { [key: string]: number } = {
    'B': 1,
    'KIB': 1024,
    'MIB': 1024 * 1024,
    'GIB': 1024 * 1024 * 1024,
    'TIB': 1024 * 1024 * 1024 * 1024
  };

  return Math.round(value * (multipliers[unit] || 1));
}

// Function to generate mail_accounts.cf file
async function generateMailAccountsFile() {
  try {
    const accounts = await dbStorage.getEmailAccounts();
    const lines = accounts.map((account) => {
      // Format password with {ARGON2ID} prefix for Postfix compatibility
      // If password already has the prefix, use as is, otherwise add it
      let formattedPassword = account.password;
      if (!formattedPassword.startsWith('{ARGON2ID}')) {
        formattedPassword = `{ARGON2ID}${formattedPassword}`;
      }
      return `${account.email}|${formattedPassword}`;
    });

    const filePath = process.env.POSTFIX_MAIL_ACCOUNTS_FILE || "./mail_accounts.cf";
    const content = lines.join("\n") + "\n";

    await fs.promises.writeFile(filePath, content, "utf8");
    console.log(`Generated mail_accounts.cf with ${accounts.length} accounts`);
  } catch (error) {
    console.error("Error generating mail_accounts.cf:", error);
  }
}

// Global variable to track mailserver restart status
let isRestartingMailserver = false;

// Function to restart mailserver container
async function restartMailserverContainer() {
  if (isRestartingMailserver) {
    console.log("Mailserver restart already in progress, skipping...");
    return;
  }

  try {
    isRestartingMailserver = true;
    const docker = new Docker({ socketPath: "/var/run/docker.sock" });

    // List all containers to find the mailserver
    const containers = await docker.listContainers({ all: true });
    const mailserverContainer = containers.find((container: any) =>
      container.Names.some((name: string) => name.includes("mailserver")) ||
      container.Image.includes("mailserver") ||
      container.Image.includes("postfix") ||
      container.Image.includes("dovecot")
    );

    if (!mailserverContainer) {
      console.log("Mailserver container not found");
      return;
    }

    console.log(`Restarting mailserver container: ${mailserverContainer.Id}`);

    // Get container object and restart it
    const containerObj = docker.getContainer(mailserverContainer.Id);
    await containerObj.restart();

    console.log("Mailserver container restarted successfully using Docker socket");
  } catch (error) {
    console.error("Error restarting mailserver container:", error);
  } finally {
    isRestartingMailserver = false;
  }
}

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
  const userAgent = req.get("User-Agent") || "unknown";

  // Try to get token from different sources (cookies first, then headers)
  let token =
    req.cookies.sessionToken ||
    req.headers["authorization"]?.split(" ")[1] ||
    req.headers["session-token"];

  if (!token) {
    // Try to refresh token if session token is missing but refresh token exists
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const result = await dbStorage.refreshSession(
          refreshToken,
          ipAddress,
          userAgent,
        );
        if (result) {
          // Set new cookies
          const isProduction = process.env.NODE_ENV === "production";

          res.cookie("sessionToken", result.sessionToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            maxAge: 4 * 60 * 60 * 1000, // 4 hours
            path: "/",
          });

          res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: "/",
          });

          token = result.sessionToken;
        }
      } catch (refreshError) {
        console.error("Auto-refresh failed:", refreshError);
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Token de acesso requerido" });
    }
  }

  try {
    const session = await dbStorage.validateSession(token, ipAddress);
    if (!session) {
      // Clear invalid cookies
      res.clearCookie("sessionToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
      });

      return res.status(401).json({ message: "Sessão inválida ou expirada" });
    }
    req.user = session.user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(403).json({ message: "Token inválido" });
  }
};

// Configurar multer para upload de imagens (legado - local)
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

// Configurar multer para upload temporário antes do MinIO
const tempStorage = multer.memoryStorage();

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos de imagem são permitidos!"));
    }
  },
});

// Upload para MinIO - aceita vários tipos de arquivo
const uploadToMinio = multer({
  storage: tempStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Aceitar imagens, PDFs e documentos
    const allowedTypes = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não permitido!"));
    }
  },
});

const execAsync = promisify(exec);

// Função para executar comandos Docker via child_process
async function runDockerCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    console.log(`Executing Docker command: docker ${command}`);
    const { stdout, stderr } = await execAsync(`docker ${command}`, {
      timeout: 60000, // 60 seconds timeout for container operations
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });
    return { stdout, stderr };
  } catch (error: any) {
    console.error(`Docker command failed: docker ${command}`, error);
    throw new Error(`Docker command failed: ${error.message}`);
  }
}

// Função para listar containers Docker
async function listDockerContainers(): Promise<any[]> {
  try {
    const docker = new Docker({ socketPath: "/var/run/docker.sock" });
    const containers = await docker.listContainers({ all: true });
    return containers;
  } catch (error) {
    console.error("Failed to list Docker containers with Dockerode:", error);
    // Fallback to mock containers if Dockerode fails
    return getMockContainers();
  }
}

// Função para obter containers mock quando Docker não está disponível
function getMockContainers() {
  return [
    {
      Id: "mock-nginx-001",
      Names: ["/nginx-web-server"],
      Image: "nginx:alpine",
      ImageID: "sha256:abcd1234",
      Command: "nginx -g 'daemon off;'",
      Created: Math.floor(Date.now() / 1000) - 3600,
      Ports: [
        {
          IP: "0.0.0.0",
          PrivatePort: 80,
          PublicPort: 8080,
          Type: "tcp"
        }
      ],
      Labels: {
        "com.docker.compose.service": "web",
        "description": "NGINX web server"
      },
      State: "running",
      Status: "Up 1 hour",
      HostConfig: { NetworkMode: "bridge" },
      NetworkSettings: { Networks: { bridge: {} } },
      Mounts: [
        {
          Type: "bind",
          Source: "/var/www/html",
          Destination: "/usr/share/nginx/html",
          Mode: "rw",
          RW: true,
          Propagation: "rprivate"
        }
      ],
    },
    {
      Id: "mock-postgres-002",
      Names: ["/postgres-db"],
      Image: "postgres:15-alpine",
      ImageID: "sha256:efgh5678",
      Command: "docker-entrypoint.sh postgres",
      Created: Math.floor(Date.now() / 1000) - 7200,
      Ports: [
        {
          IP: "0.0.0.0",
          PrivatePort: 5432,
          PublicPort: 5432,
          Type: "tcp"
        }
      ],
      Labels: {
        "com.docker.compose.service": "database",
        "description": "PostgreSQL database"
      },
      State: "running",
      Status: "Up 2 hours",
      HostConfig: { NetworkMode: "bridge" },
      NetworkSettings: { Networks: { bridge: {} } },
      Mounts: [
        {
          Type: "volume",
          Source: "postgres_data",
          Destination: "/var/lib/postgresql/data",
          Mode: "rw",
          RW: true,
          Propagation: "rprivate"
        }
      ],
    },
    {
      Id: "mock-redis-003",
      Names: ["/redis-cache"],
      Image: "redis:7-alpine",
      ImageID: "sha256:ijkl9012",
      Command: "redis-server",
      Created: Math.floor(Date.now() / 1000) - 1800,
      Ports: [
        {
          IP: "127.0.0.1",
          PrivatePort: 6379,
          PublicPort: 6379,
          Type: "tcp"
        }
      ],
      Labels: {
        "com.docker.compose.service": "cache",
        "description": "Redis cache server"
      },
      State: "exited",
      Status: "Exited (0) 30 minutes ago",
      HostConfig: { NetworkMode: "bridge" },
      NetworkSettings: { Networks: { bridge: {} } },
      Mounts: [],
    }
  ];
}

// Cache for container stats (updated every 2 seconds to match frontend refresh)
interface ContainerStatsCache {
  [containerId: string]: {
    data: any;
    timestamp: number;
  };
}

let containerStatsCache: ContainerStatsCache = {};
const CONTAINER_STATS_CACHE_DURATION = 1500; // 1.5 seconds cache

// Função para obter estatísticas reais do container
async function getContainerStats(containerId: string): Promise<any> {
  const now = Date.now();

  // Check cache first
  const cached = containerStatsCache[containerId];
  if (cached && (now - cached.timestamp) < CONTAINER_STATS_CACHE_DURATION) {
    return { ...cached.data, cached: true };
  }

  try {
    // Try using dockerode first
    const docker = new Docker({ socketPath: "/var/run/docker.sock" });
    const container = docker.getContainer(containerId);

    // Get container stats
    const stats = await container.stats({ stream: false });

    // Calculate CPU usage percentage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const numberOfCpus = stats.cpu_stats.online_cpus || Object.keys(stats.cpu_stats.cpu_usage.percpu_usage || {}).length;

    let cpuPercent = 0;
    if (systemDelta > 0 && cpuDelta > 0) {
      cpuPercent = (cpuDelta / systemDelta) * numberOfCpus * 100;
    }

    // Calculate memory usage percentage
    const memoryUsage = stats.memory_stats.usage || 0;
    const memoryLimit = stats.memory_stats.limit || 0;
    const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

    const result = {
      cpu: Math.min(Math.max(cpuPercent, 0), 100),
      memory: Math.min(Math.max(memoryPercent, 0), 100),
      timestamp: new Date().toISOString(),
      raw: {
        cpuUsage: memoryUsage,
        memoryLimit: memoryLimit,
        numberOfCpus: numberOfCpus
      }
    };

    // Cache the result
    containerStatsCache[containerId] = {
      data: result,
      timestamp: now
    };

    return result;
  } catch (dockerodeError) {
    console.log("Dockerode failed, trying docker stats command:", dockerodeError);

    // Fallback to docker stats command
    try {
      const { stdout } = await runDockerCommand(`stats ${containerId} --no-stream --format "{{.CPUPerc}},{{.MemPerc}}"`);
      const [cpuStr, memStr] = stdout.trim().split(',');

      const cpu = parseFloat(cpuStr.replace('%', '')) || 0;
      const memory = parseFloat(memStr.replace('%', '')) || 0;

      const result = {
        cpu: Math.min(Math.max(cpu, 0), 100),
        memory: Math.min(Math.max(memory, 0), 100),
        timestamp: new Date().toISOString(),
        source: 'docker_command'
      };

      // Cache the result
      containerStatsCache[containerId] = {
        data: result,
        timestamp: now
      };

      return result;
    } catch (commandError) {
      console.error("Docker stats command also failed:", commandError);

      // Last fallback: return mock data with indication (don't cache mock data)
      return {
        cpu: Math.random() * 40 + 20,
        memory: Math.random() * 50 + 25,
        timestamp: new Date().toISOString(),
        mock: true,
        error: 'Docker stats unavailable'
      };
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize task scheduler
  console.log('Initializing task scheduler...');
  const scheduler = initializeTaskScheduler();
  console.log(`Task scheduler initialized with ${scheduler.getScheduledTasksCount()} tasks`);

  // Server port
  const port = process.env.PORT || 8000;

  // Serve uploaded files statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Upload routes
  app.post(
    "/api/upload/container-logo",
    authenticateToken,
    uploadToMinio.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const { containerId, containerName } = req.body;
        if (!containerId) {
          return res.status(400).json({ message: "Container ID é obrigatório" });
        }

        // Upload to MinIO
        const objectName = MinioService.generateObjectName('general', req.file.originalname);
        await MinioService.uploadBuffer(
          req.file.buffer,
          objectName,
          req.file.mimetype
        );

        // Generate presigned URL for long-term access
        const presignedUrl = await MinioService.getPresignedUrl(objectName, ); // 1 year

        // Save/update container logo in database
        const { containerLogos } = await import("../shared/schema");
        await db.insert(containerLogos)
          .values({
            containerId: containerId,
            logoUrl: presignedUrl,
            originalName: containerName || null,
          })
          .onConflictDoUpdate({
            target: containerLogos.containerId,
            set: {
              logoUrl: presignedUrl,
              originalName: containerName || null,
              updatedAt: new Date(),
            }
          });

        res.json({
          url: presignedUrl,
          filename: req.file.originalname,
          containerId: containerId,
          objectName: objectName
        });
      } catch (error) {
        console.error("Error uploading container logo:", error);
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  app.post(
    "/api/upload/product-image",
    authenticateToken,
    uploadToMinio.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const objectName = MinioService.generateObjectName('products', req.file.originalname);
        await MinioService.uploadBuffer(req.file.buffer, objectName, req.file.mimetype);
        const presignedUrl = await MinioService.getPresignedUrl(objectName, );

        res.json({ url: presignedUrl, filename: req.file.originalname, objectName });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  app.post(
    "/api/upload/client-image",
    uploadToMinio.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const objectName = MinioService.generateObjectName('clients', req.file.originalname);
        await MinioService.uploadBuffer(req.file.buffer, objectName, req.file.mimetype);
        const presignedUrl = await MinioService.getPresignedUrl(objectName, );

        res.json({ url: presignedUrl, filename: req.file.originalname, objectName });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  app.post(
    "/api/upload/supplier-image",
    uploadToMinio.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const objectName = MinioService.generateObjectName('suppliers', req.file.originalname);
        await MinioService.uploadBuffer(req.file.buffer, objectName, req.file.mimetype);
        const presignedUrl = await MinioService.getPresignedUrl(objectName, );

        res.json({ url: presignedUrl, filename: req.file.originalname, objectName });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  app.post(
    "/api/upload/category-image",
    uploadToMinio.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const objectName = MinioService.generateObjectName('general', req.file.originalname);
        await MinioService.uploadBuffer(req.file.buffer, objectName, req.file.mimetype);
        const presignedUrl = await MinioService.getPresignedUrl(objectName, );

        res.json({ url: presignedUrl, filename: req.file.originalname, objectName });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  app.post(
    "/api/upload/manufacturer-image",
    uploadToMinio.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const objectName = MinioService.generateObjectName('general', req.file.originalname);
        await MinioService.uploadBuffer(req.file.buffer, objectName, req.file.mimetype);
        const presignedUrl = await MinioService.getPresignedUrl(objectName, );

        res.json({ url: presignedUrl, filename: req.file.originalname, objectName });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  app.post(
    "/api/upload/provider-image",
    authenticateToken,
    uploadToMinio.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const objectName = MinioService.generateObjectName('general', req.file.originalname);
        await MinioService.uploadBuffer(req.file.buffer, objectName, req.file.mimetype);
        const presignedUrl = await MinioService.getPresignedUrl(objectName, );

        res.json({ url: presignedUrl, filename: req.file.originalname, objectName });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  // Resource image upload
  app.post(
    "/api/upload/resource-image",
    authenticateToken,
    uploadToMinio.single("image"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhuma imagem enviada" });
        }

        res.json({ url: req.file.path });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  // MinIO Upload Routes
  app.post(
    "/api/minio/upload/product",
    authenticateToken,
    uploadToMinio.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const objectName = MinioService.generateObjectName('products', req.file.originalname);
        const uploadedPath = await MinioService.uploadBuffer(
          req.file.buffer,
          objectName,
          req.file.mimetype
        );

        // Generate presigned URL for access
        const presignedUrl = await MinioService.getPresignedUrl(uploadedPath, 24 * 60 * 60); // 24 hours

        res.json({
          success: true,
          objectName: uploadedPath,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          presignedUrl
        });
      } catch (error) {
        console.error('[MinIO] Product upload error:', error);
        res.status(500).json({ message: "Falha no upload do arquivo" });
      }
    }
  );

  app.post(
    "/api/minio/upload/client",
    authenticateToken,
    uploadToMinio.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const objectName = MinioService.generateObjectName('clients', req.file.originalname);
        const uploadedPath = await MinioService.uploadBuffer(
          req.file.buffer,
          objectName,
          req.file.mimetype
        );

        const presignedUrl = await MinioService.getPresignedUrl(uploadedPath, 24 * 60 * 60);

        res.json({
          success: true,
          objectName: uploadedPath,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          presignedUrl
        });
      } catch (error) {
        console.error('[MinIO] Client upload error:', error);
        res.status(500).json({ message: "Falha no upload do arquivo" });
      }
    }
  );

  app.post(
    "/api/minio/upload/supplier",
    authenticateToken,
    uploadToMinio.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const objectName = MinioService.generateObjectName('suppliers', req.file.originalname);
        const uploadedPath = await MinioService.uploadBuffer(
          req.file.buffer,
          objectName,
          req.file.mimetype
        );

        const presignedUrl = await MinioService.getPresignedUrl(uploadedPath, 24 * 60 * 60);

        res.json({
          success: true,
          objectName: uploadedPath,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          presignedUrl
        });
      } catch (error) {
        console.error('[MinIO] Supplier upload error:', error);
        res.status(500).json({ message: "Falha no upload do arquivo" });
      }
    }
  );

  app.post(
    "/api/minio/upload/general",
    authenticateToken,
    uploadToMinio.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const objectName = MinioService.generateObjectName('general', req.file.originalname);
        const uploadedPath = await MinioService.uploadBuffer(
          req.file.buffer,
          objectName,
          req.file.mimetype
        );

        const presignedUrl = await MinioService.getPresignedUrl(uploadedPath, 24 * 60 * 60);

        res.json({
          success: true,
          objectName: uploadedPath,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          presignedUrl
        });
      } catch (error) {
        console.error('[MinIO] General upload error:', error);
        res.status(500).json({ message: "Falha no upload do arquivo" });
      }
    }
  );

  // Get presigned URL for existing file
  app.get(
    "/api/minio/presigned/:objectName(*)",
    authenticateToken,
    async (req, res) => {
      try {
        const objectName = req.params.objectName;
        
        if (!objectName) {
          return res.status(400).json({ message: "Nome do objeto é obrigatório" });
        }

        const exists = await MinioService.fileExists(objectName);
        if (!exists) {
          return res.status(404).json({ message: "Arquivo não encontrado" });
        }

        const presignedUrl = await MinioService.getPresignedUrl(objectName, 24 * 60 * 60);

        res.json({
          success: true,
          objectName,
          presignedUrl
        });
      } catch (error) {
        console.error('[MinIO] Presigned URL error:', error);
        res.status(500).json({ message: "Falha ao gerar URL do arquivo" });
      }
    }
  );

  // Delete file from MinIO
  app.delete(
    "/api/minio/file/:objectName(*)",
    authenticateToken,
    async (req, res) => {
      try {
        const objectName = req.params.objectName;
        
        if (!objectName) {
          return res.status(400).json({ message: "Nome do objeto é obrigatório" });
        }

        await MinioService.deleteFile(objectName);

        res.json({
          success: true,
          message: "Arquivo deletado com sucesso"
        });
      } catch (error) {
        console.error('[MinIO] Delete file error:', error);
        res.status(500).json({ message: "Falha ao deletar arquivo" });
      }
    }
  );

  // List files by type
  app.get(
    "/api/minio/files/:type",
    authenticateToken,
    async (req, res) => {
      try {
        const type = req.params.type;
        const validTypes = ['products', 'clients', 'suppliers', 'general'];
        
        if (!validTypes.includes(type)) {
          return res.status(400).json({ message: "Tipo de arquivo inválido" });
        }

        const files = await MinioService.listFiles(`${type}/`);

        res.json({
          success: true,
          files: files.map(file => ({
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
            etag: file.etag
          }))
        });
      } catch (error) {
        console.error('[MinIO] List files error:', error);
        res.status(500).json({ message: "Falha ao listar arquivos" });
      }
    }
  );

  // Migration route - Migrate files from local storage to MinIO
  app.post(
    "/api/minio/migrate",
    authenticateToken,
    async (req, res) => {
      try {
        const { filesMigration } = await import("./migration");
        
        console.log('[Migration] Starting files migration to MinIO...');
        
        // Create backup before migration
        await filesMigration.createBackup();
        
        // Run migration
        await filesMigration.migrateAllFiles();
        
        res.json({
          success: true,
          message: "Files migrated to MinIO successfully"
        });
      } catch (error) {
        console.error('[Migration] Migration error:', error);
        res.status(500).json({ 
          success: false,
          message: "Failed to migrate files to MinIO",
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Authentication routes (no auth required)
  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags:
   *       - Autenticação
   *     summary: Fazer login no sistema
   *     description: Autentica um usuário e retorna token de sessão
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: Nome de usuário ou email
   *               password:
   *                 type: string
   *                 description: Senha do usuário
   *     responses:
   *       200:
   *         description: Login realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *                 token:
   *                   type: string
   *                   description: Token de sessão
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Credenciais inválidas
   *       500:
   *         description: Erro interno do servidor
   */
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent") || "unknown";

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Usuário e senha são obrigatórios" });
      }

      const result = await dbStorage.authenticateUser(
        username,
        password,
        ipAddress,
        userAgent,
      );
      if (!result) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Set secure HTTP-only cookies
      const isProduction = process.env.NODE_ENV === "production";

      res.cookie("sessionToken", result.sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 4 * 60 * 60 * 1000, // 4 hours
        path: "/",
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      // Return user data without tokens for security
      res.json({
        user: result.user,
        message: "Login realizado com sucesso",
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     tags:
   *       - Autenticação
   *     summary: Fazer logout do sistema
   *     description: Invalida a sessão atual e limpa os cookies de autenticação
   *     responses:
   *       200:
   *         description: Logout realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Logout realizado com sucesso
   *       500:
   *         description: Erro interno do servidor
   */
  app.post("/api/auth/logout", async (req: any, res) => {
    try {
      const sessionToken =
        req.cookies.sessionToken ||
        req.headers["authorization"]?.split(" ")[1] ||
        req.headers["session-token"];

      if (sessionToken) {
        await dbStorage.invalidateSession(sessionToken);
      }

      // Clear cookies
      res.clearCookie("sessionToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",
      });

      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao fazer logout" });
    }
  });

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     tags:
   *       - Autenticação
   *     summary: Atualizar token de sessão
   *     description: Atualiza o token de sessão usando o refresh token
   *     responses:
   *       200:
   *         description: Token atualizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *                 sessionToken:
   *                   type: string
   *                   description: Novo token de sessão
   *       401:
   *         description: Token de refresh inválido ou expirado
   *       500:
   *         description: Erro interno do servidor
   */
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent") || "unknown";

      if (!refreshToken) {
        return res
          .status(401)
          .json({ message: "Token de atualização não encontrado" });
      }

      const result = await dbStorage.refreshSession(
        refreshToken,
        ipAddress,
        userAgent,
      );
      if (!result) {
        return res
          .status(401)
          .json({ message: "Token de atualização inválido" });
      }

      // Set new secure cookies
      const isProduction = process.env.NODE_ENV === "production";

      res.cookie("sessionToken", result.sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 4 * 60 * 60 * 1000, // 4 hours
        path: "/",
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      res.json({ message: "Token atualizado com sucesso" });
    } catch (error) {
      console.error("Refresh error:", error);
      res.status(500).json({ message: "Erro ao atualizar token" });
    }
  });

  /**
   * @swagger
   * /api/auth/verify:
   *   get:
   *     tags:
   *       - Autenticação
   *     summary: Verificar token de autenticação
   *     description: Verifica se o token de sessão atual é válido e retorna informações do usuário
   *     security:
   *       - sessionToken: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Token válido
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *                 valid:
   *                   type: boolean
   *                   example: true
   *       401:
   *         description: Não autorizado - token inválido ou ausente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/auth/verify", authenticateToken, (req: any, res) => {
    res.json({ user: req.user, valid: true });
  });

  /**
   * @swagger
   * /api/auth/status:
   *   get:
   *     tags:
   *       - Autenticação
   *     summary: Verificar status de autenticação
   *     description: Retorna o status atual de autenticação e informações do usuário
   *     security:
   *       - sessionToken: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Status de autenticação
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 isAuthenticated:
   *                   type: boolean
   *                   example: true
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Não autorizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // Auth status check (similar to verify but with different response format)
  app.get("/api/auth/status", authenticateToken, (req: any, res) => {
    res.json({
      isAuthenticated: true,
      user: req.user
    });
  });

  // Protected routes (require authentication)
  /**
   * @swagger
   * /api/user:
   *   get:
   *     tags:
   *       - Usuário
   *     summary: Obter dados do usuário logado
   *     description: Retorna as informações do usuário atualmente autenticado
   *     security:
   *       - sessionToken: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Dados do usuário
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: Usuário não encontrado
   *       401:
   *         description: Não autorizado
   *       500:
   *         description: Erro interno do servidor
   */
  app.get("/api/user", authenticateToken, async (req: any, res) => {
    try {
      const user = await dbStorage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // User Preferences routes
  /**
   * @swagger
   * /api/user/preferences:
   *   get:
   *     tags:
   *       - Usuário
   *     summary: Obter preferências do usuário
   *     description: Retorna as preferências salvas do usuário
   *     security:
   *       - sessionToken: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Preferências do usuário
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 theme:
   *                   type: string
   *                   description: Tema da interface
   *                 language:
   *                   type: string
   *                   description: Idioma preferido
   *                 notifications:
   *                   type: boolean
   *                   description: Receber notificações
   *       500:
   *         description: Erro interno do servidor
   */
  app.get("/api/user/preferences", authenticateToken, async (req: any, res) => {
    try {
      const preferences = await dbStorage.getUserPreferences(req.user.id);
      res.json(preferences || {});
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Falha ao carregar preferências" });
    }
  });

  /**
   * @swagger
   * /api/user/preferences:
   *   put:
   *     tags:
   *       - Usuário
   *     summary: Atualizar preferências do usuário
   *     description: Atualiza as preferências do usuário logado
   *     security:
   *       - sessionToken: []
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               theme:
   *                 type: string
   *                 description: Tema da interface
   *               language:
   *                 type: string
   *                 description: Idioma preferido
   *               notifications:
   *                 type: boolean
   *                 description: Receber notificações
   *     responses:
   *       200:
   *         description: Preferências atualizadas com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 theme:
   *                   type: string
   *                 language:
   *                   type: string
   *                 notifications:
   *                   type: boolean
   *       500:
   *         description: Erro interno do servidor
   */
  app.put("/api/user/preferences", authenticateToken, async (req: any, res) => {
    try {
      const preferences = await dbStorage.updateUserPreferences(
        req.user.id,
        req.body,
      );
      res.json(preferences);

      // Broadcast preferences update
      broadcastUpdate("user_preferences_updated", {
        userId: req.user.id,
        preferences,
      });
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Falha ao salvar preferências" });
    }
  });

  // CNPJ lookup endpoint
  // CNPJ lookup route
  /**
   * @swagger
   * /api/cnpj/{cnpj}:
   *   get:
   *     tags:
   *       - Utilidades
   *     summary: Consultar dados de CNPJ
   *     description: Busca informações de uma empresa através do CNPJ na Receita Federal
   *     parameters:
   *       - in: path
   *         name: cnpj
   *         required: true
   *         schema:
   *           type: string
   *         description: CNPJ da empresa (com ou sem formatação)
   *     responses:
   *       200:
   *         description: Dados da empresa encontrados
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 cnpj:
   *                   type: string
   *                 nome:
   *                   type: string
   *                 fantasia:
   *                   type: string
   *                 situacao:
   *                   type: string
   *                 endereco:
   *                   type: object
   *       400:
   *         description: CNPJ inválido
   *       404:
   *         description: CNPJ não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  app.get("/api/cnpj/:cnpj", async (req, res) => {
    try {
      const cnpj = req.params.cnpj.replace(/\D/g, ''); // Remove non-digits

      if (cnpj.length !== 14) {
        return res.status(400).json({
          error: "CNPJ deve ter 14 dígitos",
          message: "CNPJ inválido"
        });
      }

      // Call ReceitaWS API
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);

      if (!response.ok) {
        return res.status(500).json({
          error: "Erro ao consultar API externa",
          message: "Serviço temporariamente indisponível"
        });
      }

      const data = await response.json();

      if (data.status === 'ERROR') {
        return res.status(404).json({
          error: data.message || "CNPJ não encontrado",
          message: "CNPJ não encontrado na Receita Federal"
        });
      }

      // Format and return the data
      const formattedData = {
        companyName: data.nome || '',
        email: data.email || '',
        phone: data.telefone || '',
        address: `${data.logradouro || ''} ${data.numero || ''}`.trim(),
        city: data.municipio || '',
        state: data.uf || '',
        zipCode: data.cep || '',
        cnpj: data.cnpj || '',
        fantasia: data.fantasia || '',
        situacao: data.situacao || '',
        abertura: data.abertura || ''
      };

      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching CNPJ data:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
        message: "Erro ao consultar dados do CNPJ"
      });
    }
  });

  // Providers routes
  /**
   * @swagger
   * /api/providers:
   *   get:
   *     tags:
   *       - Prestadores
   *     summary: Listar todos os prestadores
   *     description: Retorna a lista de todos os prestadores de serviço cadastrados
   *     responses:
   *       200:
   *         description: Lista de prestadores
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   name:
   *                     type: string
   *                   email:
   *                     type: string
   *                   phone:
   *                     type: string
   *                   cnpj:
   *                     type: string
   *                   address:
   *                     type: string
   *       500:
   *         description: Erro interno do servidor
   */
  app.get("/api/providers", async (req, res) => {
    try {
      const providers = await dbStorage.getProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Erro ao buscar prestadores" });
    }
  });

  /**
   * @swagger
   * /api/providers/{id}:
   *   get:
   *     tags:
   *       - Prestadores
   *     summary: Obter prestador por ID
   *     description: Retorna os dados de um prestador específico
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do prestador
   *     responses:
   *       200:
   *         description: Dados do prestador
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 email:
   *                   type: string
   *                 phone:
   *                   type: string
   *                 cnpj:
   *                   type: string
   *                 address:
   *                   type: string
   *       404:
   *         description: Prestador não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  app.get("/api/providers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const provider = await dbStorage.getProvider(id);

      if (!provider) {
        return res.status(404).json({ message: "Prestador não encontrado" });
      }

      res.json(provider);
    } catch (error) {
      console.error("Error fetching provider:", error);
      res.status(500).json({ message: "Erro ao buscar prestador" });
    }
  });

  /**
   * @swagger
   * /api/providers:
   *   post:
   *     tags:
   *       - Prestadores
   *     summary: Criar novo prestador
   *     description: Cadastra um novo prestador de serviço
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *             properties:
   *               name:
   *                 type: string
   *                 description: Nome do prestador
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Email do prestador
   *               phone:
   *                 type: string
   *                 description: Telefone do prestador
   *               cnpj:
   *                 type: string
   *                 description: CNPJ do prestador
   *               address:
   *                 type: string
   *                 description: Endereço do prestador
   *     responses:
   *       201:
   *         description: Prestador criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 email:
   *                   type: string
   *                 phone:
   *                   type: string
   *                 cnpj:
   *                   type: string
   *                 address:
   *                   type: string
   *       400:
   *         description: Dados inválidos
   *       500:
   *         description: Erro interno do servidor
   */
  app.post("/api/providers", async (req, res) => {
    try {
      const providerData = req.body;

      // Validate required fields
      if (!providerData.name) {
        return res.status(400).json({ message: "Nome é obrigatório" });
      }

      const newProvider = await dbStorage.createProvider(providerData);
      res.status(201).json(newProvider);
    } catch (error) {
      console.error("Error creating provider:", error);
      res.status(500).json({ message: "Erro ao criar prestador" });
    }
  });

  /**
   * @swagger
   * /api/providers/{id}:
   *   put:
   *     tags:
   *       - Prestadores
   *     summary: Atualizar prestador
   *     description: Atualiza os dados de um prestador existente
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do prestador
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Nome do prestador
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Email do prestador
   *               phone:
   *                 type: string
   *                 description: Telefone do prestador
   *               cnpj:
   *                 type: string
   *                 description: CNPJ do prestador
   *               address:
   *                 type: string
   *                 description: Endereço do prestador
   *     responses:
   *       200:
   *         description: Prestador atualizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 email:
   *                   type: string
   *                 phone:
   *                   type: string
   *                 cnpj:
   *                   type: string
   *                 address:
   *                   type: string
   *       404:
   *         description: Prestador não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  app.put("/api/providers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const providerData = req.body;

      const updatedProvider = await dbStorage.updateProvider(id, providerData);
      res.json(updatedProvider);
    } catch (error) {
      console.error("Error updating provider:", error);
      res.status(500).json({ message: "Erro ao atualizar prestador" });
    }
  });

  /**
   * @swagger
   * /api/providers/{id}:
   *   delete:
   *     tags:
   *       - Prestadores
   *     summary: Excluir prestador
   *     description: Remove um prestador do sistema
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do prestador
   *     responses:
   *       200:
   *         description: Prestador excluído com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       404:
   *         description: Prestador não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  app.delete("/api/providers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteProvider(id);
      res.status(200).json({ message: "Prestador excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting provider:", error);
      res.status(500).json({ message: "Erro ao excluir prestador" });
    }
  });

  // Exchange Rates routes
  /**
   * @swagger
   * /api/exchange-rates:
   *   get:
   *     tags:
   *       - Taxas de Câmbio
   *     summary: Listar taxas de câmbio
   *     description: Retorna todas as taxas de câmbio disponíveis
   *     responses:
   *       200:
   *         description: Lista de taxas de câmbio
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   from:
   *                     type: string
   *                     description: Moeda de origem
   *                   to:
   *                     type: string
   *                     description: Moeda de destino
   *                   rate:
   *                     type: number
   *                     description: Taxa de conversão
   *                   lastUpdated:
   *                     type: string
   *                     format: date-time
   *       500:
   *         description: Erro interno do servidor
   */
  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const rates = await dbStorage.getExchangeRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      res.status(500).json({ message: "Erro ao buscar cotações" });
    }
  });

  /**
   * @swagger
   * /api/exchange-rates/{from}/{to}:
   *   get:
   *     tags:
   *       - Taxas de Câmbio
   *     summary: Obter taxa de câmbio específica
   *     description: Retorna a taxa de câmbio entre duas moedas
   *     parameters:
   *       - in: path
   *         name: from
   *         required: true
   *         schema:
   *           type: string
   *         description: Moeda de origem (ex. USD)
   *       - in: path
   *         name: to
   *         required: false
   *         schema:
   *           type: string
   *           default: BRL
   *         description: Moeda de destino (ex. BRL)
   *     responses:
   *       200:
   *         description: Taxa de câmbio encontrada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 from:
   *                   type: string
   *                 to:
   *                   type: string
   *                 rate:
   *                   type: number
   *                 lastUpdated:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: Taxa de câmbio não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  app.get("/api/exchange-rates/:from/:to?", async (req, res) => {
    try {
      const fromCurrency = req.params.from.toUpperCase();
      const toCurrency = (req.params.to || 'BRL').toUpperCase();

      const rate = await dbStorage.getLatestExchangeRate(fromCurrency, toCurrency);

      if (!rate) {
        return res.status(404).json({ message: "Cotação não encontrada" });
      }

      res.json(rate);
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      res.status(500).json({ message: "Erro ao buscar cotação" });
    }
  });

  app.post("/api/exchange-rates", async (req, res) => {
    try {
      const rateData = req.body;

      // Validate required fields
      if (!rateData.fromCurrency || !rateData.toCurrency || !rateData.rate) {
        return res.status(400).json({
          message: "Campos obrigatórios: fromCurrency, toCurrency, rate"
        });
      }

      const newRate = await dbStorage.createExchangeRate({
        fromCurrency: rateData.fromCurrency.toUpperCase(),
        toCurrency: rateData.toCurrency.toUpperCase(),
        rate: rateData.rate
      });

      res.status(201).json(newRate);
    } catch (error) {
      console.error("Error creating exchange rate:", error);
      res.status(500).json({ message: "Erro ao criar cotação" });
    }
  });

  app.put("/api/exchange-rates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rateData = req.body;

      const updatedRate = await dbStorage.updateExchangeRate(id, {
        ...rateData,
        rate: rateData.rate ? parseFloat(rateData.rate) : undefined
      });

      res.json(updatedRate);
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      res.status(500).json({ message: "Erro ao atualizar cotação" });
    }
  });

  app.delete("/api/exchange-rates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteExchangeRate(id);
      res.status(200).json({ message: "Cotação excluída com sucesso" });
    } catch (error) {
      console.error("Error deleting exchange rate:", error);
      res.status(500).json({ message: "Erro ao excluir cotação" });
    }
  });

  app.post("/api/exchange-rates/update", async (req, res) => {
    try {
      await dbStorage.updateExchangeRates();
      res.json({ message: "Cotações atualizadas com sucesso" });
    } catch (error) {
      console.error("Error updating exchange rates:", error);
      res.status(500).json({ message: "Erro ao atualizar cotações" });
    }
  });

  // Get historical exchange rates
  app.get("/api/exchange-rates/history/:from/:to?", async (req, res) => {
    try {
      const fromCurrency = req.params.from.toUpperCase();
      const toCurrency = (req.params.to || 'BRL').toUpperCase();
      const days = parseInt(req.query.days as string) || 30;

      console.log(`Getting exchange rate history for ${fromCurrency} to ${toCurrency}, last ${days} days`);

      const history = await dbStorage.getExchangeRateHistory(fromCurrency, toCurrency, days);
      console.log(`Found ${history.length} historical records`);

      res.json(history);
    } catch (error) {
      console.error("Error getting exchange rate history:", error);
      res.status(500).json({
        message: "Erro ao buscar histórico de cotações",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Currency conversion helper endpoint
  app.get("/api/convert/:amount/:from/:to?", async (req, res) => {
    try {
      const amount = parseFloat(req.params.amount);
      const fromCurrency = req.params.from.toUpperCase();
      const toCurrency = (req.params.to || 'BRL').toUpperCase();

      if (isNaN(amount)) {
        return res.status(400).json({ message: "Valor inválido" });
      }

      if (fromCurrency === toCurrency) {
        return res.json({
          originalAmount: amount,
          convertedAmount: amount,
          fromCurrency,
          toCurrency,
          rate: 1,
          lastUpdated: new Date()
        });
      }

      const exchangeRate = await dbStorage.getLatestExchangeRate(fromCurrency, toCurrency);

      if (!exchangeRate) {
        return res.status(404).json({
          message: `Cotação não encontrada para ${fromCurrency} -> ${toCurrency}`
        });
      }

      const convertedAmount = amount * parseFloat(exchangeRate.rate.toString());

      res.json({
        originalAmount: amount,
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        fromCurrency,
        toCurrency,
        rate: exchangeRate.rate,
        lastUpdated: exchangeRate.updatedAt
      });

    } catch (error) {
      console.error("Error converting currency:", error);
      res.status(500).json({ message: "Erro ao converter moeda" });
    }
  });

  // Expense CRUD routes
  /**
   * @swagger
   * /api/expenses:
   *   get:
   *     summary: Get all expenses
   *     tags: [Despesas]
   *     security:
   *       - sessionToken: []
   *     responses:
   *       200:
   *         description: List of expenses
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Expense'
   *       500:
   *         description: Internal server error
   */
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await dbStorage.getExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error getting expenses:", error);
      res.status(500).json({ message: "Erro ao buscar despesas" });
    }
  });

  // Get expense statistics (must be before /:id route)
  /**
   * @swagger
   * /api/expenses/stats:
   *   get:
   *     summary: Get expense statistics
   *     tags: [Despesas]
   *     security:
   *       - sessionToken: []
   *     responses:
   *       200:
   *         description: Expense statistics including monthly/yearly totals and category breakdown
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalMonth:
   *                   type: number
   *                   description: Total expenses for current month
   *                 totalYear:
   *                   type: number
   *                   description: Total expenses for current year
   *                 byCategory:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       category:
   *                         type: string
   *                       total:
   *                         type: number
   *                       count:
   *                         type: integer
   *                 monthlyTrend:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       month:
   *                         type: string
   *                       total:
   *                         type: number
   *       500:
   *         description: Internal server error
   */
  app.get("/api/expenses/stats", async (req, res) => {
    try {
      console.log("Getting expense stats...");
      const expenses = await dbStorage.getExpenses();
      console.log(`Found ${expenses.length} expenses`);

      // Calculate real stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const totalMonth = expenses
        .filter(expense => new Date(expense.date) >= startOfMonth)
        .reduce((sum, expense) => sum + parseFloat(expense.amount?.toString() || '0'), 0);

      const totalYear = expenses
        .filter(expense => new Date(expense.date) >= startOfYear)
        .reduce((sum, expense) => sum + parseFloat(expense.amount?.toString() || '0'), 0);

      // Group by category
      const categoryMap = new Map();
      expenses.forEach(expense => {
        const category = expense.category || 'Outros';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { category, total: 0, count: 0 });
        }
        const cat = categoryMap.get(category);
        cat.total += parseFloat(expense.amount?.toString() || '0');
        cat.count += 1;
      });

      const byCategory = Array.from(categoryMap.values());

      // Monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const monthTotal = expenses
          .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= monthStart && expenseDate <= monthEnd;
          })
          .reduce((sum, expense) => sum + parseFloat(expense.amount?.toString() || '0'), 0);

        monthlyTrend.push({
          month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          total: monthTotal
        });
      }

      const stats = {
        totalMonth,
        totalYear,
        byCategory,
        monthlyTrend
      };

      console.log("Returning stats:", stats);
      res.json(stats);
    } catch (error) {
      console.error("Error getting expense stats:", error);
      res.status(500).json({
        message: "Erro ao buscar estatísticas de despesas",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * @swagger
   * /api/expenses/{id}:
   *   get:
   *     summary: Get expense by ID
   *     tags: [Despesas]
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Expense ID
   *     responses:
   *       200:
   *         description: Expense details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Expense'
   *       404:
   *         description: Expense not found
   *       500:
   *         description: Internal server error
   */
  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const expense = await dbStorage.getExpense(id);
      if (!expense) {
        res.status(404).json({ message: "Despesa não encontrada" });
        return;
      }
      res.json(expense);
    } catch (error) {
      console.error("Error getting expense:", error);
      res.status(500).json({ message: "Erro ao buscar despesa" });
    }
  });

  /**
   * @swagger
   * /api/expenses:
   *   post:
   *     summary: Create a new expense
   *     tags: [Despesas]
   *     security:
   *       - sessionToken: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - description
   *               - amount
   *               - category
   *               - date
   *             properties:
   *               description:
   *                 type: string
   *                 description: Expense description
   *               amount:
   *                 type: number
   *                 description: Expense amount
   *               category:
   *                 type: string
   *                 description: Expense category
   *               date:
   *                 type: string
   *                 format: date-time
   *                 description: Expense date
   *               currency:
   *                 type: string
   *                 description: Currency code (default BRL)
   *               originalAmount:
   *                 type: number
   *                 description: Original amount before conversion
   *               dueDate:
   *                 type: string
   *                 format: date-time
   *                 description: Due date for expense
   *               scheduledDate:
   *                 type: string
   *                 format: date-time
   *                 description: Scheduled date for expense
   *     responses:
   *       201:
   *         description: Expense created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Expense'
   *       500:
   *         description: Internal server error
   */
  app.post("/api/expenses", async (req, res) => {
    try {
      console.log("Creating expense with data:", JSON.stringify(req.body, null, 2));

      // Prepare the expense data with proper types
      const expenseData = {
        ...req.body,
      };

      // Convert amount from string to number if needed
      if (expenseData.amount && typeof expenseData.amount === 'string') {
        expenseData.amount = parseFloat(expenseData.amount);
      }

      // Calculate amountConverted based on currency
      let amountConverted = expenseData.amount;

      if (expenseData.currency && expenseData.currency !== 'BRL') {
        try {
          // Get latest exchange rate for the currency
          const exchangeRate = await dbStorage.getLatestExchangeRate(expenseData.currency, 'BRL');
          if (exchangeRate) {
            // Use originalAmount if available, otherwise use amount
            const baseAmount = expenseData.originalAmount || expenseData.amount;
            amountConverted = baseAmount * parseFloat(exchangeRate.rate.toString());
            console.log(`Converting ${baseAmount} ${expenseData.currency} to ${amountConverted} BRL (rate: ${exchangeRate.rate})`);
          } else {
            console.warn(`No exchange rate found for ${expenseData.currency} to BRL, using original amount`);
          }
        } catch (error) {
          console.error("Error getting exchange rate:", error);
        }
      }

      // Add amountConverted to expense data
      expenseData.amountConverted = amountConverted;

      // Convert dates to Date objects if they are strings
      if (expenseData.date && typeof expenseData.date === 'string') {
        expenseData.date = new Date(expenseData.date);
      }
      if (expenseData.dueDate && typeof expenseData.dueDate === 'string') {
        expenseData.dueDate = new Date(expenseData.dueDate);
      }
      if (expenseData.scheduledDate && typeof expenseData.scheduledDate === 'string') {
        expenseData.scheduledDate = new Date(expenseData.scheduledDate);
      }

      console.log("Processed expense data:", JSON.stringify(expenseData, null, 2));

      const expense = await dbStorage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error as any);
      let errorMsg = "";
      if (typeof error === "object" && error && "message" in error) {
        errorMsg = (error as any).message;
      }
      res.status(500).json({ message: "Erro ao criar despesa", error: errorMsg });
    }
  });

  /**
   * @swagger
   * /api/expenses/{id}:
   *   put:
   *     summary: Update an expense
   *     tags: [Despesas]
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Expense ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               description:
   *                 type: string
   *                 description: Expense description
   *               amount:
   *                 type: number
   *                 description: Expense amount
   *               category:
   *                 type: string
   *                 description: Expense category
   *               date:
   *                 type: string
   *                 format: date-time
   *                 description: Expense date
   *               currency:
   *                 type: string
   *                 description: Currency code
   *               originalAmount:
   *                 type: number
   *                 description: Original amount before conversion
   *               dueDate:
   *                 type: string
   *                 format: date-time
   *                 description: Due date for expense
   *               scheduledDate:
   *                 type: string
   *                 format: date-time
   *                 description: Scheduled date for expense
   *     responses:
   *       200:
   *         description: Expense updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Expense'
   *       404:
   *         description: Expense not found
   *       500:
   *         description: Internal server error
   */
  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Updating expense", id, "with data:", JSON.stringify(req.body, null, 2));

      // Prepare the expense data with proper types
      const expenseData = {
        ...req.body,
      };

      // Convert amount from string to number if needed
      if (expenseData.amount && typeof expenseData.amount === 'string') {
        expenseData.amount = parseFloat(expenseData.amount);
      }

      // Calculate amountConverted based on currency
      let amountConverted = expenseData.amount;

      if (expenseData.currency && expenseData.currency !== 'BRL') {
        try {
          // Get latest exchange rate for the currency
          const exchangeRate = await dbStorage.getLatestExchangeRate(expenseData.currency, 'BRL');
          if (exchangeRate) {
            // Use originalAmount if available, otherwise use amount
            const baseAmount = expenseData.originalAmount || expenseData.amount;
            amountConverted = baseAmount * parseFloat(exchangeRate.rate.toString());
            console.log(`Converting ${baseAmount} ${expenseData.currency} to ${amountConverted} BRL (rate: ${exchangeRate.rate})`);
          } else {
            console.warn(`No exchange rate found for ${expenseData.currency} to BRL, using original amount`);
          }
        } catch (error) {
          console.error("Error getting exchange rate:", error);
        }
      }

      // Add amountConverted to expense data
      expenseData.amountConverted = amountConverted;

      // Convert dates to Date objects if they are strings
      if (expenseData.date && typeof expenseData.date === 'string') {
        expenseData.date = new Date(expenseData.date);
      }
      if (expenseData.dueDate && typeof expenseData.dueDate === 'string') {
        expenseData.dueDate = new Date(expenseData.dueDate);
      }
      if (expenseData.scheduledDate && typeof expenseData.scheduledDate === 'string') {
        expenseData.scheduledDate = new Date(expenseData.scheduledDate);
      }

      console.log("Processed expense update data:", JSON.stringify(expenseData, null, 2));

      const expense = await dbStorage.updateExpense(id, expenseData);
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error as any);
      let errorMsg = "";
      if (typeof error === "object" && error && "message" in error) {
        errorMsg = (error as any).message;
      }
      res.status(500).json({ message: "Erro ao atualizar despesa", error: errorMsg });
    }
  });

  /**
   * @swagger
   * /api/expenses/{id}:
   *   delete:
   *     summary: Delete an expense
   *     tags: [Despesas]
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Expense ID
   *     responses:
   *       200:
   *         description: Expense deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Internal server error
   */
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteExpense(id);
      res.status(200).json({ message: "Despesa excluída com sucesso" });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Erro ao excluir despesa" });
    }
  });

  // Fix existing expenses that have currency but no proper conversion
  /**
   * @swagger
   * /api/expenses/fix-currency:
   *   post:
   *     summary: Fix currency conversion for existing expenses
   *     tags: [Despesas]
   *     security:
   *       - sessionToken: []
   *     responses:
   *       200:
   *         description: Currency fixes applied successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 updatedCount:
   *                   type: integer
   *       500:
   *         description: Internal server error
   */
  app.post("/api/expenses/fix-currency", async (req, res) => {
    try {
      console.log("Starting to fix currency for existing expenses...");
      const expenses = await dbStorage.getExpenses();
      let updateCount = 0;

      for (const expense of expenses) {
        let amountConverted = parseFloat(expense.amount.toString());

        // If currency is not BRL and amountConverted is null, calculate it
        if (expense.currency !== 'BRL' && !expense.amountConverted) {
          try {
            const exchangeRate = await dbStorage.getLatestExchangeRate(expense.currency, 'BRL');
            if (exchangeRate) {
              // Use originalAmount if available, otherwise use amount
              const baseAmount = expense.originalAmount
                ? parseFloat(expense.originalAmount.toString())
                : parseFloat(expense.amount.toString());

              amountConverted = baseAmount * parseFloat(exchangeRate.rate.toString());
              console.log(`Converting expense ${expense.id}: ${baseAmount} ${expense.currency} to ${amountConverted} BRL (rate: ${exchangeRate.rate})`);
            } else {
              console.warn(`No exchange rate found for ${expense.currency} to BRL for expense ${expense.id}`);
            }
          } catch (error) {
            console.error(`Error getting exchange rate for expense ${expense.id}:`, error);
          }
        } else if (expense.currency === 'BRL' && !expense.amountConverted) {
          // For BRL expenses, amountConverted should be the same as amount
          amountConverted = parseFloat(expense.amount.toString());
        } else if (expense.amountConverted) {
          // Already has amountConverted, skip
          continue;
        }

        // Update the expense with amountConverted
        await dbStorage.updateExpense(parseInt(expense.id.toString()), {
          amountConverted: amountConverted.toFixed(2)
        });
        updateCount++;
      }

      console.log(`Updated ${updateCount} expenses with amountConverted field`);
      res.json({
        message: `Successfully updated ${updateCount} expenses with converted amounts`,
        updatedCount: updateCount,
        totalExpenses: expenses.length
      });
    } catch (error) {
      console.error("Error fixing currency for expenses:", error);
      res.status(500).json({ message: "Erro ao converter despesas", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // ===== EXPENSE CATEGORIES ROUTES =====  // ===== EXPENSE CATEGORIES ROUTES =====

  app.get("/api/expense-categories", async (req, res) => {
    try {
      const categories = await dbStorage.getExpenseCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error getting expense categories:", error);
      res.status(500).json({ message: "Erro ao buscar categorias" });
    }
  });

  app.get("/api/expense-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await dbStorage.getExpenseCategory(id);

      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      res.json(category);
    } catch (error) {
      console.error("Error getting expense category:", error);
      res.status(500).json({ message: "Erro ao buscar categoria" });
    }
  });

  app.post("/api/expense-categories", async (req, res) => {
    try {
      const category = await dbStorage.createExpenseCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating expense category:", error);
      res.status(500).json({ message: "Erro ao criar categoria" });
    }
  });

  app.put("/api/expense-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await dbStorage.updateExpenseCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating expense category:", error);
      res.status(500).json({ message: "Erro ao atualizar categoria" });
    }
  });

  app.delete("/api/expense-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteExpenseCategory(id);
      res.json({ message: "Categoria removida com sucesso" });
    } catch (error) {
      console.error("Error deleting expense category:", error);
      res.status(500).json({ message: "Erro ao remover categoria" });
    }
  });

  // ===== PAYMENT METHODS ROUTES =====

  /**
   * @swagger
   * /api/payment-methods:
   *   get:
   *     summary: Get all payment methods
   *     tags: [Payment Methods]
   *     security:
   *       - sessionToken: []
   *     responses:
   *       200:
   *         description: List of payment methods
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   name:
   *                     type: string
   *                   type:
   *                     type: string
   *                   details:
   *                     type: object
   *       500:
   *         description: Internal server error
   */
  app.get("/api/payment-methods", async (req, res) => {
    try {
      const methods = await dbStorage.getPaymentMethods();
      res.json(methods);
    } catch (error) {
      console.error("Error getting payment methods:", error);
      res.status(500).json({ message: "Erro ao buscar métodos de pagamento" });
    }
  });

  /**
   * @swagger
   * /api/payment-methods/{id}:
   *   get:
   *     summary: Get payment method by ID
   *     tags: [Payment Methods]
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Payment method ID
   *     responses:
   *       200:
   *         description: Payment method details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 type:
   *                   type: string
   *                 details:
   *                   type: object
   *       404:
   *         description: Payment method not found
   *       500:
   *         description: Internal server error
   */
  app.get("/api/payment-methods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await dbStorage.getPaymentMethod(id);

      if (!method) {
        return res.status(404).json({ message: "Método de pagamento não encontrado" });
      }

      res.json(method);
    } catch (error) {
      console.error("Error getting payment method:", error);
      res.status(500).json({ message: "Erro ao buscar método de pagamento" });
    }
  });

  /**
   * @swagger
   * /api/payment-methods:
   *   post:
   *     summary: Create a new payment method
   *     tags: [Payment Methods]
   *     security:
   *       - sessionToken: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - type
   *             properties:
   *               name:
   *                 type: string
   *                 description: Payment method name
   *               type:
   *                 type: string
   *                 description: Payment method type
   *               details:
   *                 type: object
   *                 description: Additional payment method details
   *     responses:
   *       201:
   *         description: Payment method created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 type:
   *                   type: string
   *                 details:
   *                   type: object
   *       500:
   *         description: Internal server error
   */
  app.post("/api/payment-methods", async (req, res) => {
    try {
      const method = await dbStorage.createPaymentMethod(req.body);
      res.status(201).json(method);
    } catch (error) {
      console.error("Error creating payment method:", error);
      res.status(500).json({ message: "Erro ao criar método de pagamento" });
    }
  });

  /**
   * @swagger
   * /api/payment-methods/{id}:
   *   put:
   *     summary: Update a payment method
   *     tags: [Payment Methods]
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Payment method ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Payment method name
   *               type:
   *                 type: string
   *                 description: Payment method type
   *               details:
   *                 type: object
   *                 description: Additional payment method details
   *     responses:
   *       200:
   *         description: Payment method updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 type:
   *                   type: string
   *                 details:
   *                   type: object
   *       500:
   *         description: Internal server error
   */
  app.put("/api/payment-methods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const method = await dbStorage.updatePaymentMethod(id, req.body);
      res.json(method);
    } catch (error) {
      console.error("Error updating payment method:", error);
      res.status(500).json({ message: "Erro ao atualizar método de pagamento" });
    }
  });

  /**
   * @swagger
   * /api/payment-methods/{id}:
   *   delete:
   *     summary: Delete a payment method
   *     tags: [Payment Methods]
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Payment method ID
   *     responses:
   *       200:
   *         description: Payment method deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Internal server error
   */
  app.delete("/api/payment-methods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deletePaymentMethod(id);
      res.json({ message: "Método de pagamento removido com sucesso" });
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: "Erro ao remover método de pagamento" });
    }
  });

  // Get navigation items
  app.get("/api/navigation", async (req, res) => {
    try {
      const items = await dbStorage.getNavigationItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get navigation items" });
    }
  });

  // Update navigation items (add firewall, remove user permissions)
  app.post("/api/navigation/update", async (req, res) => {
    try {
      // Check if firewall item already exists
      const items = await dbStorage.getNavigationItems();
      const firewallExists = items.some(item => item.href === '/firewall');
      const servicesExists = items.some(item => item.href === '/services');
      const permissionsItem = items.find(item => item.href === '/user-permissions');

      // Remove user permissions item if it exists
      if (permissionsItem) {
        await dbStorage.deleteNavigationItem(permissionsItem.id);
      }

      // Add firewall item if it doesn't exist
      if (!firewallExists) {
        await dbStorage.createNavigationItem({
          label: 'Firewall',
          href: '/firewall',
          icon: 'Shield',
          order: 8,
          parentId: null
        });
      }

      // Add services item if it doesn't exist
      if (!servicesExists) {
        await dbStorage.createNavigationItem({
          label: 'Serviços',
          href: '/services',
          icon: 'Zap',
          order: 16,
          parentId: null
        });
      }

      res.json({ success: true, message: "Navigation updated successfully" });
    } catch (error) {
      console.error('Error updating navigation:', error);
      res.status(500).json({ message: "Failed to update navigation items" });
    }
  });

  // Create navigation item
  app.post("/api/navigation", async (req, res) => {
    try {
      const item = await dbStorage.createNavigationItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating navigation item:', error);
      res.status(500).json({ message: "Failed to create navigation item" });
    }
  });

  // Get dashboard stats
  /**
   * @swagger
   * /api/dashboard/stats:
   *   get:
   *     tags:
   *       - Dashboard
   *     summary: Obter estatísticas do dashboard
   *     description: Retorna estatísticas resumidas para o dashboard principal
   *     responses:
   *       200:
   *         description: Estatísticas do dashboard
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalExpenses:
   *                   type: number
   *                 monthlyExpenses:
   *                   type: number
   *                 totalContainers:
   *                   type: integer
   *                 runningContainers:
   *                   type: integer
   *       404:
   *         description: Estatísticas não encontradas
   *       500:
   *         description: Erro interno do servidor
   */
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await dbStorage.getDashboardStats(1); // Mock user ID
      if (!stats) {
        return res.status(404).json({ message: "Stats not found" });
      }
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  /**
   * @swagger
   * /api/system/stats:
   *   get:
   *     tags:
   *       - System
   *     summary: Get real-time system statistics
   *     description: Returns current system resource usage including CPU, memory, disk, and uptime
   *     responses:
   *       200:
   *         description: System statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SystemStats'
   *       500:
   *         description: Failed to fetch system stats
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // Get real-time system stats for monitoring alerts
  app.get("/api/system/stats", async (req, res) => {
    try {
      const stats = await getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ error: "Failed to fetch system stats" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req, res) => {
    try {
      const items = await dbStorage.getCartItems(1); // Mock user ID
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cart items" });
    }
  });

  app.patch("/api/cart/:id/quantity", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { quantity } = req.body;
      const updated = await dbStorage.updateCartItemQuantity(itemId, quantity);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await dbStorage.deleteCartItem(itemId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cart item" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      await dbStorage.clearCart(1); // Mock user ID
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Notification routes
  /**
   * @swagger
   * /api/notifications:
   *   get:
   *     tags:
   *       - Notificações
   *     summary: Listar notificações
   *     description: Retorna as notificações do usuário
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 5
   *         description: Número máximo de notificações
   *     responses:
   *       200:
   *         description: Lista de notificações
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   title:
   *                     type: string
   *                   message:
   *                     type: string
   *                   type:
   *                     type: string
   *                   isRead:
   *                     type: boolean
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *       500:
   *         description: Erro interno do servidor
   */
  app.get("/api/notifications", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const notifications = await dbStorage.getNotifications(1, limit); // Mock user ID
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const updated = await dbStorage.markNotificationAsRead(notificationId);
      res.json(updated);
      // Broadcast notification update to all WebSocket clients
      if (typeof wss !== 'undefined') {
        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: "notification_update" }));
          }
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await dbStorage.deleteNotification(notificationId);
      res.json({ success: true });
      // Broadcast notification update to all WebSocket clients
      if (typeof wss !== 'undefined') {
        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: "notification_update" }));
          }
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.delete("/api/notifications", async (req, res) => {
    try {
      await dbStorage.clearNotifications(1); // Mock user ID
      res.json({ success: true });
      // Broadcast notification update to all WebSocket clients
      if (typeof wss !== 'undefined') {
        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: "notification_update" }));
          }
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to clear notifications" });
    }
  });

  // Email routes
  /**
   * @swagger
   * /api/emails:
   *   get:
   *     summary: Get emails
   *     tags: [Emails]
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 5
   *         description: Number of emails to return
   *     responses:
   *       200:
   *         description: List of emails
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   subject:
   *                     type: string
   *                   body:
   *                     type: string
   *                   sender:
   *                     type: string
   *                   isRead:
   *                     type: boolean
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *       500:
   *         description: Internal server error
   */
  app.get("/api/emails", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const emails = await dbStorage.getEmails(1, limit); // Mock user ID
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get emails" });
    }
  });

  /**
   * @swagger
   * /api/emails/{id}/read:
   *   patch:
   *     summary: Mark email as read
   *     tags: [Emails]
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Email ID
   *     responses:
   *       200:
   *         description: Email marked as read successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 isRead:
   *                   type: boolean
   *       500:
   *         description: Internal server error
   */
  app.patch("/api/emails/:id/read", async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const updated = await dbStorage.markEmailAsRead(emailId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark email as read" });
    }
  });

  /**
   * @swagger
   * /api/emails/{id}:
   *   delete:
   *     summary: Delete an email
   *     tags: [Emails]
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Email ID
   *     responses:
   *       200:
   *         description: Email deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *       500:
   *         description: Internal server error
   */
  app.delete("/api/emails/:id", async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      await dbStorage.deleteEmail(emailId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email" });
    }
  });

  /**
   * @swagger
   * /api/emails:
   *   delete:
   *     summary: Clear all emails
   *     tags: [Emails]
   *     security:
   *       - sessionToken: []
   *     responses:
   *       200:
   *         description: All emails cleared successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *       500:
   *         description: Internal server error
   */
  app.delete("/api/emails", async (req, res) => {
    try {
      await dbStorage.clearEmails(1); // Mock user ID
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear emails" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await dbStorage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to get clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await dbStorage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to get client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await dbStorage.updateClient(id, req.body);
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      await dbStorage.deleteClient(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete client:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete client";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Client Discount Plans routes
  app.get("/api/client-discount-plans", async (req, res) => {
    try {
      const plans = await dbStorage.getClientDiscountPlans();
      res.json(plans);
    } catch (error) {
      console.error("Failed to get client discount plans:", error);
      res.status(500).json({ message: "Failed to get client discount plans" });
    }
  });

  app.get("/api/client-discount-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await dbStorage.getClientDiscountPlan(id);
      if (!plan) {
        return res.status(404).json({ message: "Client discount plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Failed to get client discount plan:", error);
      res.status(500).json({ message: "Failed to get client discount plan" });
    }
  });

  app.post("/api/client-discount-plans", async (req, res) => {
    try {
      const plan = await dbStorage.createClientDiscountPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Failed to create client discount plan:", error);
      res.status(500).json({ message: "Failed to create client discount plan" });
    }
  });

  app.put("/api/client-discount-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await dbStorage.updateClientDiscountPlan(id, req.body);
      res.json(plan);
    } catch (error) {
      console.error("Failed to update client discount plan:", error);
      res.status(500).json({ message: "Failed to update client discount plan" });
    }
  });

  app.delete("/api/client-discount-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteClientDiscountPlan(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete client discount plan:", error);
      res.status(500).json({ message: "Failed to delete client discount plan" });
    }
  });

  // Client Discount Rules routes
  app.get("/api/client-discount-rules", async (req, res) => {
    try {
      const { planId } = req.query;
      const rules = planId ? 
        await dbStorage.getClientDiscountRulesByPlan(parseInt(planId as string)) :
        await dbStorage.getClientDiscountRules();
      res.json(rules);
    } catch (error) {
      console.error("Failed to get client discount rules:", error);
      res.status(500).json({ message: "Failed to get client discount rules" });
    }
  });

  app.post("/api/client-discount-rules", async (req, res) => {
    try {
      const rule = await dbStorage.createClientDiscountRule(req.body);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Failed to create client discount rule:", error);
      res.status(500).json({ message: "Failed to create client discount rule" });
    }
  });

  app.put("/api/client-discount-rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rule = await dbStorage.updateClientDiscountRule(id, req.body);
      res.json(rule);
    } catch (error) {
      console.error("Failed to update client discount rule:", error);
      res.status(500).json({ message: "Failed to update client discount rule" });
    }
  });

  app.delete("/api/client-discount-rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteClientDiscountRule(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete client discount rule:", error);
      res.status(500).json({ message: "Failed to delete client discount rule" });
    }
  });

  // Plans routes
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await dbStorage.getPlans();
      res.json(plans);
    } catch (error) {
      console.error("Failed to get plans:", error);
      res.status(500).json({ message: "Failed to get plans" });
    }
  });

  app.get("/api/plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await dbStorage.getPlan(id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Failed to get plan:", error);
      res.status(500).json({ message: "Failed to get plan" });
    }
  });

  app.post("/api/plans", async (req, res) => {
    try {
      const plan = await dbStorage.createPlan(req.body);
      res.json(plan);
    } catch (error) {
      console.error("Failed to create plan:", error);
      res.status(500).json({ message: "Failed to create plan" });
    }
  });

  app.put("/api/plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await dbStorage.updatePlan(id, req.body);
      res.json(plan);
    } catch (error) {
      console.error("Failed to update plan:", error);
      res.status(500).json({ message: "Failed to update plan" });
    }
  });

  app.delete("/api/plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }
      
      await dbStorage.deletePlan(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete plan:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete plan";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Plan payment discounts routes
  app.get("/api/plans/:planId/payment-discounts", async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const discounts = await dbStorage.getPlanPaymentDiscounts(planId);
      res.json(discounts);
    } catch (error) {
      console.error("Failed to get plan payment discounts:", error);
      res.status(500).json({ message: "Failed to get plan payment discounts" });
    }
  });

  app.post("/api/plans/:planId/payment-discounts", async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const discount = await dbStorage.createPlanPaymentDiscount({
        ...req.body,
        planId
      });
      res.json(discount);
    } catch (error) {
      console.error("Failed to create plan payment discount:", error);
      res.status(500).json({ message: "Failed to create plan payment discount" });
    }
  });

  // Plan subscription discounts routes
  app.get("/api/plans/:planId/subscription-discounts", async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const discounts = await dbStorage.getPlanSubscriptionDiscounts(planId);
      res.json(discounts);
    } catch (error) {
      console.error("Failed to get plan subscription discounts:", error);
      res.status(500).json({ message: "Failed to get plan subscription discounts" });
    }
  });

  app.post("/api/plans/:planId/subscription-discounts", async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const discount = await dbStorage.createPlanSubscriptionDiscount({
        ...req.body,
        planId
      });
      res.json(discount);
    } catch (error) {
      console.error("Failed to create plan subscription discount:", error);
      res.status(500).json({ message: "Failed to create plan subscription discount" });
    }
  });

  // Plan Resources routes
  app.get("/api/plan-resources", async (req, res) => {
    try {
      const resources = await dbStorage.getPlanResources();
      res.json(resources);
    } catch (error) {
      console.error("Failed to get plan resources:", error);
      res.status(500).json({ message: "Failed to get plan resources" });
    }
  });

  app.get("/api/plan-resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resource = await dbStorage.getPlanResource(id);
      if (!resource) {
        return res.status(404).json({ message: "Plan resource not found" });
      }
      res.json(resource);
    } catch (error) {
      console.error("Failed to get plan resource:", error);
      res.status(500).json({ message: "Failed to get plan resource" });
    }
  });

  app.post("/api/plan-resources", async (req, res) => {
    try {
      const resource = await dbStorage.createPlanResource(req.body);
      res.json(resource);
    } catch (error) {
      console.error("Failed to create plan resource:", error);
      res.status(500).json({ message: "Failed to create plan resource" });
    }
  });

  app.put("/api/plan-resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resource = await dbStorage.updatePlanResource(id, req.body);
      res.json(resource);
    } catch (error) {
      console.error("Failed to update plan resource:", error);
      res.status(500).json({ message: "Failed to update plan resource" });
    }
  });

  app.delete("/api/plan-resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deletePlanResource(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete plan resource:", error);
      res.status(500).json({ message: "Failed to delete plan resource" });
    }
  });

  // Plan Resource Assignments routes
  app.get("/api/plans/:planId/resources", async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const assignments = await dbStorage.getPlanResourceAssignments(planId);
      res.json(assignments);
    } catch (error) {
      console.error("Failed to get plan resource assignments:", error);
      res.status(500).json({ message: "Failed to get plan resource assignments" });
    }
  });

  app.post("/api/plans/:planId/resources", async (req, res) => {
    try {
      const planId = parseInt(req.params.planId);
      const assignment = await dbStorage.createPlanResourceAssignment({
        ...req.body,
        planId
      });
      res.json(assignment);
    } catch (error) {
      console.error("Failed to create plan resource assignment:", error);
      res.status(500).json({ message: "Failed to create plan resource assignment" });
    }
  });

  app.get("/api/plan-resource-assignments", async (req, res) => {
    try {
      const assignments = await dbStorage.getAllPlanResourceAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Failed to get plan resource assignments:", error);
      res.status(500).json({ message: "Failed to get plan resource assignments" });
    }
  });

  app.put("/api/plan-resource-assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await dbStorage.updatePlanResourceAssignment(id, req.body);
      res.json(assignment);
    } catch (error) {
      console.error("Failed to update plan resource assignment:", error);
      res.status(500).json({ message: "Failed to update plan resource assignment" });
    }
  });

  app.delete("/api/plan-resource-assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deletePlanResourceAssignment(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete plan resource assignment:", error);
      res.status(500).json({ message: "Failed to delete plan resource assignment" });
    }
  });

  // Category routes
  /**
   * @swagger
   * /api/categories:
   *   get:
   *     summary: Get all categories
   *     tags: [Categorias]
   *     security:
   *       - sessionToken: []
   *     responses:
   *       200:
   *         description: List of categories
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: integer
   *                   name:
   *                     type: string
   *                   description:
   *                     type: string
   *       500:
   *         description: Internal server error
   */
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await dbStorage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  /**
   * @swagger
   * /api/categories/{id}:
   *   get:
   *     summary: Get category by ID
   *     tags: [Categorias]
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Category ID
   *     responses:
   *       200:
   *         description: Category details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 description:
   *                   type: string
   *       404:
   *         description: Category not found
   *       500:
   *         description: Internal server error
   */
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await dbStorage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to get category" });
    }
  });

  /**
   * @swagger
   * /api/categories:
   *   post:
   *     summary: Create a new category
   *     tags: [Categorias]
   *     security:
   *       - sessionToken: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 description: Category name
   *               description:
   *                 type: string
   *                 description: Category description
   *     responses:
   *       201:
   *         description: Category created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 description:
   *                   type: string
   *       500:
   *         description: Internal server error
   */
  app.post("/api/categories", async (req, res) => {
    try {
      const category = await dbStorage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  /**
   * @swagger
   * /api/categories/{id}:
   *   put:
   *     summary: Update a category
   *     tags: [Categorias]
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Category ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Category name
   *               description:
   *                 type: string
   *                 description: Category description
   *     responses:
   *       200:
   *         description: Category updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 description:
   *                   type: string
   *       500:
   *         description: Internal server error
   */
  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await dbStorage.updateCategory(id, req.body);
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  /**
   * @swagger
   * /api/categories/{id}:
   *   delete:
   *     summary: Delete a category
   *     tags: [Categorias]
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Category ID
   *     responses:
   *       200:
   *         description: Category deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *       500:
   *         description: Internal server error
   */
  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteCategory(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Service routes
  app.get("/api/services", async (req, res) => {
    try {
      const services = await dbStorage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to get services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await dbStorage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to get service" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const service = await dbStorage.createService(req.body);
      res.status(201).json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await dbStorage.updateService(id, req.body);
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteService(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Manufacturer routes
  app.get("/api/manufacturers", async (req, res) => {
    try {
      const manufacturers = await dbStorage.getManufacturers();
      res.json(manufacturers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get manufacturers" });
    }
  });

  app.get("/api/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const manufacturer = await dbStorage.getManufacturer(id);
      if (!manufacturer) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }
      res.json(manufacturer);
    } catch (error) {
      res.status(500).json({ message: "Failed to get manufacturer" });
    }
  });

  app.post("/api/manufacturers", async (req, res) => {
    try {
      const manufacturer = await dbStorage.createManufacturer(req.body);
      res.status(201).json(manufacturer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create manufacturer" });
    }
  });

  app.put("/api/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const manufacturer = await dbStorage.updateManufacturer(id, req.body);
      res.json(manufacturer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update manufacturer" });
    }
  });

  app.delete("/api/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteManufacturer(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete manufacturer" });
    }
  });

  // Product Group routes
  app.get("/api/product-groups", async (req, res) => {
    try {
      const groups = await dbStorage.getProductGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product groups" });
    }
  });

  app.get("/api/product-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await dbStorage.getProductGroup(id);
      if (!group) {
        return res.status(404).json({ message: "Product group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product group" });
    }
  });

  app.post("/api/product-groups", async (req, res) => {
    try {
      const group = await dbStorage.createProductGroup(req.body);
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product group" });
    }
  });

  app.put("/api/product-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const group = await dbStorage.updateProductGroup(id, req.body);
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product group" });
    }
  });

  app.delete("/api/product-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteProductGroup(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product group" });
    }
  });

  // Helper function to create basic nginx configuration without SSL
  async function createBasicNginxConfig(subdomain: string, port: number) {
    const domain = process.env.DOMAIN || "easydev.com.br";
    const hostsDir = process.env.NGINX_HOSTS_DIR || "/docker/nginx/hosts";
    const filename = `${subdomain}.${domain}.conf`;
    const filePath = path.join(hostsDir, filename);
    const serverName = `${subdomain}.${domain}`;

    // Basic nginx configuration for HTTP only
    const nginxConfig = `server {
    listen 80;
    listen [::]:80;
    server_name ${serverName};

    client_max_body_size 100M;
    underscores_in_headers on;

    location / {
        proxy_pass_header Authorization;
        proxy_pass http://0.0.0.0:${port}/;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Ssl "off";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_read_timeout 36000s;
        proxy_redirect off;
    }
}
`;

    // Create hosts directory if it doesn't exist
    if (!fs.existsSync(hostsDir)) {
      await fs.promises.mkdir(hostsDir, { recursive: true });
    }

    // Write nginx configuration file
    await fs.promises.writeFile(filePath, nginxConfig);
    console.log(`Created basic nginx config: ${filePath}`);

    // Create DNS record in Cloudflare if possible
    if (process.env.CLOUDFLARE_API_KEY && process.env.CLOUDFLARE_EMAIL && process.env.CLOUDFLARE_ZONE_ID) {
      try {
        const dnsRecord = {
          type: "CNAME",
          name: subdomain,
          content: domain,
          ttl: 1,
          proxied: true
        };
        await cloudflareService.createDNSRecord(dnsRecord);
        console.log(`Created DNS record: ${subdomain}.${domain}`);
      } catch (dnsError) {
        console.warn('Could not create DNS record:', dnsError);
        // Don't fail the whole operation if DNS fails
      }
    }

    // Reload nginx configuration
    try {
      // Check if nginx container exists before trying to reload
      const checkProcess = spawn('docker', ['ps', '--filter', 'name=nginx', '--format', '{{.Names}}'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000
      });

      let containerNames = '';
      checkProcess.stdout.on('data', (data) => {
        containerNames += data.toString();
      });

      checkProcess.on('close', (code) => {
        if (code === 0 && containerNames.trim()) {
          // Found nginx container, try to reload
          const nginxContainerName = containerNames.trim().split('\n')[0];
          const reloadProcess = spawn('docker', ['exec', nginxContainerName, 'nginx', '-s', 'reload'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 30000
          });

          reloadProcess.on('close', (reloadCode) => {
            if (reloadCode === 0) {
              console.log('Nginx configuration reloaded successfully');
            } else {
              console.warn(`Nginx reload finished with code ${reloadCode}`);
            }
          });
        } else {
          console.warn('No nginx container found, skipping reload');
        }
      });
    } catch (error) {
      console.warn('Could not reload nginx configuration:', error);
      // Don't fail the whole operation if nginx reload fails
    }
  }

  // Nginx Hosts routes
  /**
   * @swagger
   * /api/nginx/hosts:
   *   get:
   *     tags:
   *       - Nginx
   *     summary: Listar hosts nginx
   *     description: Retorna a lista de todos os hosts configurados no nginx
   *     security:
   *       - sessionToken: []
   *     responses:
   *       200:
   *         description: Lista de hosts nginx
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   domain:
   *                     type: string
   *                   configFile:
   *                     type: string
   *                   sslEnabled:
   *                     type: boolean
   *                   proxyPass:
   *                     type: string
   *       404:
   *         description: Diretório de hosts não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  app.get("/api/nginx/hosts", authenticateToken, async (req: any, res: any) => {
    try {
      const hostsDir = process.env.NGINX_HOSTS_DIR || "/docker/nginx/hosts";
      if (!fs.existsSync(hostsDir)) {
        return res.status(404).json({ message: "NGINX hosts directory not found", hosts: [] });
      }
      const files = await fs.promises.readdir(hostsDir);
      const hostFiles = files.filter(f => f.endsWith(".conf"));
      const hosts = [];
      for (const file of hostFiles) {
        const filePath = path.join(hostsDir, file);
        try {
          const content = await fs.promises.readFile(filePath, "utf8");
          const domain = file.replace(".conf", "");

          // Extract server information from nginx config
          const serverNameMatch = content.match(/server_name\s+([^;]+);/);
          const listenMatch = content.match(/listen\s+(\d+)/);
          const proxyPassMatch = content.match(/proxy_pass\s+http:\/\/[^:]+:(\d+)/);

          const serverName = serverNameMatch ? serverNameMatch[1].trim() : domain;
          const port = proxyPassMatch ? parseInt(proxyPassMatch[1]) : (listenMatch ? parseInt(listenMatch[1]) : 80);
          const subdomain = domain.split('.')[0];

          // Get file stats for timestamps
          const stats = await fs.promises.stat(filePath);

          hosts.push({
            id: domain, // Use domain as ID for compatibility
            filename: file,
            subdomain: subdomain,
            serverName: serverName,
            domain: domain,
            port: port,
            content: content,
            path: filePath,
            createdAt: stats.birthtime.toISOString(),
            modifiedAt: stats.mtime.toISOString()
          });
        } catch (err) {
          // Still add the file even if we can't read it
          hosts.push({
            id: file.replace('.conf', ''),
            filename: file,
            subdomain: file.replace('.conf', '').split('.')[0],
            serverName: file.replace('.conf', ''),
            domain: file.replace('.conf', ''),
            port: 80,
            error: "Failed to read file",
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
          });
        }
      }
      res.json(hosts);
    } catch (error) {
      console.error("Error reading nginx hosts:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: "Failed to read nginx hosts", error: errMsg });
    }
  });

  // Check host status endpoint  
  app.get("/api/nginx/hosts/status", authenticateToken, async (req: any, res: any) => {
    try {
      const hostsDir = process.env.NGINX_HOSTS_DIR || "/docker/nginx/hosts";

      if (!fs.existsSync(hostsDir)) {
        return res.status(404).json({ message: "NGINX hosts directory not found" });
      }

      const files = await fs.promises.readdir(hostsDir);
      const hostFiles = files.filter(f => f.endsWith(".conf"));

      const hostsStatus = [];

      // Helper function to check if a port is listening
      const checkPortStatus = (port: number): Promise<boolean> => {
        return new Promise((resolve) => {
          const net = require('net');
          const socket = new net.Socket();

          const timeout = setTimeout(() => {
            socket.destroy();
            resolve(false);
          }, 2000); // 2 second timeout

          socket.connect(port, 'localhost', () => {
            clearTimeout(timeout);
            socket.destroy();
            resolve(true);
          });

          socket.on('error', () => {
            clearTimeout(timeout);
            resolve(false);
          });
        });
      };

      // Check status for each host
      const statusPromises = hostFiles.map(async (file) => {
        const filePath = path.join(hostsDir, file);
        try {
          const content = await fs.promises.readFile(filePath, "utf8");
          const domain = file.replace(".conf", "");

          // Extract proxy_pass port from nginx config
          const proxyPassMatch = content.match(/proxy_pass\s+http:\/\/[^:]+:(\d+)/);
          const port = proxyPassMatch ? parseInt(proxyPassMatch[1]) : null;

          // Check if the service is running on the port
          const isOnline = port ? await checkPortStatus(port) : false;

          return {
            id: domain,
            filename: file,
            port: port,
            status: isOnline ? 'online' : 'offline',
            lastChecked: new Date().toISOString()
          };
        } catch (error) {
          return {
            id: file.replace('.conf', ''),
            filename: file,
            port: null,
            status: 'error',
            error: 'Failed to read configuration',
            lastChecked: new Date().toISOString()
          };
        }
      });

      const results = await Promise.all(statusPromises);
      const activeHosts = results.filter(host => host.status === 'online').length;

      res.json({
        hosts: results,
        activeHosts: activeHosts,
        totalHosts: results.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Error checking host status:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: "Failed to check host status", error: errMsg });
    }
  });

  app.get("/api/nginx/hosts/:id", authenticateToken, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const hostsDir = process.env.NGINX_HOSTS_DIR || "/docker/nginx/hosts";

      // Try to find the config file for this host
      const possibleFiles = [
        `${id}.conf`,
        `${id}.easydev.com.br.conf`,
        `www.${id}.conf`
      ];

      let configFile = null;
      let configPath = null;

      for (const filename of possibleFiles) {
        const filePath = path.join(hostsDir, filename);
        if (fs.existsSync(filePath)) {
          configFile = filename;
          configPath = filePath;
          break;
        }
      }

      if (!configFile || !configPath) {
        return res.status(404).json({
          message: "Host configuration file not found",
          id: id
        });
      }

      const content = await fs.promises.readFile(configPath, "utf8");
      const stats = await fs.promises.stat(configPath);

      // Extract server information from nginx config
      const serverNameMatch = content.match(/server_name\s+([^;]+);/);
      const listenMatch = content.match(/listen\s+(\d+)/);
      const proxyPassMatch = content.match(/proxy_pass\s+http:\/\/[^:]+:(\d+)/);

      const serverName = serverNameMatch ? serverNameMatch[1].trim() : id;
      const port = proxyPassMatch ? parseInt(proxyPassMatch[1]) : (listenMatch ? parseInt(listenMatch[1]) : 80);

      res.json({
        id,
        filename: configFile,
        content: content,
        serverName: serverName,
        port: port,
        path: configPath,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString()
      });
    } catch (error) {
      console.error("Error getting nginx host details:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: "Failed to get nginx host details", error: errMsg });
    }
  });

  // Cloudflare credentials endpoint
  app.get("/api/cloudflare/credentials", authenticateToken, async (req: any, res: any) => {
    try {
      const credentials = {
        email: process.env.CLOUDFLARE_EMAIL || '',
        apiKey: process.env.CLOUDFLARE_API_KEY || '',
        zoneId: process.env.CLOUDFLARE_ZONE_ID || ''
      };

      // Check if all credentials are available
      const hasCredentials = credentials.email && credentials.apiKey && credentials.zoneId;

      res.json({
        available: hasCredentials,
        credentials: hasCredentials ? credentials : null,
        message: hasCredentials ? 'Cloudflare credentials loaded from environment' : 'Some Cloudflare credentials are missing in environment variables'
      });
    } catch (error) {
      console.error("Error getting Cloudflare credentials:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: "Failed to get Cloudflare credentials", error: errMsg });
    }
  });

  // Test Cloudflare connection endpoint
  /**
   * @swagger
   * /api/cloudflare/test:
   *   post:
   *     tags:
   *       - Cloudflare
   *     summary: Testar conexão com Cloudflare
   *     description: Testa a conectividade e autenticação com a API do Cloudflare
   *     security:
   *       - sessionToken: []
   *     responses:
   *       200:
   *         description: Teste realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       500:
   *         description: Erro no teste
   */
  app.post("/api/cloudflare/test", authenticateToken, async (req: any, res: any) => {
    try {
      const success = await cloudflareService.testConnection();
      if (success) {
        res.json({
          success: true,
          message: "Conexão com Cloudflare estabelecida com sucesso!"
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Falha na conexão com Cloudflare. Verifique as credenciais."
        });
      }
    } catch (error) {
      console.error("Error testing Cloudflare connection:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: `Erro ao testar conexão: ${errMsg}`
      });
    }
  });


  app.post("/api/nginx/hosts", authenticateToken, async (req, res) => {
    try {
      const { subdomain, port } = req.body;

      if (!subdomain || !port) {
        return res.status(400).json({
          message: "Subdomínio e porta são obrigatórios"
        });
      }

      // Validate subdomain
      if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
        return res.status(400).json({
          message: "Subdomínio pode conter apenas letras, números e hífens"
        });
      }

      // Validate port
      const portNum = parseInt(port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return res.status(400).json({
          message: "Porta deve estar entre 1 e 65535"
        });
      }

      // Check if the script exists
      const scriptPath = "/docker/nginx/nginx_proxy.sh";
      if (!fs.existsSync(scriptPath)) {
        return res.status(500).json({
          message: "Script nginx_proxy.sh não encontrado",
          path: scriptPath
        });
      }

      console.log(`Creating nginx host: ${subdomain} -> port ${port}`);

      // Execute the nginx_proxy.sh script
      const scriptProcess = spawn('bash', [scriptPath, subdomain, port.toString()], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 600000 // 10 minutes timeout
      });

      let stdout = '';
      let stderr = '';

      scriptProcess.stdout.on('data', (data: any) => {
        const output = data.toString();
        stdout += output;
        console.log('Script stdout:', output);
      });

      scriptProcess.stderr.on('data', (data: any) => {
        const output = data.toString();
        stderr += output;
        console.log('Script stderr:', output);
      });

      scriptProcess.on('close', async (code: number) => {
        console.log(`Script finished with code: ${code}`);

        if (code === 0) {
          // Success
          res.json({
            message: "Host nginx criado com sucesso",
            subdomain: subdomain,
            port: port,
            stdout: stdout,
            stderr: stderr
          });
        } else {
          // Script failed, try to create basic HTTP-only configuration
          console.log('Script failed, creating basic HTTP configuration...');
          try {
            await createBasicNginxConfig(subdomain, portNum);
            res.json({
              message: "Host nginx criado com sucesso (apenas HTTP)",
              subdomain: subdomain,
              port: port,
              note: "SSL não foi configurado. Use o botão SSL na interface para configurar HTTPS.",
              exitCode: code,
              stdout: stdout,
              stderr: stderr
            });
          } catch (fallbackError) {
            console.error('Fallback configuration failed:', fallbackError);
            res.status(500).json({
              message: "Falha ao criar host nginx",
              subdomain: subdomain,
              port: port,
              exitCode: code,
              stdout: stdout,
              stderr: stderr,
              fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
            });
          }
        }
      });

      scriptProcess.on('error', (error: any) => {
        console.error('Script execution error:', error);
        res.status(500).json({
          message: "Erro ao executar script nginx_proxy.sh",
          error: (error as Error).message
        });
      });

    } catch (error) {
      console.error("Error creating nginx host:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({
        message: "Erro interno ao criar host nginx",
        error: errMsg
      });
    }
  });

  app.put("/api/nginx/hosts/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      // For now, return mock response - will be implemented later
      res.json({ message: "Nginx host update will be implemented", id });
    } catch (error) {
      console.error("Error updating nginx host:", error);
      res.status(500).json({ message: "Failed to update nginx host" });
    }
  });

  app.delete("/api/nginx/hosts/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const hostsDir = process.env.NGINX_HOSTS_DIR || "/docker/nginx/hosts";

      console.log(`Attempting to delete nginx host: ${id}`);

      // Find the configuration file for this host
      const possibleFiles = [
        `${id}.conf`,
        `${id}.easydev.com.br.conf`,
        `www.${id}.conf`
      ];

      let configFile = null;
      let configPath = null;
      let subdomain = null;

      for (const filename of possibleFiles) {
        const filePath = path.join(hostsDir, filename);
        if (fs.existsSync(filePath)) {
          configFile = filename;
          configPath = filePath;
          // Extract subdomain from filename
          subdomain = filename.replace('.easydev.com.br.conf', '').replace('.conf', '').replace('www.', '');
          break;
        }
      }

      if (!configFile || !configPath) {
        return res.status(404).json({
          message: "Host configuration file not found",
          id: id,
          searchedFiles: possibleFiles
        });
      }

      console.log(`Found config file: ${configFile} at ${configPath}`);

      // Read the configuration to extract server name
      let serverName = null;
      try {
        const configContent = await fs.promises.readFile(configPath, 'utf8');
        const serverNameMatch = configContent.match(/server_name\s+([^;]+);/);
        if (serverNameMatch) {
          serverName = serverNameMatch[1].trim();
        }
      } catch (error) {
        console.warn(`Could not read config file ${configFile}:`, error);
      }

      // Delete the nginx configuration file
      try {
        await fs.promises.unlink(configPath);
        console.log(`Deleted nginx config file: ${configPath}`);
      } catch (error) {
        console.error(`Failed to delete nginx config file:`, error);
        return res.status(500).json({
          message: "Failed to delete nginx configuration file",
          error: error instanceof Error ? error.message : String(error)
        });
      }

      // Delete SSL certificates if they exist
      const sslDir = "/docker/nginx/ssl";
      if (fs.existsSync(sslDir) && serverName) {
        const certFiles = [
          `${serverName}.crt`,
          `${serverName}.key`,
          `${serverName}.pem`
        ];

        for (const certFile of certFiles) {
          const certPath = path.join(sslDir, certFile);
          if (fs.existsSync(certPath)) {
            try {
              await fs.promises.unlink(certPath);
              console.log(`Deleted SSL certificate: ${certPath}`);
            } catch (error) {
              console.warn(`Could not delete SSL certificate ${certPath}:`, error);
            }
          }
        }
      }

      // Remove DNS record from Cloudflare if subdomain is available
      if (subdomain && process.env.CLOUDFLARE_API_KEY && process.env.CLOUDFLARE_EMAIL && process.env.CLOUDFLARE_ZONE_ID) {
        try {
          const dnsRecords = await cloudflareService.listDNSRecords();
          const recordToDelete = dnsRecords.find((record: any) =>
            record.name === `${subdomain}.${process.env.DOMAIN || 'easydev.com.br'}` ||
            record.name === subdomain
          );

          if (recordToDelete) {
            await cloudflareService.deleteDNSRecord(recordToDelete.id);
            console.log(`Deleted DNS record: ${recordToDelete.name}`);
          } else {
            console.log(`DNS record not found for subdomain: ${subdomain}`);
          }
        } catch (error) {
          console.warn(`Could not delete DNS record:`, error);
          // Don't fail the whole operation if DNS deletion fails
        }
      }

      // Reload nginx configuration
      try {
        // Check if nginx container exists before trying to reload
        const checkProcess = spawn('docker', ['ps', '--filter', 'name=nginx', '--format', '{{.Names}}'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 10000
        });

        let containerNames = '';
        checkProcess.stdout.on('data', (data) => {
          containerNames += data.toString();
        });

        checkProcess.on('close', (code) => {
          if (code === 0 && containerNames.trim()) {
            // Found nginx container, try to reload
            const nginxContainerName = containerNames.trim().split('\n')[0];
            const reloadProcess = spawn('docker', ['exec', nginxContainerName, 'nginx', '-s', 'reload'], {
              stdio: ['pipe', 'pipe', 'pipe'],
              timeout: 30000
            });

            let reloadOutput = '';
            let reloadError = '';

            reloadProcess.stdout.on('data', (data: any) => {
              reloadOutput += data.toString();
            });

            reloadProcess.stderr.on('data', (data: any) => {
              reloadError += data.toString();
            });

            reloadProcess.on('close', (reloadCode: number) => {
              if (reloadCode === 0) {
                console.log('Nginx configuration reloaded successfully');
              } else {
                console.warn(`Nginx reload finished with code ${reloadCode}:`, reloadError);
              }
            });
          } else {
            console.warn('No nginx container found, skipping reload');
          }
        });
      } catch (error) {
        console.warn('Could not reload nginx configuration:', error);
        // Don't fail the whole operation if nginx reload fails
      }

      res.json({
        message: "Host nginx removido com sucesso",
        id: id,
        configFile: configFile,
        subdomain: subdomain,
        serverName: serverName
      });

    } catch (error) {
      console.error("Error deleting nginx host:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({
        message: "Failed to delete nginx host",
        error: errMsg
      });
    }
  });

  // Temporary debug route (remove in production)
  app.get("/api/debug/ssl/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Find the domain configuration
      const hostsDir = process.env.NGINX_HOSTS_DIR || "/docker/nginx/hosts";
      const possibleFiles = [
        `${id}.conf`,
        `${id}.easydev.com.br.conf`,
        `www.${id}.conf`
      ];

      let domain = null;
      let configFile = null;

      // Find the correct config file and extract domain
      for (const filename of possibleFiles) {
        const filePath = path.join(hostsDir, filename);
        if (fs.existsSync(filePath)) {
          configFile = filename;
          // Extract domain from filename
          if (filename.includes('.easydev.com.br.conf')) {
            domain = filename.replace('.conf', '');
          } else if (filename.includes('.conf')) {
            domain = filename.replace('.conf', '') + '.easydev.com.br';
          }
          break;
        }
      }

      if (!domain) {
        return res.status(404).json({
          message: "Host configuration not found",
          issued: false,
          configuredInHost: false,
          domain: `${id}.easydev.com.br`
        });
      }

      // Check for SSL certificates
      const certPath = `/docker/certbot/live/${domain}/fullchain.pem`;
      const keyPath = `/docker/certbot/live/${domain}/privkey.pem`;

      let issued = false;
      let expirationDate = null;
      let daysUntilExpiry = null;

      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        issued = true;

        try {
          // Get certificate expiration date
          const certInfo = await new Promise((resolve, reject) => {
            const openssl = spawn('openssl', ['x509', '-in', certPath, '-noout', '-dates']);
            let output = '';

            openssl.stdout.on('data', (data) => {
              output += data.toString();
            });

            openssl.on('close', (code) => {
              if (code === 0) {
                resolve(output);
              } else {
                reject(new Error('Failed to read certificate'));
              }
            });
          });

          // Parse the expiration date
          const notAfterMatch = (certInfo as string).match(/notAfter=(.+)/);
          if (notAfterMatch) {
            expirationDate = new Date(notAfterMatch[1]);
            const now = new Date();
            daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }
        } catch (error) {
          console.warn('Could not read certificate details:', error);
        }
      }

      // Check if SSL is configured in the nginx host file
      let configuredInHost = false;
      if (configFile) {
        const configPath = path.join(hostsDir, configFile);
        try {
          const configContent = await fs.promises.readFile(configPath, 'utf8');
          configuredInHost = configContent.includes('ssl_certificate') && configContent.includes('listen 443');
        } catch (error) {
          console.warn('Could not read config file:', error);
        }
      }

      res.json({
        debug: true,
        issued,
        configuredInHost,
        domain,
        certPath: issued ? certPath : null,
        keyPath: issued ? keyPath : null,
        expirationDate: expirationDate ? expirationDate.toISOString() : null,
        daysUntilExpiry,
        configFile,
        valid: issued && (daysUntilExpiry !== null && daysUntilExpiry > 0),
        searchedFiles: possibleFiles,
        foundFile: configFile
      });
    } catch (error) {
      console.error("Error in debug SSL route:", error);
      res.status(500).json({ message: "Failed to get SSL info", error: (error as Error).message });
    }
  });

  app.get("/api/nginx/hosts/:id/ssl", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      // Find the domain configuration
      const hostsDir = process.env.NGINX_HOSTS_DIR || "/docker/nginx/hosts";
      const possibleFiles = [
        `${id}.conf`,
        `${id}.easydev.com.br.conf`,
        `www.${id}.conf`
      ];

      let domain = null;
      let configFile = null;

      // Find the correct config file and extract domain
      for (const filename of possibleFiles) {
        const filePath = path.join(hostsDir, filename);
        if (fs.existsSync(filePath)) {
          configFile = filename;
          // Extract domain from filename
          if (filename.includes('.easydev.com.br.conf')) {
            domain = filename.replace('.conf', '');
          } else if (filename.includes('.conf')) {
            domain = filename.replace('.conf', '') + '.easydev.com.br';
          }
          break;
        }
      }

      if (!domain) {
        return res.status(404).json({
          message: "Host configuration not found",
          issued: false,
          configuredInHost: false,
          domain: `${id}.easydev.com.br`
        });
      }

      // Check for SSL certificates
      const certPath = `/docker/certbot/live/${domain}/fullchain.pem`;
      const keyPath = `/docker/certbot/live/${domain}/privkey.pem`;

      let issued = false;
      let expirationDate = null;
      let daysUntilExpiry = null;

      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        issued = true;

        try {
          // Get certificate expiration date
          const certInfo = await new Promise((resolve, reject) => {
            const openssl = spawn('openssl', ['x509', '-in', certPath, '-noout', '-dates']);
            let output = '';

            openssl.stdout.on('data', (data) => {
              output += data.toString();
            });

            openssl.on('close', (code) => {
              if (code === 0) {
                resolve(output);
              } else {
                reject(new Error('Failed to read certificate'));
              }
            });
          });

          // Parse the expiration date
          const notAfterMatch = (certInfo as string).match(/notAfter=(.+)/);
          if (notAfterMatch) {
            expirationDate = new Date(notAfterMatch[1]);
            const now = new Date();
            daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }
        } catch (error) {
          console.warn('Could not read certificate details:', error);
        }
      }

      // Check if SSL is configured in the nginx host file
      let configuredInHost = false;
      if (configFile) {
        const configPath = path.join(hostsDir, configFile);
        try {
          const configContent = await fs.promises.readFile(configPath, 'utf8');
          configuredInHost = configContent.includes('ssl_certificate') && configContent.includes('listen 443');
        } catch (error) {
          console.warn('Could not read config file:', error);
        }
      }

      res.json({
        issued,
        configuredInHost,
        domain,
        certPath: issued ? certPath : null,
        keyPath: issued ? keyPath : null,
        expirationDate: expirationDate ? expirationDate.toISOString() : null,
        daysUntilExpiry,
        configFile,
        valid: issued && (daysUntilExpiry !== null && daysUntilExpiry > 0)
      });
    } catch (error) {
      console.error("Error getting SSL info:", error);
      res.status(500).json({ message: "Failed to get SSL info" });
    }
  });

  app.post("/api/nginx/hosts/:id/ssl/issue", authenticateToken, async (req: any, res: any) => {
    try {
      // Check if your SSL script exists
      const sslScriptPath = "/docker/nginx/certbot_ssl.sh";
      if (!fs.existsSync(sslScriptPath)) {
        return res.status(500).json({
          message: "Script SSL não encontrado",
          error: "O script /docker/nginx/certbot_ssl.sh não foi encontrado no sistema"
        });
      }

      const { id } = req.params;
      const { email, cloudflareApiToken, cloudflareZoneId } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email é obrigatório para emissão de certificados SSL"
        });
      }

      if (!cloudflareApiToken || !cloudflareZoneId) {
        return res.status(400).json({
          message: "Credenciais da Cloudflare são obrigatórias",
          error: "API Token e Zone ID da Cloudflare são necessários para emitir certificados SSL"
        });
      }

      // Extract subdomain from host ID
      // Examples: "www" from "www", "api" from "api", etc.
      const subdomain = id;

      console.log(`🔐 Emitindo certificado SSL para subdomínio: ${subdomain}`);
      console.log(`📧 Email: ${email}`);
      console.log(`🌐 Cloudflare Zone ID: ${cloudflareZoneId}`);

      // Execute your SSL script
      const execAsync = promisify(exec);

      try {
        // Use your script: /docker/nginx/certbot_ssl.sh subdomain
        const scriptCommand = `/docker/nginx/certbot_ssl.sh ${subdomain}`;
        console.log(`🚀 Executando comando: ${scriptCommand}`);

        const result = await execAsync(scriptCommand, {
          timeout: 600000, // 10 minutes timeout
          maxBuffer: 1024 * 1024 * 20, // 20MB buffer
          env: {
            ...process.env,
            // Use credentials from frontend form, fallback to .env file (already loaded in process.env)
            CLOUDFLARE_EMAIL: email || process.env.CLOUDFLARE_EMAIL,
            CLOUDFLARE_API_KEY: cloudflareApiToken || process.env.CLOUDFLARE_API_KEY,
            CLOUDFLARE_ZONE_ID: cloudflareZoneId || process.env.CLOUDFLARE_ZONE_ID,
            DOMAIN: process.env.DOMAIN || 'easydev.com.br'
          }
        });

        console.log('Script SSL executado com sucesso:', result.stdout);
        if (result.stderr) {
          console.log('Script SSL stderr:', result.stderr);
        }

        // Check if certificate was created successfully
        const certPath = `/docker/certbot/live/${subdomain}.${process.env.DOMAIN || 'easydev.com.br'}/fullchain.pem`;
        const keyPath = `/docker/certbot/live/${subdomain}.${process.env.DOMAIN || 'easydev.com.br'}/privkey.pem`;

        if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
          res.json({
            message: `Certificado SSL emitido com sucesso para ${subdomain}`,
            subdomain: subdomain,
            domain: `${subdomain}.${process.env.DOMAIN || 'easydev.com.br'}`,
            certPath: certPath,
            keyPath: keyPath,
            method: "Script personalizado + Cloudflare DNS",
            output: result.stdout
          });
        } else {
          return res.status(500).json({
            message: "Script executado, mas certificados não foram encontrados",
            subdomain: subdomain,
            expectedCertPath: certPath,
            expectedKeyPath: keyPath,
            output: result.stdout,
            error: result.stderr
          });
        }

      } catch (scriptError: any) {
        console.error('Erro ao executar script SSL:', scriptError);

        let errorMessage = "Erro desconhecido ao executar script SSL";
        if (scriptError.message) {
          errorMessage = scriptError.message;
        }
        if (scriptError.stderr) {
          errorMessage = scriptError.stderr;
        }

        return res.status(500).json({
          message: "Falha na execução do script SSL",
          subdomain: subdomain,
          error: errorMessage,
          details: scriptError.stdout || "Sem detalhes adicionais",
          command: `/docker/nginx/certbot_ssl.sh ${subdomain}`
        });
      }

    } catch (error) {
      console.error("Error issuing SSL certificate:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({
        message: "Erro interno ao emitir certificado SSL",
        error: errMsg
      });
    }
  });

  // Helper function to update nginx config for SSL
  async function updateNginxConfigForSSL(originalConfig: string, domain: string, certPath: string, keyPath: string): Promise<string> {
    // If config already has SSL, return as is
    if (originalConfig.includes('ssl_certificate')) {
      return originalConfig;
    }

    // Find the server block and add SSL configuration
    let updatedConfig = originalConfig;

    // Add SSL configuration after the listen directive
    const listenMatch = updatedConfig.match(/(listen\s+80[^;]*;)/);
    if (listenMatch) {
      const sslConfig = `    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    ssl_certificate ${certPath};
    ssl_certificate_key ${keyPath};
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;`;

      updatedConfig = updatedConfig.replace(listenMatch[1], listenMatch[1] + '\n' + sslConfig);
    }

    // Add HTTP to HTTPS redirect server block
    const redirectBlock = `
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    return 301 https://$server_name$request_uri;
}

`;

    updatedConfig = redirectBlock + updatedConfig;

    return updatedConfig;
  }

  app.post("/api/nginx/hosts/:id/ssl/renew", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      // For now, return mock response - will be implemented later
      res.json({ message: "SSL certificate renewal will be implemented", id });
    } catch (error) {
      console.error("Error renewing SSL certificate:", error);
      res.status(500).json({ message: "Failed to renew SSL certificate" });
    }
  });

  app.get("/api/nginx/hosts/:id/config", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      // For now, return mock config - will be implemented later
      res.json({
        config: `# Nginx configuration for host ${id}\n# Configuration editing will be implemented`
      });
    } catch (error) {
      console.error("Error getting nginx config:", error);
      res.status(500).json({ message: "Failed to get nginx config" });
    }
  });

  app.put("/api/nginx/hosts/:id/config", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { config } = req.body;
      // For now, return mock response - will be implemented later
      res.json({
        message: "Nginx configuration update will be implemented",
        id,
        configLength: config?.length || 0
      });
    } catch (error) {
      console.error("Error updating nginx config:", error);
      res.status(500).json({ message: "Failed to update nginx config" });
    }
  });

  /**
   * @swagger
   * /api/dns/zone:
   *   get:
   *     tags:
   *       - DNS
   *     summary: Get DNS zone information
   *     description: Returns information about the configured Cloudflare DNS zone
   *     security:
   *       - sessionToken: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: DNS zone information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   description: Zone ID
   *                 name:
   *                   type: string
   *                   description: Zone name (domain)
   *                 status:
   *                   type: string
   *                   description: Zone status
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Failed to get DNS zone
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // DNS routes
  app.get("/api/dns/zone", authenticateToken, async (req, res) => {
    try {
      const zone = await cloudflareService.getZone();
      res.json(zone);
    } catch (error) {
      console.error("Error getting DNS zone:", error);
      res.status(500).json({ message: "Failed to get DNS zone" });
    }
  });

  /**
   * @swagger
   * /api/dns/records:
   *   get:
   *     tags:
   *       - DNS
   *     summary: List DNS records
   *     description: Returns a list of DNS records with optional filtering and pagination
   *     security:
   *       - sessionToken: []
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [A, AAAA, CNAME, MX, TXT, NS, SRV]
   *         description: Filter by record type
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         description: Filter by record name
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: per_page
   *         schema:
   *           type: integer
   *           default: 20
   *           maximum: 100
   *         description: Records per page
   *     responses:
   *       200:
   *         description: List of DNS records
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/DNSRecord'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Failed to get DNS records
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/dns/records", authenticateToken, async (req, res) => {
    try {
      const { type, name, page = 1, per_page = 20 } = req.query;
      // Cloudflare API supports pagination via 'page' and 'per_page' params
      const records = await cloudflareService.listDNSRecords(
        type as string | undefined,
        name as string | undefined,
        Number(page),
        Number(per_page)
      );
      res.json(records);
    } catch (error) {
      console.error("Error getting DNS records:", error);
      res.status(500).json({ message: "Failed to get DNS records" });
    }
  });

  app.get("/api/dns/test", authenticateToken, async (req, res) => {
    try {
      const connected = await cloudflareService.testConnection();
      const accountInfo = await cloudflareService.getAccountInfo();
      res.json({
        connected,
        accountInfo
      });
    } catch (error) {
      console.error("Error testing DNS connection:", error);
      res.json({
        connected: false,
        accountInfo: null
      });
    }
  });

  app.post("/api/dns/records", authenticateToken, async (req, res) => {
    try {
      const record = await cloudflareService.createDNSRecord(req.body);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating DNS record:", error);
      res.status(500).json({ message: "Failed to create DNS record" });
    }
  });

  app.put("/api/dns/records/:id", authenticateToken, async (req, res) => {
    try {
      const recordId = req.params.id;
      const record = await cloudflareService.updateDNSRecord(recordId, req.body);
      res.json(record);
    } catch (error) {
      console.error("Error updating DNS record:", error);
      res.status(500).json({ message: "Failed to update DNS record" });
    }
  });

  app.delete("/api/dns/records/:id", authenticateToken, async (req, res) => {
    try {
      const recordId = req.params.id;
      // Buscar registro DNS
      const dnsRecord = await cloudflareService.getDNSRecord(recordId);
      if (!dnsRecord) {
        return res.status(404).json({ message: "Registro DNS não encontrado" });
      }

      // Buscar hosts Nginx
      const hostsDir = process.env.NGINX_HOSTS_DIR || "/docker/nginx/hosts";
      let isInUse = false;
      if (fs.existsSync(hostsDir)) {
        const files = await fs.promises.readdir(hostsDir);
        for (const file of files) {
          if (file.endsWith(".conf")) {
            const filePath = path.join(hostsDir, file);
            try {
              const content = await fs.promises.readFile(filePath, "utf8");
              // Verifica se o server_name ou subdomínio do host usa o registro DNS
              if (
                content.includes(dnsRecord.name) ||
                content.includes(`${dnsRecord.name}.${process.env.DOMAIN || 'easydev.com.br'}`)
              ) {
                isInUse = true;
                break;
              }
            } catch { }
          }
        }
      }

      if (isInUse) {
        return res.status(409).json({
          message: `Não é possível deletar o registro DNS '${dnsRecord.name}' pois está em uso por um host Nginx.`
        });
      }

      await cloudflareService.deleteDNSRecord(recordId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting DNS record:", error);
      res.status(500).json({ message: "Failed to delete DNS record" });
    }
  });

  app.post("/api/dns/sync", authenticateToken, async (req, res) => {
    try {
      const { types } = req.body;
      const result = await cloudflareService.syncDNSRecords(types);
      res.json(result);
    } catch (error) {
      console.error("Error syncing DNS records:", error);
      res.status(500).json({ message: "Failed to sync DNS records" });
    }
  });

  // Product routes
  app.get("/api/products", authenticateToken, async (req, res) => {
    try {
      console.log("Fetching products...");
      const products = await dbStorage.getProducts();
      console.log("Products found:", products.length);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await dbStorage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  app.post("/api/products", authenticateToken, async (req, res) => {
    try {
      const product = await dbStorage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await dbStorage.updateProduct(id, req.body);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteProduct(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Supplier routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await dbStorage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get suppliers" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await dbStorage.getSupplier(id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to get supplier" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplier = await dbStorage.createSupplier(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await dbStorage.updateSupplier(id, req.body);
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSupplier(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Sales routes
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await dbStorage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sales" });
    }
  });

  app.get("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await dbStorage.getSale(id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sale" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const sale = await dbStorage.createSale(req.body);
      res.status(201).json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.put("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await dbStorage.updateSale(id, req.body);
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sale" });
    }
  });

  app.delete("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSale(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Sale Items routes
  app.get("/api/sales/:id/items", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const saleItems = await dbStorage.getSaleItems(saleId);
      res.json(saleItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sale items" });
    }
  });

  app.post("/api/sales/:id/items", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const saleItem = await dbStorage.createSaleItem({ ...req.body, saleId });
      res.status(201).json(saleItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sale item" });
    }
  });

  // Sale Items routes
  app.get("/api/sales/:saleId/items", async (req, res) => {
    try {
      const saleId = parseInt(req.params.saleId);
      const items = await dbStorage.getSaleItems(saleId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sale items" });
    }
  });

  app.post("/api/sale-items", async (req, res) => {
    try {
      const saleItem = await dbStorage.createSaleItem(req.body);
      res.status(201).json(saleItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sale item" });
    }
  });

  app.put("/api/sale-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const saleItem = await dbStorage.updateSaleItem(id, req.body);
      res.json(saleItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sale item" });
    }
  });

  app.delete("/api/sale-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSaleItem(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale item" });
    }
  });

  // Support Tickets routes
  app.get("/api/support/tickets", async (req, res) => {
    try {
      const tickets = await dbStorage.getSupportTickets();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to get support tickets" });
    }
  });

  app.get("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await dbStorage.getSupportTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to get support ticket" });
    }
  });

  app.post("/api/support/tickets", async (req, res) => {
    try {
      const ticket = await dbStorage.createSupportTicket(req.body);
      res.status(201).json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.put("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await dbStorage.updateSupportTicket(id, req.body);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  app.delete("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSupportTicket(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete support ticket" });
    }
  });

  // Support Ticket Messages routes
  app.get("/api/support/tickets/:id/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const messages = await dbStorage.getSupportTicketMessages(ticketId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ticket messages" });
    }
  });

  app.post("/api/support/tickets/:id/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const message = await dbStorage.createSupportTicketMessage({
        ...req.body,
        ticketId,
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ticket message" });
    }
  });

  // Support Categories routes
  app.get("/api/support/categories", async (req, res) => {
    try {
      const categories = await dbStorage.getSupportCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get support categories" });
    }
  });

  app.post("/api/support/categories", async (req, res) => {
    try {
      const category = await dbStorage.createSupportCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create support category" });
    }
  });

  // Chatwoot Settings routes
  app.get("/api/chatwoot/settings", async (req, res) => {
    try {
      const settings = await dbStorage.getChatwootSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get Chatwoot settings" });
    }
  });

  app.post("/api/chatwoot/settings", async (req, res) => {
    try {
      const settings = await dbStorage.createChatwootSettings(req.body);
      res.status(201).json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to create Chatwoot settings" });
    }
  });

  app.put("/api/chatwoot/settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const settings = await dbStorage.updateChatwootSettings(id, req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update Chatwoot settings" });
    }
  });

  // Helper function to get Python version
  async function getPythonVersion(): Promise<{ version: string; available: boolean }> {
    try {
      const execAsync = promisify(exec);
      const { stdout } = await execAsync('python3 --version 2>&1');
      const version = stdout.trim().replace('Python ', '');
      return { version, available: true };
    } catch (error) {
      try {
        const { stdout } = await execAsync('python --version 2>&1');
        const version = stdout.trim().replace('Python ', '');
        return { version, available: true };
      } catch {
        return { version: 'Not installed', available: false };
      }
    }
  }

  // Helper function to check for updates
  async function checkForUpdates(): Promise<{ node: boolean; python: boolean }> {
    try {
      const execAsync = promisify(exec);

      // Check Node.js updates using npm outdated
      let nodeUpdatesAvailable = false;
      try {
        await execAsync('npm outdated -g');
      } catch (error: any) {
        // npm outdated returns exit code 1 when updates are available
        nodeUpdatesAvailable = error.code === 1;
      }

      // For Python, we'll check if pip itself needs updating
      let pythonUpdatesAvailable = false;
      try {
        const { stdout } = await execAsync('python3 -m pip list --outdated 2>/dev/null || python -m pip list --outdated 2>/dev/null');
        pythonUpdatesAvailable = stdout.includes('pip') || stdout.trim().length > 0;
      } catch {
        pythonUpdatesAvailable = false;
      }

      return {
        node: nodeUpdatesAvailable,
        python: pythonUpdatesAvailable
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return { node: false, python: false };
    }
  }

  // System Status routes
  app.get("/api/system/status", authenticateToken, async (req, res) => {
    try {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // Get accurate CPU usage, disk usage, Proton Drive usage, Python version, updates, hardware info
      const [cpuUsage, diskUsage, protonDriveUsage, pythonInfo, updates, totalRAM, processor] = await Promise.all([
        getCpuUsage(),
        getDiskUsage(),
        getProtonDriveUsage(),
        getPythonVersion(),
        checkForUpdates(),
        getTotalRAM(),
        getProcessorInfo()
      ]);

      const systemStatus = {
        cpu: {
          usage: cpuUsage,
          cores: cpus.length,
          model: cpus[0]?.model || "Unknown",
        },
        memory: {
          total: roundMemoryToGB(totalMem),
          used: usedMem,
          free: freeMem,
          usagePercent: Math.round((usedMem / totalMem) * 100),
          totalRAM: totalRAM, // Novo campo - informação via lshw
        },
        disk: {
          total: diskUsage.total,
          used: diskUsage.used,
          free: diskUsage.free,
          usagePercent: diskUsage.usagePercent,
        },
        swap: {
          total: protonDriveUsage.total,
          used: protonDriveUsage.used,
          free: protonDriveUsage.free,
          usagePercent: protonDriveUsage.usagePercent,
        },
        uptime: os.uptime(),
        platform: await getLinuxDistribution(),
        arch: os.arch(),
        nodeVersion: process.version,
        pythonVersion: pythonInfo.version,
        pythonAvailable: pythonInfo.available,
        processor: processor, // Novo campo - informação do processador via lshw
        updates: {
          node: updates.node,
          python: updates.python
        },
        timestamp: new Date().toISOString(),
      };

      res.json(systemStatus);
    } catch (error) {
      console.error("Error getting system status:", error);
      res.status(500).json({ error: "Failed to get system status" });
    }
  });

  // Update system packages route
  app.post("/api/system/update", authenticateToken, async (req, res) => {
    const { type } = req.body; // 'node' or 'python' or 'all'

    try {
      let commands: string[] = [];

      if (type === 'node' || type === 'all') {
        commands.push('npm update -g');
      }

      if (type === 'python' || type === 'all') {
        // Check if we need --break-system-packages flag (Debian 12 or Python 12+)
        const platform = await getLinuxDistribution();
        const pythonInfo = await getPythonVersion();

        let pipFlags = '';
        let installFlags = '';

        // Check if we're on Debian 12+ or Python 3.12+
        const needsBreakSystemPackages =
          platform.toLowerCase().includes('debian 12') ||
          platform.toLowerCase().includes('bookworm') ||
          (pythonInfo.available && pythonInfo.version.startsWith('3.12')) ||
          (pythonInfo.available && pythonInfo.version.startsWith('3.13'));

        if (needsBreakSystemPackages) {
          pipFlags = '--break-system-packages';
          installFlags = '--break-system-packages';
        }

        // Update pip first
        commands.push(`python3 -m pip install --upgrade pip ${pipFlags} || python -m pip install --upgrade pip ${pipFlags}`);

        // Update all outdated packages
        commands.push(`python3 -m pip list --outdated --format=freeze | grep -v "^\-e" | cut -d = -f 1 | xargs -n1 python3 -m pip install -U ${installFlags} || true`);
      }

      if (commands.length === 0) {
        return res.status(400).json({ error: 'Invalid update type' });
      }

      // Execute commands and stream output
      const fullCommand = commands.join(' && ');
      const child = spawn('bash', ['-c', fullCommand], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        res.json({
          success: code === 0,
          output,
          exitCode: code,
          type: type
        });
      });

    } catch (error) {
      console.error('Error updating system:', error);
      res.status(500).json({ error: 'Failed to update system packages' });
    }
  });  // Real-time chart data routes
  app.get("/api/charts/cpu", authenticateToken, async (req, res) => {
    try {
      const cpuInfo = os.cpus();
      const currentCpu = cpuHistory[cpuHistory.length - 1] || 0;

      // Calculate average frequency
      const avgFrequency = cpuInfo.reduce((sum, cpu) => sum + cpu.speed, 0) / cpuInfo.length;

      // Get min and max values for the chart period
      const minUsage = cpuHistory.length > 0 ? Math.min(...cpuHistory) : 0;
      const maxUsage = cpuHistory.length > 0 ? Math.max(...cpuHistory) : 0;
      const avgUsage = cpuHistory.length > 0 ?
        cpuHistory.reduce((sum, val) => sum + val, 0) / cpuHistory.length : 0;

      res.json({
        data: cpuHistory,
        labels: cpuHistory.map((_, index) => `${index * 2}s ago`).reverse(),
        current: currentCpu,
        details: {
          cores: cpuInfo.length,
          model: cpuInfo[0]?.model || 'Unknown',
          frequency: `${avgFrequency} MHz`,
          minUsage: minUsage.toFixed(1),
          maxUsage: maxUsage.toFixed(1),
          avgUsage: avgUsage.toFixed(1),
          architecture: os.arch(),
          threads: cpuInfo.length // Assuming 1 thread per core for simplicity
        }
      });
    } catch (error) {
      console.error("Error getting CPU chart data:", error);
      res.status(500).json({ error: "Failed to get CPU chart data" });
    }
  });

  app.get("/api/charts/ram", authenticateToken, async (req, res) => {
    try {
      const memInfo = os.totalmem();
      const freeMemInfo = os.freemem();
      const usedMem = memInfo - freeMemInfo;
      const currentRam = ramHistory[ramHistory.length - 1] || 0;

      // Get hardware RAM info via lshw
      const totalRAM = await getTotalRAM();

      // Get min and max values for the chart period
      const minUsage = ramHistory.length > 0 ? Math.min(...ramHistory) : 0;
      const maxUsage = ramHistory.length > 0 ? Math.max(...ramHistory) : 0;
      const avgUsage = ramHistory.length > 0 ?
        ramHistory.reduce((sum, val) => sum + val, 0) / ramHistory.length : 0;

      // Format bytes helper
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      res.json({
        data: ramHistory,
        labels: ramHistory.map((_, index) => `${index * 2}s ago`).reverse(),
        current: currentRam,
        details: {
          total: formatBytes(memInfo),
          totalRAM: totalRAM, // ✅ NOVO - Campo para exibição via lshw
          used: formatBytes(usedMem),
          free: formatBytes(freeMemInfo),
          totalBytes: memInfo,
          usedBytes: usedMem,
          freeBytes: freeMemInfo,
          minUsage: minUsage.toFixed(1),
          maxUsage: maxUsage.toFixed(1),
          avgUsage: avgUsage.toFixed(1),
          platform: os.platform(),
          buffers: 'N/A' // Could be enhanced with /proc/meminfo on Linux
        }
      });
    } catch (error) {
      console.error("Error getting RAM chart data:", error);
      res.status(500).json({ error: "Failed to get RAM chart data" });
    }
  });

  app.get("/api/charts/network", authenticateToken, async (req, res) => {
    try {
      res.json({
        data: networkHistory,
        labels: networkHistory.map((_, index) => `${index * 2}s ago`).reverse(),
        current: networkHistory[networkHistory.length - 1] || { rx: 0, tx: 0 },
        totals: {
          rxTotal: totalNetworkStats.rxTotal,
          txTotal: totalNetworkStats.txTotal
        }
      });
    } catch (error) {
      console.error("Error getting network chart data:", error);
      res.status(500).json({ error: "Failed to get network chart data" });
    }
  });

  // Proton Drive status route (separate endpoint for different refresh interval)
  app.get("/api/proton/status", authenticateToken, async (req, res) => {
    try {
      const protonDriveUsage = await getProtonDriveUsage();

      res.json({
        total: protonDriveUsage.total,
        used: protonDriveUsage.used,
        free: protonDriveUsage.free,
        usagePercent: protonDriveUsage.usagePercent,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error getting Proton Drive status:", error);
      res.status(500).json({ error: "Failed to get Proton Drive status" });
    }
  });

  // Email Accounts routes
  app.get("/api/email-accounts", async (req, res) => {
    try {
      const accounts = await dbStorage.getEmailAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get email accounts" });
    }
  });

  // Get mailserver restart status (must be before /:id route)
  app.get("/api/email-accounts/restart-status", async (req, res) => {
    res.json({
      isRestarting: isRestartingMailserver,
      message: isRestartingMailserver ? "Mailserver is restarting..." : "Mailserver is ready"
    });
  });

  app.get("/api/email-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await dbStorage.getEmailAccount(id);
      if (!account) {
        return res.status(404).json({ message: "Email account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to get email account" });
    }
  });

  app.post("/api/email-accounts", async (req, res) => {
    try {
      const account = await dbStorage.createEmailAccount(req.body);
      await generateMailAccountsFile();

      // Start mailserver restart in background
      restartMailserverContainer();

      broadcastUpdate("email_account_created", account);
      res.status(201).json({
        ...account,
        restartStatus: {
          isRestarting: true,
          message: "Email account created. Mailserver is restarting..."
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to create email account" });
    }
  });

  app.put("/api/email-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await dbStorage.updateEmailAccount(id, req.body);
      await generateMailAccountsFile();

      // Start mailserver restart in background
      restartMailserverContainer();

      broadcastUpdate("email_account_updated", account);
      res.json({
        ...account,
        restartStatus: {
          isRestarting: true,
          message: "Email account updated. Mailserver is restarting..."
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to update email account" });
    }
  });

  app.delete("/api/email-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteEmailAccount(id);
      await generateMailAccountsFile();

      // Start mailserver restart in background
      restartMailserverContainer();

      broadcastUpdate("email_account_deleted", { id });
      res.json({
        success: true,
        restartStatus: {
          isRestarting: true,
          message: "Email account deleted. Mailserver is restarting..."
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email account" });
    }
  });

  app.post("/api/email-accounts/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await dbStorage.setDefaultEmailAccount(id);
      await generateMailAccountsFile();
      await restartMailserverContainer();
      broadcastUpdate("email_account_default_updated", account);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to set default email account" });
    }
  });



  // User Permissions routes
  app.get("/api/permissions", authenticateToken, async (req, res) => {
    try {
      const permissions = await dbStorage.getUserPermissions();
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user permissions" });
    }
  });

  app.get(
    "/api/users/:userId/permissions",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const permissions = await dbStorage.getUserPermissionsByUserId(userId);
        res.json(permissions);
      } catch (error) {
        res.status(500).json({ message: "Failed to get user permissions" });
      }
    },
  );

  app.put(
    "/api/users/:userId/permissions",
    authenticateToken,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const permissions = await dbStorage.updateUserPermissions(
          userId,
          req.body,
        );
        broadcastUpdate("user_permissions_updated", { userId, permissions });
        res.json(permissions);
      } catch (error) {
        console.error("Error updating permissions:", error);
        res.status(400).json({ message: "Failed to update user permissions" });
      }
    },
  );

  // User Profile routes
  app.put("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await dbStorage.updateUser(id, req.body);
      broadcastUpdate("user_updated", { user });
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(400).json({ message: "Failed to update user profile" });
    }
  });

  app.get("/api/users/:id/address", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const address = await dbStorage.getUserAddress(id);
      res.json(address);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user address" });
    }
  });

  app.put("/api/users/:id/address", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const address = await dbStorage.updateUserAddress(id, req.body);
      broadcastUpdate("user_address_updated", { userId: id, address });
      res.json(address);
    } catch (error) {
      console.error("Error updating user address:", error);
      res.status(400).json({ message: "Failed to update user address" });
    }
  });

  // Container Logos routes
  app.get("/api/docker/container-logos", authenticateToken, async (req, res) => {
    try {
      const { containerLogos } = await import("../shared/schema");
      const logos = await db.select().from(containerLogos);

      // Convert to object format for easy frontend consumption
      const logosMap = logos.reduce((acc, logo) => {
        acc[logo.containerId] = logo.logoUrl;
        return acc;
      }, {} as Record<string, string>);

      res.json(logosMap);
    } catch (error) {
      console.error("Error fetching container logos:", error);
      res.status(500).json({ error: "Failed to fetch container logos" });
    }
  });

  app.delete("/api/docker/container-logos/:containerId", authenticateToken, async (req, res) => {
    try {
      const { containerId } = req.params;
      const { containerLogos } = await import("../shared/schema");
      const { eq } = await import("drizzle-orm");

      const result = await db.delete(containerLogos)
        .where(eq(containerLogos.containerId, containerId));

      res.json({ success: true, deletedRows: result.rowCount });
    } catch (error) {
      console.error("Error deleting container logo:", error);
      res.status(500).json({ error: "Failed to delete container logo" });
    }
  });

  // Docker Containers routes (removed, replaced by real Docker API routes)
  // app.get("/api/docker-containers", authenticateToken, async (req, res) => { ... });
  // app.get("/api/docker-containers/:id", authenticateToken, async (req, res) => { ... });
  // app.post("/api/docker-containers", authenticateToken, async (req, res) => { ... });
  // app.put("/api/docker-containers/:id", authenticateToken, async (req, res) => { ... });
  // app.delete("/api/docker-containers/:id", authenticateToken, async (req, res) => { ... });

  // Docker container control routes (removed, replaced by real Docker API routes)
  // app.post("/api/docker-containers/:id/start", authenticateToken, async (req, res) => { ... });
  // app.post("/api/docker-containers/:id/stop", authenticateToken, async (req, res) => { ... });
  // app.post("/api/docker-containers/:id/restart", authenticateToken, async (req, res) => { ... });
  // app.post("/api/docker-containers/:id/pause", authenticateToken, async (req, res) => { ... });

  // Docker status endpoint
  app.get("/api/docker/status", authenticateToken, async (req, res) => {
    try {
      const { stdout } = await runDockerCommand("version --format '{{.Server.Version}}'");
      const version = stdout.trim();

      res.json({
        available: true,
        status: 'running',  // Adicionar campo status esperado pelo frontend
        version: version || 'unknown',
        method: 'child_process'
      });
    } catch (error) {
      res.json({
        available: false,
        status: 'stopped',  // Adicionar campo status esperado pelo frontend
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'child_process'
      });
    }
  });

  // Rotas da API Docker real

  /**
   * @swagger
   * /api/docker/containers:
   *   get:
   *     tags:
   *       - Docker
   *     summary: List Docker containers
   *     description: Returns a list of all Docker containers with their current status
   *     security:
   *       - sessionToken: []
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: List of Docker containers
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/DockerContainer'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Failed to list containers
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  app.get("/api/docker/containers", authenticateToken, async (req, res) => {
    try {
      const containers = await listDockerContainers();
      res.json(containers);
    } catch (error) {
      console.error("Failed to list Docker containers:", error);
      res.status(500).json({
        message: "Falha ao listar containers Docker",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * @swagger
   * /api/docker/containers/{id}/stats:
   *   get:
   *     tags:
   *       - Docker
   *     summary: Get container statistics
   *     description: Returns real-time statistics for a specific Docker container
   *     security:
   *       - sessionToken: []
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: Container ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Container statistics
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ContainerStats'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Container not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Failed to get container stats
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  // Container statistics endpoint
  app.get("/api/docker/containers/:id/stats", authenticateToken, async (req, res) => {
    try {
      const containerId = req.params.id;
      const containerStats = await getContainerStats(containerId);
      res.json(containerStats);
    } catch (error) {
      console.error("Failed to get container stats:", error);
      res.status(500).json({
        message: "Falha ao obter estatísticas do container",
        error: error instanceof Error ? error.message : 'Unknown error',
        mock: true, // Fallback to mock data
        data: {
          cpu: Math.random() * 50 + 10,
          memory: Math.random() * 60 + 20,
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  // Controles de containers via API Docker
  app.post(
    "/api/docker/containers/:id/start",
    authenticateToken,
    async (req, res) => {
      try {
        const containerId = req.params.id;

        await runDockerCommand(`start ${containerId}`);

        console.log(`Successfully started container ${containerId}`);
        res.json({
          message: `Container iniciado com sucesso`,
          containerId: containerId,
          status: 'started',
          method: 'child_process'
        });
      } catch (error) {
        console.error("Docker start error:", error);

        // Fallback para modo demo se Docker não estiver disponível
        if (error instanceof Error && (error.message.includes('command not found') || error.message.includes('Cannot connect'))) {
          console.log(`Mock: Started container ${req.params.id}`);
          res.json({
            message: `Container iniciado com sucesso (modo demo)`,
            containerId: req.params.id,
            status: 'started',
            mock: true,
            method: 'child_process'
          });
        } else {
          res.status(500).json({
            message: "Falha ao iniciar container",
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    },
  );

  app.post(
    "/api/docker/containers/:id/stop",
    authenticateToken,
    async (req, res) => {
      try {
        const containerId = req.params.id;

        await runDockerCommand(`stop ${containerId}`);

        console.log(`Successfully stopped container ${containerId}`);
        res.json({
          message: `Container parado com sucesso`,
          containerId: containerId,
          status: 'stopped',
          method: 'child_process'
        });
      } catch (error) {
        console.error("Docker stop error:", error);

        // Fallback para modo demo se Docker não estiver disponível
        if (error instanceof Error && (error.message.includes('command not found') || error.message.includes('Cannot connect'))) {
          console.log(`Mock: Stopped container ${req.params.id}`);
          res.json({
            message: `Container parado com sucesso (modo demo)`,
            containerId: req.params.id,
            status: 'stopped',
            mock: true,
            method: 'child_process'
          });
        } else {
          res.status(500).json({
            message: "Falha ao parar container",
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    },
  );

  app.post(
    "/api/docker/containers/:id/restart",
    authenticateToken,
    async (req, res) => {
      try {
        const containerId = req.params.id;

        await runDockerCommand(`restart ${containerId}`);

        console.log(`Successfully restarted container ${containerId}`);
        res.json({
          message: `Container reiniciado com sucesso`,
          containerId: containerId,
          status: 'restarted',
          method: 'child_process'
        });
      } catch (error) {
        console.error("Docker restart error:", error);

        // Fallback para modo demo se Docker não estiver disponível
        if (error instanceof Error && (error.message.includes('command not found') || error.message.includes('Cannot connect'))) {
          console.log(`Mock: Restarted container ${req.params.id}`);
          res.json({
            message: `Container reiniciado com sucesso (modo demo)`,
            containerId: req.params.id,
            status: 'restarted',
            mock: true,
            method: 'child_process'
          });
        } else {
          res.status(500).json({
            message: "Falha ao reiniciar container",
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    },
  );

  app.post(
    "/api/docker/containers/:id/pause",
    authenticateToken,
    async (req, res) => {
      try {
        const containerId = req.params.id;

        await runDockerCommand(`pause ${containerId}`);

        console.log(`Successfully paused container ${containerId}`);
        res.json({
          message: `Container pausado com sucesso`,
          containerId: containerId,
          status: 'paused',
          method: 'child_process'
        });
      } catch (error) {
        console.error("Docker pause error:", error);

        // Fallback para modo demo se Docker não estiver disponível
        if (error instanceof Error && (error.message.includes('command not found') || error.message.includes('Cannot connect'))) {
          console.log(`Mock: Paused container ${req.params.id}`);
          res.json({
            message: `Container pausado com sucesso (modo demo)`,
            containerId: req.params.id,
            status: 'paused',
            mock: true,
            method: 'child_process'
          });
        } else {
          res.status(500).json({
            message: "Falha ao pausar container",
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    },
  );

  const httpServer = createServer(app);

  // WebSocket Server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Store connected clients with session info
  const clients = new Map<WebSocket, { sessionToken?: string; user?: any }>();

  wss.on("connection", (ws: WebSocket, req: any) => {
    // console.log("New WebSocket connection established"); // Removed WebSocket log

    // Try to extract session token from cookies or headers
    let sessionToken: string | undefined;
    const cookies = req.headers.cookie;
    if (cookies) {
      const cookieMatch = cookies.match(/sessionToken=([^;]+)/);
      sessionToken = cookieMatch ? cookieMatch[1] : undefined;
    }

    clients.set(ws, { sessionToken });

    // Send initial connection confirmation
    ws.send(
      JSON.stringify({
        type: "connection",
        status: "connected",
        timestamp: new Date().toISOString(),
      }),
    );

    // Handle client messages
    ws.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "ping") {
          ws.send(
            JSON.stringify({
              type: "pong",
              timestamp: new Date().toISOString(),
            }),
          );
        } else if (data.type === "auth_status_request") {
          // Handle auth status request via WebSocket
          try {
            // Try to get fresh session token from cookies first
            let sessionToken: string | undefined;
            const cookies = req.headers.cookie;
            if (cookies) {
              const cookieMatch = cookies.match(/sessionToken=([^;]+)/);
              sessionToken = cookieMatch ? cookieMatch[1] : undefined;
            }
            
            // Fallback to stored client info if no cookie
            if (!sessionToken) {
              const clientInfo = clients.get(ws);
              sessionToken = clientInfo?.sessionToken;
            }
            
            // Update client info with current session token
            if (sessionToken) {
              const currentClientInfo = clients.get(ws) || {};
              clients.set(ws, { ...currentClientInfo, sessionToken });
            }

            console.log(`[WebSocket Auth Check] Fresh session token from cookies: ${!!sessionToken}`);

            if (!sessionToken) {
              console.log(`[WebSocket Auth Check] No session token found - sending auth_status_response with valid=false`);
              const response = {
                type: "auth_status_response",
                data: {
                  valid: false,
                  message: "No session token found",
                },
                timestamp: new Date().toISOString(),
              };
              ws.send(JSON.stringify(response));
              return;
            }

            // Validate session using existing auth logic
            const ipAddress =
              req.ip || req.connection?.remoteAddress || "websocket";
            console.log(`[WebSocket Auth Check] Validating session for token: ${sessionToken.substring(0, 10)}...`);
            const session = await dbStorage.validateSession(
              sessionToken,
              ipAddress,
            );

            if (session) {
              // Update client info with user data
              clients.set(ws, { sessionToken, user: session.user });
              console.log(`[WebSocket Auth Check] Session valid for user: ${session.user.username}`);

              const response = {
                type: "auth_status_response",
                data: {
                  valid: true,
                  user: session.user,
                  message: "Session valid",
                },
                timestamp: new Date().toISOString(),
              };
              ws.send(JSON.stringify(response));
            } else {
              console.log(`[WebSocket Auth Check] Session validation failed - sending session_expired`);
              const response = {
                type: "session_expired",
                data: {
                  valid: false,
                  message: "Session expired or invalid",
                },
                timestamp: new Date().toISOString(),
              };
              ws.send(JSON.stringify(response));
            }
          } catch (authError) {
            console.error("WebSocket auth check error:", authError);
            const response = {
              type: "auth_status_response",
              data: {
                valid: false,
                message: "Session validation failed",
              },
              timestamp: new Date().toISOString(),
            };
            ws.send(JSON.stringify(response));
          }
        }
      } catch (error) {
        // console.error("Error parsing WebSocket message:", error); // Removed WebSocket log
      }
    });

    // Handle disconnection
    ws.on("close", () => {
      // console.log("WebSocket connection closed"); // Removed WebSocket log
      clients.delete(ws);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });
  });

  // Function to broadcast updates to all connected clients
  function broadcastUpdate(type: string, data: any) {
    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString(),
    });

    clients.forEach((clientInfo, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Function to broadcast dashboard stats updates
  async function broadcastDashboardUpdate() {
    try {
      const stats = await dbStorage.getDashboardStats(1);
      broadcastUpdate("dashboard_stats_updated", stats);
    } catch (error) {
      console.error("Failed to broadcast dashboard update:", error);
    }
  }

  // Override API endpoints to broadcast real-time updates

  // Clients - broadcast on all operations
  app.post("/api/clients", async (req, res) => {
    try {
      const client = await dbStorage.createClient(req.body);
      broadcastUpdate("client_created", client);
      broadcastDashboardUpdate(); // Update dashboard counters
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await dbStorage.updateClient(id, req.body);
      broadcastUpdate("client_updated", client);
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      await dbStorage.deleteClient(id);
      broadcastUpdate("client_deleted", { id });
      broadcastDashboardUpdate(); // Update dashboard counters
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete client:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete client";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Products - broadcast on all operations
  app.post("/api/products", async (req, res) => {
    try {
      const product = await dbStorage.createProduct(req.body);
      broadcastUpdate("product_created", product);
      broadcastDashboardUpdate();
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await dbStorage.updateProduct(id, req.body);
      broadcastUpdate("product_updated", product);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteProduct(id);
      broadcastUpdate("product_deleted", { id });
      broadcastDashboardUpdate();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Suppliers - broadcast on all operations
  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplier = await dbStorage.createSupplier(req.body);
      broadcastUpdate("supplier_created", supplier);
      broadcastDashboardUpdate();
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await dbStorage.updateSupplier(id, req.body);
      broadcastUpdate("supplier_updated", supplier);
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSupplier(id);
      broadcastUpdate("supplier_deleted", { id });
      broadcastDashboardUpdate();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Sales - broadcast on all operations
  app.post("/api/sales", async (req, res) => {
    try {
      const sale = await dbStorage.createSale(req.body);
      broadcastUpdate("sale_created", sale);
      broadcastDashboardUpdate();
      res.status(201).json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.put("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sale = await dbStorage.updateSale(id, req.body);
      broadcastUpdate("sale_updated", sale);
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sale" });
    }
  });

  app.delete("/api/sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSale(id);
      broadcastUpdate("sale_deleted", { id });
      broadcastDashboardUpdate();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Support Tickets - broadcast on all operations
  app.post("/api/support/tickets", async (req, res) => {
    try {
      const ticket = await dbStorage.createSupportTicket(req.body);
      broadcastUpdate("ticket_created", ticket);
      broadcastDashboardUpdate();
      res.status(201).json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.put("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await dbStorage.updateSupportTicket(id, req.body);
      broadcastUpdate("ticket_updated", ticket);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  app.delete("/api/support/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteSupportTicket(id);
      broadcastUpdate("ticket_deleted", { id });
      broadcastDashboardUpdate();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete support ticket" });
    }
  });

  // Support Ticket Messages - broadcast on all operations
  app.post("/api/support/tickets/:id/messages", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const message = await dbStorage.createSupportTicketMessage({
        ...req.body,
        ticketId,
      });
      broadcastUpdate("ticket_message_created", { ticketId, message });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ticket message" });
    }
  });

  // Firewall API routes
  const execAsync = promisify(exec);

  // Safety check function to ensure we don't break essential services
  function validateFirewallOperation(command: string): { valid: boolean; reason?: string } {
    const protectedPorts = ['22', '80', '443', '25', '587', '993', '995'];
    const dangerousPatterns = [
      'iptables -F', // Don't allow flushing all rules
      'iptables -P', // Don't allow policy changes
      '--dport 22.*DROP', // Block SSH
      '--dport 22.*REJECT', // Block SSH
    ];

    // Check for dangerous patterns
    for (const pattern of dangerousPatterns) {
      if (command.match(new RegExp(pattern, 'i'))) {
        return { valid: false, reason: `Command contains dangerous pattern: ${pattern}` };
      }
    }

    // Check for protected port blocking
    for (const port of protectedPorts) {
      if (command.includes(`--dport ${port}`) && (command.includes('DROP') || command.includes('REJECT'))) {
        return { valid: false, reason: `Port ${port} is protected and cannot be blocked` };
      }
    }

    return { valid: true };
  }

  // Helper function to parse iptables output
  function parseIptablesRules(output: string): any[] {
    const lines = output.split('\n').filter(line => {
      const trimmed = line.trim();
      // Filter out empty lines, chain headers, and column headers
      return trimmed &&
        !trimmed.startsWith('Chain') &&
        !trimmed.startsWith('target') &&
        !trimmed.startsWith('num') &&
        !trimmed.match(/^target\s+prot\s+opt/);
    });

    return lines.map((line, index) => {
      const parts = line.trim().split(/\s+/);

      // Skip if not enough parts for a valid rule
      if (parts.length < 4) return null;

      // For numbered output, the first part is the line number
      const hasLineNumber = /^\d+$/.test(parts[0]);
      const offset = hasLineNumber ? 1 : 0;

      return {
        id: `rule_${index}`,
        chain: 'INPUT',
        target: parts[offset],
        protocol: parts[offset + 1] !== 'all' ? parts[offset + 1] : undefined,
        source: parts[offset + 3] !== '0.0.0.0/0' ? parts[offset + 3] : undefined,
        destination: parts[offset + 4] !== '0.0.0.0/0' ? parts[offset + 4] : undefined,
        port: extractPort(line),
        interface: extractInterface(line),
        state: extractState(line),
        comment: extractComment(line),
        line_number: hasLineNumber ? parseInt(parts[0]) : index + 1,
        rule_text: line.trim(),
        is_custom: !isSystemRule(line)
      };
    }).filter(Boolean);
  }

  function extractPort(rule: string): string | undefined {
    const portMatch = rule.match(/dpt:(\d+)/);
    if (portMatch) return portMatch[1];

    const portRangeMatch = rule.match(/dpts:(\d+:\d+)/);
    if (portRangeMatch) return portRangeMatch[1];

    return undefined;
  }

  function extractInterface(rule: string): string | undefined {
    const interfaceMatch = rule.match(/in:(\w+)/);
    return interfaceMatch ? interfaceMatch[1] : undefined;
  }

  function extractState(rule: string): string | undefined {
    const stateMatch = rule.match(/state\s+(\w+)/);
    return stateMatch ? stateMatch[1] : undefined;
  }

  function extractComment(rule: string): string | undefined {
    const commentMatch = rule.match(/\/\*\s*(.+?)\s*\*\//);
    return commentMatch ? commentMatch[1] : undefined;
  }

  function isSystemRule(rule: string): boolean {
    // Consider rules as system rules if they contain certain keywords
    const systemKeywords = ['ESTABLISHED', 'RELATED', 'lo', 'localhost'];

    // If rule has a "Quick action" comment, it's a custom rule
    if (rule.includes('Quick action:')) {
      return false;
    }

    // If rule has any comment (/* ... */), it's likely custom
    if (rule.includes('/*') && rule.includes('*/')) {
      return false;
    }

    return systemKeywords.some(keyword => rule.includes(keyword));
  }

  // Get all firewall rules
  app.get("/api/firewall/rules", async (req, res) => {
    try {
      const { stdout } = await execAsync('iptables -L INPUT -n --line-numbers');
      const rules = parseIptablesRules(stdout);
      res.json(rules);
    } catch (error) {
      console.error('Error fetching firewall rules:', error);
      res.status(500).json({ message: "Failed to fetch firewall rules" });
    }
  });

  // Get firewall statistics
  app.get("/api/firewall/stats", async (req, res) => {
    try {
      const { stdout } = await execAsync('iptables -L INPUT -n');
      const rules = parseIptablesRules(stdout);

      const stats = {
        total_rules: rules.length,
        allow_rules: rules.filter(r => r.target === 'ACCEPT').length,
        deny_rules: rules.filter(r => r.target === 'DROP' || r.target === 'REJECT').length,
        custom_rules: rules.filter(r => r.is_custom).length,
        protected_ports: ['22', '80', '443', '25', '587', '993', '995'],
        status: 'active' as const
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching firewall stats:', error);
      res.status(500).json({ message: "Failed to fetch firewall statistics" });
    }
  });

  // Add new firewall rule
  app.post("/api/firewall/rules", async (req, res) => {
    try {
      const { action, protocol, source_ip, destination_ip, port, interface: iface, comment } = req.body;

      // Validate protected ports
      const protectedPorts = ['22', '80', '443', '25', '587', '993', '995'];
      if ((action === 'DROP' || action === 'REJECT') && port && protectedPorts.includes(port)) {
        return res.status(400).json({
          message: `Port ${port} is protected and cannot be blocked`
        });
      }

      // Build iptables command
      let command = 'iptables -A INPUT';

      if (protocol && protocol !== 'all') {
        command += ` -p ${protocol}`;
      }

      if (source_ip && source_ip.trim()) {
        command += ` -s ${source_ip.trim()}`;
      }

      if (destination_ip && destination_ip.trim()) {
        command += ` -d ${destination_ip.trim()}`;
      }

      if (port && port.trim() && (protocol === 'tcp' || protocol === 'udp')) {
        command += ` --dport ${port.trim()}`;
      }

      if (iface && iface.trim()) {
        command += ` -i ${iface.trim()}`;
      }

      if (comment && comment.trim()) {
        command += ` -m comment --comment "${comment.trim()}"`;
      }

      command += ` -j ${action}`;

      // Validate the command for safety
      const validation = validateFirewallOperation(command);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.reason });
      }

      // Execute the command
      await execAsync(command);

      res.json({ success: true, message: "Firewall rule added successfully" });
    } catch (error) {
      console.error('Error adding firewall rule:', error);
      res.status(500).json({ message: "Failed to add firewall rule" });
    }
  });

  // Delete firewall rule
  app.delete("/api/firewall/rules/:id", async (req, res) => {
    try {
      const ruleId = req.params.id;

      // Get current rules to find the actual line number
      const { stdout } = await execAsync('iptables -L INPUT -n --line-numbers');
      const rules = parseIptablesRules(stdout);

      // Find the rule by ID
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }

      // Check if it's a custom rule (only custom rules can be deleted)
      if (!rule.is_custom) {
        return res.status(400).json({ message: "System rules cannot be deleted" });
      }

      console.log(`Deleting rule at line ${rule.line_number}: ${rule.rule_text}`);

      // Validate line number is within valid range
      if (rule.line_number < 1 || rule.line_number > rules.length) {
        console.error(`Invalid line number ${rule.line_number}, total rules: ${rules.length}`);
        return res.status(400).json({ message: "Invalid rule position" });
      }

      // Delete the rule by line number (iptables uses 1-based indexing)
      await execAsync(`iptables -D INPUT ${rule.line_number}`);

      res.json({ success: true, message: "Firewall rule deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting firewall rule:', error);
      const errorMessage = error?.message || 'Unknown error';

      // Handle specific iptables errors
      if (errorMessage.includes('Index of deletion too big')) {
        return res.status(400).json({
          message: "Rule position is invalid - the rule list may have changed. Please refresh and try again."
        });
      }

      res.status(500).json({ message: `Failed to delete firewall rule: ${errorMessage}` });
    }
  });

  // Update firewall rule
  app.put("/api/firewall/rules/:id", async (req, res) => {
    try {
      const ruleId = req.params.id;
      const { action, protocol, source_ip, destination_ip, port, interface: iface, comment } = req.body;

      // Get current rules to find the actual line number
      const { stdout } = await execAsync('iptables -L INPUT -n --line-numbers');
      const rules = parseIptablesRules(stdout);

      // Find the rule by ID
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) {
        return res.status(404).json({ message: "Rule not found" });
      }

      // Check if it's a custom rule (only custom rules can be edited)
      if (!rule.is_custom) {
        return res.status(400).json({ message: "System rules cannot be edited" });
      }

      console.log(`Updating rule at line ${rule.line_number}: ${rule.rule_text}`);

      // First delete the old rule
      await execAsync(`iptables -D INPUT ${rule.line_number}`);

      // Build new rule command (insert at the same position)
      let command = `iptables -I INPUT ${rule.line_number}`;

      if (protocol && protocol !== 'all') {
        command += ` -p ${protocol}`;
      }

      if (source_ip && source_ip.trim()) {
        command += ` -s ${source_ip.trim()}`;
      }

      if (destination_ip && destination_ip.trim()) {
        command += ` -d ${destination_ip.trim()}`;
      }

      if (port && port.trim()) {
        if (protocol === 'tcp' || protocol === 'udp') {
          command += ` --dport ${port.trim()}`;
        }
      }

      if (iface && iface.trim()) {
        command += ` -i ${iface.trim()}`;
      }

      command += ` -j ${action}`;

      if (comment && comment.trim()) {
        command += ` -m comment --comment "${comment.trim()}"`;
      }

      console.log(`Executing update command: ${command}`);

      // Execute the new rule
      await execAsync(command);

      res.json({ success: true, message: "Firewall rule updated successfully" });
    } catch (error) {
      console.error('Error updating firewall rule:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: `Failed to update firewall rule: ${errorMessage}` });
    }
  });

  // Quick action (block/allow IP)
  app.post("/api/firewall/quick-action", async (req, res) => {
    try {
      const { action, target } = req.body;

      if (!target || !target.trim()) {
        return res.status(400).json({ message: "Target IP is required" });
      }

      const cleanTarget = target.trim();

      // Enhanced IP validation - supports IP addresses, CIDR ranges, and ranges
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
      const ipRangeRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\-(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

      if (!ipRegex.test(cleanTarget) && !ipRangeRegex.test(cleanTarget)) {
        return res.status(400).json({
          message: "Invalid IP address format. Supported formats: 192.168.1.1, 192.168.1.0/24, 192.168.1.1-192.168.1.10"
        });
      }

      let command;
      const comment = `Quick action: ${action} ${cleanTarget}`;

      if (action === 'block') {
        command = `iptables -A INPUT -s ${cleanTarget} -j DROP -m comment --comment "${comment}"`;
      } else if (action === 'allow') {
        command = `iptables -A INPUT -s ${cleanTarget} -j ACCEPT -m comment --comment "${comment}"`;
      } else {
        return res.status(400).json({ message: "Invalid action. Use 'block' or 'allow'" });
      }

      console.log(`Executing quick action command: ${command}`);
      await execAsync(command);

      res.json({
        success: true,
        message: `IP ${cleanTarget} has been ${action === 'block' ? 'blocked' : 'allowed'} successfully`
      });
    } catch (error) {
      console.error('Error executing quick action:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: `Failed to execute quick action: ${errorMessage}` });
    }
  });

  // Flush custom rules (keep system rules)
  app.post("/api/firewall/flush", async (req, res) => {
    try {
      // Get current rules
      const { stdout } = await execAsync('iptables -L INPUT -n --line-numbers');
      const rules = parseIptablesRules(stdout);

      // Find custom rules and delete them (in reverse order to maintain line numbers)
      const customRules = rules.filter(r => r.is_custom).reverse();

      for (const rule of customRules) {
        try {
          await execAsync(`iptables -D INPUT ${rule.line_number}`);
        } catch (error) {
          console.error(`Error deleting rule ${rule.line_number}:`, error);
        }
      }

      res.json({ success: true, message: "Custom firewall rules flushed successfully" });
    } catch (error) {
      console.error('Error flushing firewall rules:', error);
      res.status(500).json({ message: "Failed to flush firewall rules" });
    }
  });

  // Save rules permanently
  app.post("/api/firewall/save", async (req, res) => {
    try {
      let saved = false;
      let lastError: any = null;

      // Try different methods to save iptables rules permanently
      try {
        await execAsync('/usr/sbin/iptables-save > /etc/iptables/rules.v4');
        console.log('Rules saved to /etc/iptables/rules.v4');
        saved = true;
      } catch (error) {
        lastError = error;
        try {
          await execAsync('mkdir -p /etc/sysconfig && /usr/sbin/iptables-save > /etc/sysconfig/iptables');
          console.log('Rules saved to /etc/sysconfig/iptables');
          saved = true;
        } catch (error2) {
          lastError = error2;
          try {
            // Fallback: save to a custom location
            await execAsync('mkdir -p /var/lib/iptables && /usr/sbin/iptables-save > /var/lib/iptables/rules.v4');
            console.log('Rules saved to /var/lib/iptables/rules.v4');
            saved = true;
          } catch (error3) {
            lastError = error3;
            console.error('All save methods failed, rules are temporary:', error3);
          }
        }
      }

      if (saved) {
        res.json({ success: true, message: "Firewall rules saved permanently" });
      } else {
        console.error('Save failed with error:', lastError);
        res.status(500).json({
          success: false,
          message: "Failed to save firewall rules",
          error: lastError?.message || 'Unknown error'
        });
      }
    } catch (error: any) {
      console.error('Error saving firewall rules:', error);
      res.status(500).json({
        success: false,
        message: "Failed to save firewall rules",
        error: error?.message || 'Unknown error'
      });
    }
  });

  // Enable iptables firewall
  app.post("/api/firewall/enable", async (req, res) => {
    try {
      // Start iptables service and set default policies
      try {
        await execAsync('systemctl start iptables');
      } catch (error) {
        try {
          await execAsync('service iptables start');
        } catch (error) {
          // If service doesn't exist, just ensure iptables is working
          await execAsync('iptables -L > /dev/null');
        }
      }

      // Set basic security policies (allow loopback, established connections)
      await execAsync('iptables -A INPUT -i lo -j ACCEPT');
      await execAsync('iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT');

      res.json({ success: true, message: "Firewall enabled successfully" });
    } catch (error) {
      console.error('Error enabling firewall:', error);
      res.status(500).json({ message: "Failed to enable firewall" });
    }
  });

  // Disable iptables firewall
  app.post("/api/firewall/disable", async (req, res) => {
    try {
      // Set all chains to ACCEPT policy and flush rules
      await execAsync('iptables -P INPUT ACCEPT');
      await execAsync('iptables -P FORWARD ACCEPT');
      await execAsync('iptables -P OUTPUT ACCEPT');
      await execAsync('iptables -F');
      await execAsync('iptables -X');
      await execAsync('iptables -t nat -F');
      await execAsync('iptables -t nat -X');
      await execAsync('iptables -t mangle -F');
      await execAsync('iptables -t mangle -X');

      // Try to stop iptables service
      try {
        await execAsync('systemctl stop iptables');
      } catch (error) {
        try {
          await execAsync('service iptables stop');
        } catch (error) {
          // Service might not exist, which is fine
          console.log('iptables service not found, rules cleared manually');
        }
      }

      res.json({ success: true, message: "Firewall disabled successfully" });
    } catch (error) {
      console.error('Error disabling firewall:', error);
      res.status(500).json({ message: "Failed to disable firewall" });
    }
  });

  // Restart iptables firewall
  app.post("/api/firewall/restart", async (req, res) => {
    try {
      // Clear all rules first
      await execAsync('iptables -F');
      await execAsync('iptables -X');
      await execAsync('iptables -t nat -F');
      await execAsync('iptables -t nat -X');
      await execAsync('iptables -t mangle -F');
      await execAsync('iptables -t mangle -X');

      // Restart iptables service
      try {
        await execAsync('systemctl restart iptables');
      } catch (error) {
        try {
          await execAsync('service iptables restart');
        } catch (error) {
          // If service doesn't exist, restore basic rules
          await execAsync('iptables -P INPUT ACCEPT');
          await execAsync('iptables -P FORWARD ACCEPT');
          await execAsync('iptables -P OUTPUT ACCEPT');
        }
      }

      // Restore basic security rules
      await execAsync('iptables -A INPUT -i lo -j ACCEPT');
      await execAsync('iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT');

      // Try to restore saved rules
      try {
        await execAsync('iptables-restore < /etc/iptables/rules.v4');
      } catch (error) {
        try {
          await execAsync('iptables-restore < /etc/sysconfig/iptables');
        } catch (error) {
          console.log('No saved rules found, using basic configuration');
        }
      }

      res.json({ success: true, message: "Firewall restarted successfully" });
    } catch (error) {
      console.error('Error restarting firewall:', error);
      res.status(500).json({ message: "Failed to restart firewall" });
    }
  });

  // Get firewall service status
  app.get("/api/firewall/status", async (req, res) => {
    try {
      let serviceStatus = 'unknown';
      let serviceActive = false;

      // Check if iptables service is running
      try {
        const { stdout } = await execAsync('systemctl is-active iptables');
        serviceStatus = stdout.trim();
        serviceActive = serviceStatus === 'active';
      } catch (error) {
        try {
          const { stdout } = await execAsync('service iptables status');
          serviceActive = stdout.includes('running') || stdout.includes('active');
          serviceStatus = serviceActive ? 'active' : 'inactive';
        } catch (error) {
          // Check if iptables is functional by running a simple command
          try {
            await execAsync('iptables -L -n | head -1');
            serviceStatus = 'running';
            serviceActive = true;
          } catch (error) {
            serviceStatus = 'inactive';
            serviceActive = false;
          }
        }
      }

      // Count current rules
      let ruleCount = 0;
      try {
        const { stdout } = await execAsync('iptables -L INPUT -n | wc -l');
        ruleCount = Math.max(0, parseInt(stdout.trim()) - 2); // Subtract header lines
      } catch (error) {
        ruleCount = 0;
      }

      res.json({
        service_status: serviceStatus,
        is_active: serviceActive,
        rule_count: ruleCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting firewall status:', error);
      res.status(500).json({ message: "Failed to get firewall status" });
    }
  });

  // Get network interfaces
  app.get("/api/firewall/interfaces", async (req, res) => {
    try {
      const { stdout } = await execAsync('ip link show');

      const interfaces = [];
      const lines = stdout.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/^\d+:/)) {
          const match = line.match(/^\d+:\s+(\w+):\s+<([^>]*)>/);
          if (match) {
            const name = match[1];
            const flags = match[2].split(',');

            // Get interface details
            let ip = '';
            let state = 'DOWN';
            let type = 'unknown';
            let rxBytes = 0;
            let txBytes = 0;
            let rxPackets = 0;
            let txPackets = 0;

            try {
              const { stdout: ipInfo } = await execAsync(`ip addr show ${name}`);
              const ipMatch = ipInfo.match(/inet\s+([^\s]+)/);
              if (ipMatch) {
                ip = ipMatch[1];
              }

              if (flags.includes('UP')) {
                state = 'UP';
              }

              if (name.startsWith('eth') || name.startsWith('enp')) {
                type = 'ethernet';
              } else if (name.startsWith('wlan') || name.startsWith('wlp')) {
                type = 'wireless';
              } else if (name === 'lo') {
                type = 'loopback';
              } else if (name.startsWith('docker') || name.startsWith('br-')) {
                type = 'bridge';
              } else if (name.startsWith('veth')) {
                type = 'virtual';
              }

              // Get network statistics from /proc/net/dev
              const { stdout: netDev } = await execAsync('cat /proc/net/dev');
              const netDevLines = netDev.split('\n');
              for (const devLine of netDevLines) {
                if (devLine.includes(`${name}:`)) {
                  const parts = devLine.trim().split(/\s+/);
                  if (parts.length >= 17) {
                    // Format: interface: rx_bytes rx_packets rx_errs rx_drop ... tx_bytes tx_packets tx_errs tx_drop ...
                    rxBytes = parseInt(parts[1]) || 0;
                    rxPackets = parseInt(parts[2]) || 0;
                    txBytes = parseInt(parts[9]) || 0;
                    txPackets = parseInt(parts[10]) || 0;
                  }
                  break;
                }
              }
            } catch (error) {
              // Continue with basic info if detailed info fails
            }

            interfaces.push({
              name,
              ip,
              state,
              type,
              flags,
              stats: {
                rx_bytes: rxBytes,
                tx_bytes: txBytes,
                rx_packets: rxPackets,
                tx_packets: txPackets
              }
            });
          }
        }
      }

      res.json(interfaces);
    } catch (error) {
      console.error('Error getting network interfaces:', error);
      res.status(500).json({ message: "Failed to get network interfaces" });
    }
  });

  // Users API routes for database administration
  app.get("/api/users", async (req, res) => {
    try {
      const users = await dbStorage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await dbStorage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const user = await dbStorage.createUser(req.body);
      broadcastUpdate("user_created", user);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await dbStorage.updateUser(id, req.body);
      broadcastUpdate("user_updated", user);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteUser(id);
      broadcastUpdate("user_deleted", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Scheduled Tasks routes
  app.get("/api/scheduled-tasks", authenticateToken, async (req, res) => {
    try {
      const tasks = await dbStorage.getScheduledTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error getting scheduled tasks:", error);
      res.status(500).json({ message: "Failed to get scheduled tasks" });
    }
  });

  app.get("/api/scheduled-tasks/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await dbStorage.getScheduledTask(id);
      if (!task) {
        return res.status(404).json({ message: "Scheduled task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error getting scheduled task:", error);
      res.status(500).json({ message: "Failed to get scheduled task" });
    }
  });

  app.post("/api/scheduled-tasks", authenticateToken, async (req, res) => {
    try {
      const taskData = {
        ...req.body,
        type: req.body.type || 'user',
        status: req.body.status || 'active'
      };
      const task = await dbStorage.createScheduledTask(taskData);

      // Schedule the task in the internal scheduler
      if (taskScheduler && task.status === 'active') {
        taskScheduler.scheduleTask(task);
      }

      broadcastUpdate("scheduled_task_created", task);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating scheduled task:", error);
      res.status(500).json({ message: "Failed to create scheduled task" });
    }
  });

  app.put("/api/scheduled-tasks/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await dbStorage.updateScheduledTask(id, req.body);

      // Update task in the internal scheduler
      if (taskScheduler) {
        taskScheduler.updateTask(task);
      }

      broadcastUpdate("scheduled_task_updated", task);
      res.json(task);
    } catch (error) {
      console.error("Error updating scheduled task:", error);
      res.status(500).json({ message: "Failed to update scheduled task" });
    }
  });

  app.delete("/api/scheduled-tasks/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteScheduledTask(id);

      // Remove task from the internal scheduler
      if (taskScheduler) {
        taskScheduler.removeTask(id.toString());
      }

      broadcastUpdate("scheduled_task_deleted", { id });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scheduled task:", error);
      res.status(500).json({ message: "Failed to delete scheduled task" });
    }
  });

  app.patch("/api/scheduled-tasks/:id/toggle", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await dbStorage.getScheduledTask(id);

      if (!task) {
        return res.status(404).json({ message: "Scheduled task not found" });
      }

      const newStatus = task.status === 'active' ? 'inactive' : 'active';
      const updatedTask = await dbStorage.updateScheduledTask(id, { status: newStatus });

      // Update task in the internal scheduler
      if (taskScheduler) {
        if (newStatus === 'active') {
          taskScheduler.scheduleTask(updatedTask);
        } else {
          taskScheduler.removeTask(id.toString());
        }
      }

      broadcastUpdate("scheduled_task_updated", updatedTask);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error toggling scheduled task:", error);
      res.status(500).json({ message: "Failed to toggle scheduled task" });
    }
  });

  app.post("/api/scheduled-tasks/:id/run", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await dbStorage.getScheduledTask(id);

      if (!task) {
        return res.status(404).json({ message: "Scheduled task not found" });
      }

      // Execute task immediately
      if (taskScheduler) {
        const result = await taskScheduler.executeTask(task);
        res.json({
          message: "Task executed successfully",
          result,
          executedAt: new Date().toISOString()
        });
      } else {
        res.status(500).json({ message: "Task scheduler not available" });
      }
    } catch (error) {
      console.error("Error running scheduled task:", error);
      res.status(500).json({ message: "Failed to run scheduled task" });
    }
  });

  // Alias for frontend compatibility
  app.post("/api/scheduled-tasks/:id/execute", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Executing task with ID: ${id}`);

      const task = await dbStorage.getScheduledTask(id);

      if (!task) {
        console.log(`Task ${id} not found`);
        return res.status(404).json({ message: "Scheduled task not found" });
      }

      console.log(`Found task: ${task.name}`);

      // Execute task immediately
      if (taskScheduler) {
        console.log(`Executing task through scheduler...`);
        const result = await taskScheduler.executeTask(task);
        console.log(`Task execution result:`, result);

        res.json({
          success: result.success,
          output: result.output || 'No output',
          error: result.error || null,
          executedAt: result.executedAt,
          duration: result.duration || 0,
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Default next run in 24h
        });
      } else {
        console.log(`Task scheduler not available`);
        res.status(500).json({ message: "Task scheduler not available" });
      }
    } catch (error) {
      console.error("Error executing scheduled task:", error);
      res.status(500).json({ message: "Failed to execute scheduled task", error: (error as Error).message });
    }
  });

  // Activity Logs Routes
  app.get("/api/logs", authenticateToken, async (req, res) => {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 25,
        level: req.query.level as string,
        category: req.query.category as string,
        search: req.query.search as string,
        dateFilter: req.query.dateFilter as string,
      };

      const result = await ActivityLogger.getLogs(filters);
      res.json(result);
    } catch (error) {
      console.error("Error getting logs:", error);
      res.status(500).json({ error: "Failed to get logs" });
    }
  });

  app.get("/api/logs/categories", authenticateToken, async (req, res) => {
    try {
      const categories = await ActivityLogger.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error getting log categories:", error);
      res.status(500).json({ error: "Failed to get categories" });
    }
  });

  app.post("/api/logs/clear", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const filters = req.body;

      // Log the clear action
      await ActivityLogger.log({
        level: 'info',
        category: 'system',
        message: `Logs cleared by ${user.email}`,
        details: { filters },
        userId: user.id,
        userEmail: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        action: 'CLEAR',
        resource: 'activity_logs',
      });

      const result = await ActivityLogger.clearLogs(filters);
      res.json(result);
    } catch (error) {
      console.error("Error clearing logs:", error);
      res.status(500).json({ error: "Failed to clear logs" });
    }
  });

  app.post("/api/logs/export", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const filters = req.body;

      const result = await ActivityLogger.getLogs({
        ...filters,
        pageSize: 10000, // Export large batch
      });

      // Log the export action
      await ActivityLogger.log({
        level: 'info',
        category: 'system',
        message: `Logs exported by ${user.email}`,
        details: { filters, exportedCount: result.logs.length },
        userId: user.id,
        userEmail: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        action: 'EXPORT',
        resource: 'activity_logs',
      });

      // Create CSV
      const csv = [
        'Timestamp,Level,Category,Message,User,IP,Action,Resource',
        ...result.logs.map((log: any) => [
          log.timestamp.toISOString(),
          log.level,
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          log.userEmail || '',
          log.ipAddress || '',
          log.action || '',
          log.resource || '',
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity-logs.csv');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting logs:", error);
      res.status(500).json({ error: "Failed to export logs" });
    }
  });

  // Store broadcast function globally for access from other modules
  (global as any).broadcastUpdate = broadcastUpdate;

  // Generate initial mail_accounts.cf file
  generateMailAccountsFile();

  // Evolution API Routes
  /**
   * @swagger
   * /api/evolution/instances:
   *   get:
   *     tags:
   *       - Evolution API
   *     summary: Listar instâncias Evolution
   *     description: Retorna a lista de todas as instâncias Evolution API
   *     security:
   *       - sessionToken: []
   *     responses:
   *       200:
   *         description: Lista de instâncias Evolution
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   */
  app.get("/api/evolution/instances", authenticateToken, async (req: any, res: any) => {
    try {
      const result = await evolutionService.getAllInstances();
      res.json(result);
    } catch (error) {
      console.error("Error getting Evolution instances:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ success: false, error: errMsg });
    }
  });

  /**
   * @swagger
   * /api/evolution/instance/{instanceName}:
   *   get:
   *     tags:
   *       - Evolution API
   *     summary: Obter instância específica
   *     description: Retorna informações de uma instância específica
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: instanceName
   *         required: true
   *         schema:
   *           type: string
   *         description: Nome da instância
   *     responses:
   *       200:
   *         description: Dados da instância
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  app.get("/api/evolution/instance/:instanceName", authenticateToken, async (req: any, res: any) => {
    try {
      const { instanceName } = req.params;
      const result = await evolutionService.getInstance(instanceName);
      res.json(result);
    } catch (error) {
      console.error("Error getting Evolution instance:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ success: false, error: errMsg });
    }
  });

  /**
   * @swagger
   * /api/evolution/instance/{instanceName}/status:
   *   get:
   *     tags:
   *       - Evolution API
   *     summary: Status da instância
   *     description: Retorna o status de conexão de uma instância
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: instanceName
   *         required: true
   *         schema:
   *           type: string
   *         description: Nome da instância
   *     responses:
   *       200:
   *         description: Status da instância
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  app.get("/api/evolution/instance/:instanceName/status", authenticateToken, async (req: any, res: any) => {
    try {
      const { instanceName } = req.params;
      const result = await evolutionService.getInstanceStatus(instanceName);
      res.json(result);
    } catch (error) {
      console.error("Error getting Evolution instance status:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ success: false, error: errMsg });
    }
  });

  /**
   * @swagger
   * /api/evolution/instance/{instanceName}/qrcode:
   *   get:
   *     tags:
   *       - Evolution API
   *     summary: QR Code da instância
   *     description: Gera QR Code para conexão da instância
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: instanceName
   *         required: true
   *         schema:
   *           type: string
   *         description: Nome da instância
   *     responses:
   *       200:
   *         description: QR Code gerado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 qrcode:
   *                   type: string
   *                   description: QR Code em base64
   */
  app.get("/api/evolution/instance/:instanceName/qrcode", authenticateToken, async (req: any, res: any) => {
    try {
      const { instanceName } = req.params;
      const result = await evolutionService.connectInstance(instanceName);
      res.json(result);
    } catch (error) {
      console.error("Error generating QR Code:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ success: false, error: errMsg });
    }
  });

  /**
   * @swagger
   * /api/evolution/instance:
   *   post:
   *     tags:
   *       - Evolution API
   *     summary: Criar nova instância
   *     description: Cria uma nova instância Evolution API
   *     security:
   *       - sessionToken: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - instanceName
   *             properties:
   *               instanceName:
   *                 type: string
   *                 description: Nome da nova instância
   *               token:
   *                 type: string
   *                 description: Token para a instância
   *               webhook:
   *                 type: string
   *                 description: URL do webhook
   *     responses:
   *       201:
   *         description: Instância criada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  app.post("/api/evolution/instance", authenticateToken, async (req: any, res: any) => {
    try {
      const { instanceName, webhook } = req.body;
      const result = await evolutionService.createInstance(instanceName, { url: webhook, enabled: true, events: [] });
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating Evolution instance:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ success: false, error: errMsg });
    }
  });

  /**
   * @swagger
   * /api/evolution/instance/{instanceName}/restart:
   *   put:
   *     tags:
   *       - Evolution API
   *     summary: Reiniciar instância
   *     description: Reinicia uma instância Evolution API
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: instanceName
   *         required: true
   *         schema:
   *           type: string
   *         description: Nome da instância
   *     responses:
   *       200:
   *         description: Instância reiniciada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  app.put("/api/evolution/instance/:instanceName/restart", authenticateToken, async (req: any, res: any) => {
    try {
      const { instanceName } = req.params;
      const result = await evolutionService.restartInstance(instanceName);
      res.json(result);
    } catch (error) {
      console.error("Error restarting Evolution instance:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ success: false, error: errMsg });
    }
  });

  /**
   * @swagger
   * /api/evolution/instance/{instanceName}/logout:
   *   delete:
   *     tags:
   *       - Evolution API
   *     summary: Logout da instância
   *     description: Faz logout de uma instância Evolution API
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: instanceName
   *         required: true
   *         schema:
   *           type: string
   *         description: Nome da instância
   *     responses:
   *       200:
   *         description: Logout realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  app.delete("/api/evolution/instance/:instanceName/logout", authenticateToken, async (req: any, res: any) => {
    try {
      const { instanceName } = req.params;
      const result = await evolutionService.logoutInstance(instanceName);
      res.json(result);
    } catch (error) {
      console.error("Error logging out Evolution instance:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ success: false, error: errMsg });
    }
  });

  /**
   * @swagger
   * /api/evolution/instance/{instanceName}:
   *   delete:
   *     tags:
   *       - Evolution API
   *     summary: Deletar instância
   *     description: Remove uma instância Evolution API
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: instanceName
   *         required: true
   *         schema:
   *           type: string
   *         description: Nome da instância
   *     responses:
   *       200:
   *         description: Instância removida com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  app.delete("/api/evolution/instance/:instanceName", authenticateToken, async (req: any, res: any) => {
    try {
      const { instanceName } = req.params;
      const result = await evolutionService.deleteInstance(instanceName);
      res.json(result);
    } catch (error) {
      console.error("Error deleting Evolution instance:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ success: false, error: errMsg });
    }
  });

  /**
   * @swagger
   * /api/evolution/instance/{instanceName}/webhook:
   *   get:
   *     tags:
   *       - Evolution API
   *     summary: Obter webhook da instância
   *     description: Retorna a configuração do webhook de uma instância
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: instanceName
   *         required: true
   *         schema:
   *           type: string
   *         description: Nome da instância
   *     responses:
   *       200:
   *         description: Configuração do webhook
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  app.get("/api/evolution/instance/:instanceName/webhook", authenticateToken, async (req: any, res: any) => {
    try {
      const { instanceName } = req.params;
      const result = await evolutionService.getWebhook(instanceName);
      res.json(result);
    } catch (error) {
      console.error("Error getting webhook:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ success: false, error: errMsg });
    }
  });

  /**
   * @swagger
   * /api/evolution/instance/{instanceName}/webhook:
   *   post:
   *     tags:
   *       - Evolution API
   *     summary: Configurar webhook da instância
   *     description: Configura o webhook de uma instância
   *     security:
   *       - sessionToken: []
   *     parameters:
   *       - in: path
   *         name: instanceName
   *         required: true
   *         schema:
   *           type: string
   *         description: Nome da instância
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               url:
   *                 type: string
   *                 description: URL do webhook
   *               events:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Eventos a serem enviados
   *     responses:
   *       200:
   *         description: Webhook configurado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  app.post("/api/evolution/instance/:instanceName/webhook", authenticateToken, async (req: any, res: any) => {
    try {
      const { instanceName } = req.params;
      const { url, events } = req.body;
      const result = await evolutionService.setWebhook(instanceName, { url, enabled: true, events });
      res.json(result);
    } catch (error) {
      console.error("Error setting webhook:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ success: false, error: errMsg });
    }
  });

  /**
   * @swagger
   * /api/evolution/credentials:
   *   get:
   *     tags:
   *       - Evolution API
   *     summary: Verificar credenciais
   *     description: Verifica se as credenciais da Evolution API estão configuradas
   *     security:
   *       - sessionToken: []
   *     responses:
   *       200:
   *         description: Status das credenciais
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 available:
   *                   type: boolean
   *                 credentials:
   *                   type: object
   *                 message:
   *                   type: string
   */
  app.get("/api/evolution/credentials", authenticateToken, async (req: any, res: any) => {
    try {
      const credentials = {
        endpoint: process.env.EVOLUTION_ENDPOINT,
        instance: process.env.EVOLUTION_INSTANCE,
        apiKey: process.env.EVOLUTION_API_KEY ? '***' : null
      };

      const hasCredentials = credentials.endpoint && credentials.instance && process.env.EVOLUTION_API_KEY;

      res.json({
        available: hasCredentials,
        credentials: hasCredentials ? credentials : null,
        message: hasCredentials ? 'Evolution API credentials loaded from environment' : 'Some Evolution API credentials are missing in environment variables'
      });
    } catch (error) {
      console.error("Error getting Evolution credentials:", error);
      const errMsg = (error instanceof Error) ? error.message : String(error);
      res.status(500).json({ message: "Failed to get Evolution credentials", error: errMsg });
    }
  });

  return httpServer;
}

// System monitoring functions for real-time alerts
async function getSystemStats() {
  try {
    // Get CPU usage
    const cpuUsage = await getSystemCpuUsage();

    // Get memory usage
    const memoryStats = await getSystemMemoryUsage();

    // Get disk usage
    const diskStats = await getSystemDiskUsage();

    // Get total RAM info
    const totalRAM = await getTotalRAM();

    // Get processor info
    const processorInfo = await getProcessorInfo();

    return {
      cpu: {
        usage: cpuUsage,
        threshold: {
          warning: cpuUsage >= 80,
          danger: cpuUsage >= 90
        }
      },
      memory: {
        usage: memoryStats.percentage,
        used: memoryStats.used,
        total: memoryStats.total,
        totalRAM: totalRAM, // New field with lshw format
        threshold: {
          warning: memoryStats.percentage >= 80,
          danger: memoryStats.percentage >= 90
        }
      },
      disk: {
        usage: diskStats.percentage,
        used: diskStats.used,
        total: diskStats.total,
        threshold: {
          warning: diskStats.percentage >= 80,
          danger: diskStats.percentage >= 90
        }
      },
      processor: processorInfo, // New field with processor info
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting system stats:", error);
    throw error;
  }
}

// Function to get CPU usage
async function getSystemCpuUsage(): Promise<number> {
  try {
    // Read /proc/stat to get CPU usage
    const { stdout } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
    const cpuUsage = parseFloat(stdout.trim()) || 0;
    return Math.min(Math.max(cpuUsage, 0), 100); // Clamp between 0-100
  } catch (error) {
    console.error("Error getting CPU usage:", error);
    // Return mock data if real stats fail
    return Math.floor(Math.random() * 30) + 10; // 10-40% mock usage
  }
}

// Function to get memory usage
async function getSystemMemoryUsage(): Promise<{ percentage: number; used: number; total: number }> {
  try {
    const { stdout } = await execAsync("free -m | grep '^Mem:' | awk '{print $3,$2}'");
    const [used, total] = stdout.trim().split(' ').map(Number);
    const percentage = Math.round((used / total) * 100);

    return {
      percentage: Math.min(Math.max(percentage, 0), 100),
      used,
      total
    };
  } catch (error) {
    console.error("Error getting memory usage:", error);
    // Return mock data if real stats fail
    const mockTotal = 8192; // 8GB mock
    const mockUsed = Math.floor(Math.random() * 3000) + 1000; // 1-4GB mock
    return {
      percentage: Math.round((mockUsed / mockTotal) * 100),
      used: mockUsed,
      total: mockTotal
    };
  }
}

// Function to get disk usage
async function getSystemDiskUsage(): Promise<{ percentage: number; used: number; total: number }> {
  try {
    const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $3,$2,$5}' | sed 's/G//g' | sed 's/%//'");
    const parts = stdout.trim().split(' ');
    const used = parseFloat(parts[0]) || 0;
    const total = parseFloat(parts[1]) || 1;
    const percentage = parseInt(parts[2]) || 0;

    return {
      percentage: Math.min(Math.max(percentage, 0), 100),
      used,
      total
    };
  } catch (error) {
    console.error("Error getting disk usage:", error);
    // Return mock data if real stats fail
    const mockTotal = 50; // 50GB mock
    const mockUsed = Math.floor(Math.random() * 20) + 5; // 5-25GB mock
    return {
      percentage: Math.round((mockUsed / mockTotal) * 100),
      used: mockUsed,
      total: mockTotal
    };
  }
}

// Function to get total RAM using lshw
async function getTotalRAM(): Promise<string> {
  try {
    const { stdout } = await execAsync("lshw -short | grep 'System Memory' | awk '{print $3}' | sed -s 's/iB/B/g'");
    const totalRAM = stdout.trim();
    return totalRAM || 'Unknown';
  } catch (error) {
    console.error("Error getting total RAM:", error);
    // Return fallback using free command
    try {
      const { stdout: freeOutput } = await execAsync("free -h | grep '^Mem:' | awk '{print $2}'");
      return freeOutput.trim() || '8GB'; // Fallback mock
    } catch (fallbackError) {
      console.error("Error with fallback RAM command:", fallbackError);
      return '8GB'; // Final fallback
    }
  }
}

// Function to get processor information using lshw
async function getProcessorInfo(): Promise<string> {
  try {
    const { stdout } = await execAsync("lshw -short | grep 'processor' | awk '{$1=$2=\"\"; print $0}' | head -n1 | awk '{$1=$1; print}'");
    const processorInfo = stdout.trim();
    return processorInfo || 'Unknown Processor';
  } catch (error) {
    console.error("Error getting processor info:", error);
    // Return fallback using /proc/cpuinfo
    try {
      const { stdout: cpuOutput } = await execAsync("grep 'model name' /proc/cpuinfo | head -n1 | cut -d':' -f2 | awk '{$1=$1; print}'");
      return cpuOutput.trim() || 'Unknown Processor'; // Fallback
    } catch (fallbackError) {
      console.error("Error with fallback CPU command:", fallbackError);
      return 'Unknown Processor'; // Final fallback
    }
  }
}

// Activity Logs System
class ActivityLogger {
  private static db = dbStorage;

  static async log(entry: {
    level: 'error' | 'warning' | 'info' | 'success' | 'security' | 'system' | 'user' | 'api';
    category: string;
    message: string;
    details?: any;
    userId?: number;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
  }) {
    try {
      const result = await (await import("./db")).db
        .insert((await import('@shared/schema')).activityLogs)
        .values({
          ...entry,
          timestamp: new Date(),
        })
        .returning();

      console.log(`[ACTIVITY LOG] ${entry.level.toUpperCase()}: ${entry.message}`);
      return result[0];
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  static async getLogs(filters: {
    page?: number;
    pageSize?: number;
    level?: string;
    category?: string;
    search?: string;
    dateFilter?: string;
  }) {
    try {
      const { db } = await import("./db");
      const { activityLogs } = await import('@shared/schema');
      const { and, like, eq, gte, desc } = await import('drizzle-orm');

      const conditions = [];

      if (filters.level && filters.level !== 'all') {
        conditions.push(eq(activityLogs.level, filters.level));
      }

      if (filters.category && filters.category !== 'all') {
        conditions.push(eq(activityLogs.category, filters.category));
      }

      if (filters.search) {
        conditions.push(like(activityLogs.message, `%${filters.search}%`));
      }

      if (filters.dateFilter && filters.dateFilter !== 'all') {
        const now = new Date();
        let dateThreshold = new Date();

        switch (filters.dateFilter) {
          case 'today':
            dateThreshold.setHours(0, 0, 0, 0);
            break;
          case 'week':
            dateThreshold.setDate(now.getDate() - 7);
            break;
          case 'month':
            dateThreshold.setMonth(now.getMonth() - 1);
            break;
        }

        if (filters.dateFilter !== 'all') {
          conditions.push(gte(activityLogs.timestamp, dateThreshold));
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await db
        .select({ count: (await import('drizzle-orm')).count() })
        .from(activityLogs)
        .where(whereClause);

      const total = totalResult[0]?.count || 0;

      // Get paginated logs
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 25;
      const offset = (page - 1) * pageSize;

      const logs = await db
        .select()
        .from(activityLogs)
        .where(whereClause)
        .orderBy(desc(activityLogs.timestamp))
        .limit(pageSize)
        .offset(offset);

      // Get stats
      const statsQuery = await db
        .select({ level: activityLogs.level, count: (await import('drizzle-orm')).count() })
        .from(activityLogs)
        .groupBy(activityLogs.level);

      const stats = statsQuery.reduce((acc, curr) => {
        acc[curr.level] = curr.count;
        return acc;
      }, {} as Record<string, number>);

      return { logs, total, stats };
    } catch (error) {
      console.error('Failed to get logs:', error);
      return { logs: [], total: 0, stats: {} };
    }
  }

  static async getCategories() {
    try {
      const { db } = await import("./db");
      const { activityLogs } = await import('@shared/schema');
      const { sql } = await import('drizzle-orm');

      const result = await db
        .selectDistinct({ category: activityLogs.category })
        .from(activityLogs)
        .orderBy(activityLogs.category);

      return result.map((r: any) => r.category);
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  static async clearLogs(filters: { level?: string; category?: string }) {
    try {
      const { db } = await import("./db");
      const { activityLogs } = await import('@shared/schema');
      const { and, eq } = await import('drizzle-orm');

      const conditions = [];

      if (filters.level && filters.level !== 'all') {
        conditions.push(eq(activityLogs.level, filters.level));
      }

      if (filters.category && filters.category !== 'all') {
        conditions.push(eq(activityLogs.category, filters.category));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db
        .delete(activityLogs)
        .where(whereClause);

      return { success: true, deletedCount: result.rowCount || 0 };
    } catch (error) {
      console.error('Failed to clear logs:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Helper function to log activities from other parts of the application
(global as any).logActivity = ActivityLogger.log;
