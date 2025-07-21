import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Function to kill process using a specific port
async function killPortProcess(port: number): Promise<void> {
  try {
    log(`🔍 Checking if port ${port} is in use...`);
    
    // Find process using the port
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    
    if (stdout.trim()) {
      // Extract PID from netstat output
      const lines = stdout.trim().split('\n');
      const pids = new Set<string>();
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            pids.add(pid);
          }
        }
      }
      
      // Convert Set to Array for iteration
      const pidArray = Array.from(pids);
      
      if (pidArray.length > 0) {
        log(`⚡ Found ${pidArray.length} process(es) using port ${port}. Killing them...`);
        
        for (let i = 0; i < pidArray.length; i++) {
          const pid = pidArray[i];
          try {
            await execAsync(`taskkill /PID ${pid} /F`);
            log(`✅ Killed process with PID ${pid}`);
          } catch (error) {
            log(`⚠️  Could not kill process ${pid}: ${error}`);
          }
        }
        
        // Wait a moment for processes to fully terminate
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      log(`✅ Port ${port} is available`);
    }
  } catch (error) {
    log(`⚠️  Error checking port ${port}: ${error}`);
  }
}

// Function to check if port is still in use
async function isPortInUse(port: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

// Function to try starting server with automatic port killing
async function startServerWithPortKill(port: number, maxRetries: number = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`🚀 Attempt ${attempt} to start server on port ${port}`);
      
      // Kill any process using the port
      await killPortProcess(port);
      
      // Double-check if port is still in use
      if (await isPortInUse(port)) {
        log(`⚠️  Port ${port} is still in use after killing processes`);
        if (attempt < maxRetries) {
          log(`⏳ Waiting 2 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
      
      // Try to start the server
      const server = await registerRoutes(app);

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        res.status(status).json({ message });
        throw err;
      });

      // Setup vite or static serving
      if (app.get("env") === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }

      // Start the server
      return new Promise((resolve, reject) => {
        server.listen(port, "0.0.0.0", () => {
          log(`✅ Server successfully started on port ${port}`);
          resolve();
        });

        server.on('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            log(`❌ Port ${port} is still in use (attempt ${attempt})`);
            if (attempt < maxRetries) {
              reject(new Error(`Port ${port} in use, retrying...`));
            } else {
              log(`💡 All attempts failed. Try manually:`);
              log(`   netstat -ano | findstr :${port}`);
              log(`   taskkill /PID <PID> /F`);
              reject(err);
            }
          } else {
            reject(err);
          }
        });
      });

    } catch (error) {
      if (attempt < maxRetries) {
        log(`⚠️  Attempt ${attempt} failed: ${error}`);
        log(`⏳ Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw error;
      }
    }
  }
}

// Main startup function
(async () => {
  try {
    const port = parseInt(process.env.PORT || '5000', 10);
    await startServerWithPortKill(port);
  } catch (error) {
    log(`❌ Failed to start server: ${error}`);
    process.exit(1);
  }
})();

// Export for Vercel serverless functions
export default app;