import { Router, type Request, type Response } from "express";
import { socialCommand } from "../services/domainEngines2.js";

const router = Router();

router.get("/",          (_req, res) => res.json({ ok: true, ...socialCommand.stats(), accounts: socialCommand.accounts(), posts: socialCommand.posts() }));
router.get("/stats",     (_req, res) => res.json({ ok: true, ...socialCommand.stats() }));
router.get("/accounts",  (_req, res) => res.json({ ok: true, accounts: socialCommand.accounts() }));
router.get("/posts",     (req: Request, res: Response) => res.json({ ok: true, posts: socialCommand.posts(String(req.query["platform"] ?? "")) }));
router.get("/calendar",  (_req, res) => res.json({ ok: true, calendar: socialCommand.calendar() }));

router.post("/post", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, post: socialCommand.schedulePost(req.body ?? {}) });
});

router.post("/publish", (req: Request, res: Response) => {
  const { postId } = req.body as { postId: string };
  const ok = socialCommand.publish(postId ?? "");
  res.json({ ok, message: ok ? "Published" : "Post not found" });
});

router.patch("/:id/metrics", (req: Request, res: Response) => {
  const ok = socialCommand.updateMetrics(String(req.params["id"] ?? ""), req.body ?? {});
  res.json({ ok });
});

export default router;
