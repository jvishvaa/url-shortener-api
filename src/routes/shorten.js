import { Router } from "express";
import { customAlphabet } from "nanoid";
import { pool } from "../db/postgres.js";
import { redis } from "../db/redis.js";

const router = Router();

const generateSlug = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  8,
);

router.post("/shorten", async (req, res) => {
  const { long_url } = req.body;

  // Stage 1 Validate URL
  if (!long_url) {
    return res.status(400).json({ error: "long_url is required" });
  }

  try {
    new URL(long_url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  // Stage 2 Generate Slug
  const Slug = generateSlug();

  // Stage 3 Save to DB
  try {
    await pool.query(`INSERT INTO urls (slug, long_url) VALUES ($1, $2)`, [
      Slug,
      long_url,
    ]);
  } catch (err) {
    console.error("DB error:", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }

  // Stage 4 Return Response
  return res.status(201).json({
    Slug,
    short_url: `${process.env.BASE_URL}/${Slug}`,
    long_url,
  });
});

export default router;
