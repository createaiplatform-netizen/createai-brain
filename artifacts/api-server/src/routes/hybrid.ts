/**
 * hybrid.ts — Hybrid Multi-Rail Engine API
 *
 * POST /api/hybrid/checkout   — hybridCheckout(product, user)
 * POST /api/hybrid/message    — hybridMessage(type, to, content)
 * GET  /api/hybrid/stats      — getHybridStats()
 */

import { Router }          from "express";
import {
  hybridCheckout,
  hybridMessage,
  getHybridStats,
}                          from "../services/hybridEngine.js";
import {
  getExternalChannelStatus,
}                          from "../services/externalMarketTools.js";

const router = Router();

// POST /api/hybrid/checkout
router.post("/checkout", async (req, res) => {
  const { product, user } = req.body as {
    product?: { id?: string; name?: string; price?: number; currency?: string };
    user?:    string;
  };

  if (!product?.name || product?.price === undefined || !user) {
    res.status(400).json({ error: "product.name, product.price (cents), and user are required" });
    return;
  }

  const result = await hybridCheckout(product as { name: string; price: number }, user);
  res.json(result);
});

// POST /api/hybrid/message
router.post("/message", async (req, res) => {
  const { type, to, content, subject } = req.body as {
    type?:    string;
    to?:      string;
    content?: string;
    subject?: string;
  };

  if (!type || (type !== "email" && type !== "sms") || !to || !content) {
    res.status(400).json({ error: "type ('email'|'sms'), to, and content are required" });
    return;
  }

  const result = await hybridMessage(type, to, content, subject);
  res.json(result);
});

// GET /api/hybrid/stats
router.get("/stats", (_req, res) => {
  res.json({
    ...getHybridStats(),
    externalChannels: getExternalChannelStatus(),
  });
});

export default router;
