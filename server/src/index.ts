import app from "./server.js";

const DEFAULT_PORT = Number(process.env.PORT) || 5000;

function startServer(port: number) {
  const server = app.listen(port, () => {
    console.log(`=========================================`);
    console.log(`⚡ LORD ESPORTS REST API SERVER RUNNING`);
    console.log(`📡 URL: http://localhost:${port}`);
    console.log(`🛡️  Health check: http://localhost:${port}/health`);
    console.log(`📂 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`=========================================`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE" && port !== 5002) {
      const nextPort = port === 5000 ? 5001 : port + 1;
      console.warn(`⚠️  Port ${port} in use. Switching to port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error("Server error:", err);
    }
  });
}

startServer(DEFAULT_PORT);
