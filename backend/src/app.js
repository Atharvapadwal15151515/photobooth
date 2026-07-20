import express from "express";
import cors from "cors";

import boothRoutes from "./routes/booth.routes.js";
import participantRoutes from "./routes/participant.routes.js";
import photoRoutes from "./routes/photo.routes.js";
import cardRoutes from "./routes/card.routes.js";

import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Photo Booth API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/booths", boothRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/cards", cardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;