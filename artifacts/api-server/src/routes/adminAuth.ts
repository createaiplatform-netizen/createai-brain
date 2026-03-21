/**
 * routes/adminAuth.ts
 * ─────────────────────
 * Login / logout endpoints for the admin session.
 *
 * GET  /admin/login    — Login page
 * POST /admin/login    — Verify password + set session cookie
 * GET  /admin/logout   — Clear session cookie + redirect to /
 */

import { Router, type Request, type Response } from "express";
import { createAdminCookie, buildLoginPage } from "../middlewares/adminAuth.js";

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path:     "/",
  maxAge:   24 * 60 * 60 * 1000,
  secure:   process.env["REPLIT_DEPLOYMENT"] === "1",
};

function getOwnerPass(): string {
  return process.env["CORE_OWNER_PASS"] ?? "createai2024";
}

router.get("/login", (req: Request, res: Response) => {
  const returnTo = String(req.query["return"] ?? "/hub");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(buildLoginPage(undefined, returnTo));
});

router.post("/login", (req: Request, res: Response) => {
  const { password, returnTo } = req.body as { password?: string; returnTo?: string };
  const rt = returnTo && returnTo.startsWith("/") ? returnTo : "/hub";

  if (!password || password !== getOwnerPass()) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.send(buildLoginPage("Incorrect password. Try again.", rt));
    return;
  }

  res.cookie("ADMIN_SESSION", createAdminCookie(), COOKIE_OPTS);
  res.redirect(302, rt);
});

router.get("/logout", (_req: Request, res: Response) => {
  res.clearCookie("ADMIN_SESSION", { path: "/" });
  res.redirect(302, "/");
});

export default router;
