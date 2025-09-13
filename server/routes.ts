import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage as dbStorage } from "./storage";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import multer from "multer";
import { spawn, exec } from "child_process";
import { promisify } from "util";
import os from "os";
import Docker from "dockerode";

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
const PROTON_CACHE_DURATION = 30000; // 30 seconds

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

    const configFile = process.env.PROTON_CONFIG_FILE || '/docker/nginx/config/protondrive.conf';

    // Get total storage
    exec(`rclone --config=${configFile} about proton: | grep 'Total:' | awk '{print $2$3}'`, (totalError, totalStdout, totalStderr) => {
      if (totalError) {
        console.error('Error getting Proton Drive total:', totalError);
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

      // Get used storage
      exec(`rclone --config=${configFile} about proton: | grep 'Used:' | awk '{print $2$3}'`, (usedError, usedStdout, usedStderr) => {
        if (usedError) {
          console.error('Error getting Proton Drive used:', usedError);
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
          const totalStr = totalStdout.trim();
          const usedStr = usedStdout.trim();

          // Parse sizes (e.g., "200GiB" -> bytes)
          const total = parseProtonDriveSize(totalStr);
          const used = parseProtonDriveSize(usedStr);
          const free = total - used;
          const usagePercent = total > 0 ? Math.round((used / total) * 100) : 0;

          const data = {
            total,
            used,
            free,
            usagePercent
          };

          // Update cache
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
      // For Postfix compatibility, we need to store the Argon2 hash directly
      // Postfix supports various formats including Argon2
      return `${account.email}|${account.password}`;
    });

    const filePath = process.env.POSTFIX_MAIL_ACCOUNTS_FILE || "./mail_accounts.cf";
    const content = lines.join("\n") + "\n";

    await fs.promises.writeFile(filePath, content, "utf8");
    console.log(`Generated mail_accounts.cf with ${accounts.length} accounts`);
  } catch (error) {
    console.error("Error generating mail_accounts.cf:", error);
  }
}

// Function to restart mailserver container
async function restartMailserverContainer() {
  try {
    const dockerUri = process.env.DOCKER_URI || "http://0.0.0.0:2375";

    // First, try to find the mailserver container
    const containersResponse = await fetch(`${dockerUri}/containers/json?all=true`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!containersResponse.ok) {
      console.error("Failed to get containers list");
      return;
    }

    const containers = await containersResponse.json();
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

    // Restart the container
    const restartResponse = await fetch(`${dockerUri}/containers/${mailserverContainer.Id}/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (restartResponse.ok) {
      console.log("Mailserver container restarted successfully");
    } else {
      console.error("Failed to restart mailserver container:", restartResponse.status);
    }
  } catch (error) {
    console.error("Error restarting mailserver container:", error);
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

// Configurar multer para upload de imagens
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Upload routes
  app.post(
    "/api/upload/container-logo",
    authenticateToken,
    upload.single("image"),
    (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, filename: req.file.filename });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  app.post(
    "/api/upload/product-image",
    authenticateToken,
    upload.single("image"),
    (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, filename: req.file.filename });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  app.post(
    "/api/upload/client-image",
    upload.single("image"),
    (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, filename: req.file.filename });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  app.post(
    "/api/upload/supplier-image",
    upload.single("image"),
    (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, filename: req.file.filename });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  app.post(
    "/api/upload/category-image",
    upload.single("image"),
    (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, filename: req.file.filename });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  app.post(
    "/api/upload/manufacturer-image",
    upload.single("image"),
    (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Nenhum arquivo enviado" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, filename: req.file.filename });
      } catch (error) {
        res.status(500).json({ message: "Falha no upload da imagem" });
      }
    },
  );

  // Authentication routes (no auth required)
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

  app.get("/api/auth/verify", authenticateToken, (req: any, res) => {
    res.json({ user: req.user, valid: true });
  });

  // Auth status check (similar to verify but with different response format)
  app.get("/api/auth/status", authenticateToken, (req: any, res) => {
    res.json({
      isAuthenticated: true,
      user: req.user
    });
  });

  // Protected routes (require authentication)
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
  app.get("/api/user/preferences", authenticateToken, async (req: any, res) => {
    try {
      const preferences = await dbStorage.getUserPreferences(req.user.id);
      res.json(preferences || {});
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Falha ao carregar preferências" });
    }
  });

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

      res.json({ success: true, message: "Navigation updated successfully" });
    } catch (error) {
      console.error('Error updating navigation:', error);
      res.status(500).json({ message: "Failed to update navigation items" });
    }
  });

  // Get dashboard stats
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
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await dbStorage.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.delete("/api/notifications", async (req, res) => {
    try {
      await dbStorage.clearNotifications(1); // Mock user ID
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear notifications" });
    }
  });

  // Email routes
  app.get("/api/emails", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const emails = await dbStorage.getEmails(1, limit); // Mock user ID
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: "Failed to get emails" });
    }
  });

  app.patch("/api/emails/:id/read", async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      const updated = await dbStorage.markEmailAsRead(emailId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark email as read" });
    }
  });

  app.delete("/api/emails/:id", async (req, res) => {
    try {
      const emailId = parseInt(req.params.id);
      await dbStorage.deleteEmail(emailId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email" });
    }
  });

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
      await dbStorage.deleteClient(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await dbStorage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

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

  app.post("/api/categories", async (req, res) => {
    try {
      const category = await dbStorage.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await dbStorage.updateCategory(id, req.body);
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteCategory(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
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

  // System Status routes
  app.get("/api/system/status", authenticateToken, async (req, res) => {
    try {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // Get accurate CPU usage, disk usage, and Proton Drive usage
      const [cpuUsage, diskUsage, protonDriveUsage] = await Promise.all([
        getCpuUsage(),
        getDiskUsage(),
        getProtonDriveUsage()
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
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      };

      res.json(systemStatus);
    } catch (error) {
      console.error("Error getting system status:", error);
      res.status(500).json({ error: "Failed to get system status" });
    }
  });

  // Real-time chart data routes
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
      await restartMailserverContainer();
      broadcastUpdate("email_account_created", account);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to create email account" });
    }
  });

  app.put("/api/email-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await dbStorage.updateEmailAccount(id, req.body);
      await generateMailAccountsFile();
      await restartMailserverContainer();
      broadcastUpdate("email_account_updated", account);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to update email account" });
    }
  });

  app.delete("/api/email-accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.deleteEmailAccount(id);
      await generateMailAccountsFile();
      await restartMailserverContainer();
      broadcastUpdate("email_account_deleted", { id });
      res.status(204).send();
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
        version: version || 'unknown',
        method: 'child_process'
      });
    } catch (error) {
      res.json({
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'child_process'
      });
    }
  });

  // Rotas da API Docker real

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
    console.log("New WebSocket connection established");

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
            const clientInfo = clients.get(ws);
            const sessionToken = clientInfo?.sessionToken;

            if (!sessionToken) {
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
            const session = await dbStorage.validateSession(
              sessionToken,
              ipAddress,
            );

            if (session) {
              // Update client info with user data
              clients.set(ws, { sessionToken, user: session.user });

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
        console.error("Error parsing WebSocket message:", error);
      }
    });

    // Handle disconnection
    ws.on("close", () => {
      console.log("WebSocket connection closed");
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
      await dbStorage.deleteClient(id);
      broadcastUpdate("client_deleted", { id });
      broadcastDashboardUpdate(); // Update dashboard counters
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
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

  // Store broadcast function globally for access from other modules
  (global as any).broadcastUpdate = broadcastUpdate;

  // Generate initial mail_accounts.cf file
  generateMailAccountsFile();

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