import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import destinationRoutes from "./routes/destinationRoutes.js";
import packageRoutes from "./routes/packageRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
      return callback(null, true);
    }
    return callback(new Error("CORS not allowed for this origin"));
  },
  credentials: true
}));
app.use(express.json());
app.get("/", (req, res) => res.json({ message: "TravelMate API is running" }));
app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../../frontend/dist");
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) return next();
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);
export default app;
