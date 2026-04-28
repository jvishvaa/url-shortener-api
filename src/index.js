import express from "express";
import dotenv from "dotenv";
import { pool } from "./db/postgres.js";
import { redis } from "./db/redis.js";

import shortenRouter from "./routes/shorten.js";
import redirectRouter from "./routes/redirect.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import statsRouter from "./routes/stats.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/shorten", rateLimiter);
app.use("/", shortenRouter);
app.use("/", redirectRouter);
app.use("/", statsRouter);

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
