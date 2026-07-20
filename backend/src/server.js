import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import { testDatabaseConnection } from "./config/database.js";
import { testCloudinaryConnection } from "./config/cloudinary.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testDatabaseConnection();
    await testCloudinaryConnection();

    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down server...`);

      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();