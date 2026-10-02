import dotenv from "dotenv";
dotenv.config();
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT || 5000;
let server;

connectDB().then(() => {
  server = app.listen(PORT, () => console.log(`TravelMate API running on port ${PORT}`));
}).catch(err => {
  console.error("Database connection failed:", err.message);
  process.exit(1);
});

function gracefulShutdown() {
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
}

process.once("SIGUSR2", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
