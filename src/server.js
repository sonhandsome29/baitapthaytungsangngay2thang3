require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const connectDatabase = require("./config/db");

const DEFAULT_PORT = 3000;

const parsePort = (value) => {
  const port = Number.parseInt(value, 10);

  if (Number.isNaN(port) || port < 1 || port > 65535) {
    return DEFAULT_PORT;
  }

  return port;
};

const listenWithPortFallback = (preferredPort) =>
  new Promise((resolve, reject) => {
    const tryListen = (portNumber) => {
      const server = http.createServer(app);

      server.once("error", (error) => {
        if (error.code === "EADDRINUSE") {
          if (portNumber >= 65535) {
            return reject(new Error("No available port found"));
          }

          return tryListen(portNumber + 1);
        }

        return reject(error);
      });

      server.once("listening", () => {
        return resolve({ server, port: portNumber });
      });

      server.listen(portNumber);
    };

    tryListen(preferredPort);
  });

const closeMongoConnection = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

const attachSignalHandlers = (server) => {
  let isShuttingDown = false;

  const shutdown = async (signal, afterClose) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`Received ${signal}, shutting down...`);

    server.close(async () => {
      try {
        await closeMongoConnection();
      } catch (error) {
        console.error("Failed to close MongoDB connection:", error.message);
      }

      afterClose();
    });

    setTimeout(() => {
      afterClose();
    }, 5000).unref();
  };

  process.once("SIGINT", () => {
    shutdown("SIGINT", () => process.exit(0));
  });

  process.once("SIGTERM", () => {
    shutdown("SIGTERM", () => process.exit(0));
  });

  process.once("SIGUSR2", () => {
    shutdown("SIGUSR2", () => {
      process.kill(process.pid, "SIGUSR2");
    });
  });
};

const startServer = async () => {
  try {
    await connectDatabase();

    const preferredPort = parsePort(process.env.PORT);
    const { server, port } = await listenWithPortFallback(preferredPort);

    if (port !== preferredPort) {
      console.warn(
        `Port ${preferredPort} is busy, switched to port ${port}`
      );
    }

    console.log(`Server is running on port ${port}`);
    attachSignalHandlers(server);

    server.on("error", (error) => {
      console.error("Failed to start HTTP server:", error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
