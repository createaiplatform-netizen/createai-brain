import { Router, type Request, type Response } from "express";
import { educationEngine } from "../services/domainEngines2.js";

const router = Router();

router.get("/",            (_req, res) => res.json({ ok: true, ...educationEngine.stats(), courses: educationEngine.listCourses() }));
router.get("/stats",       (_req, res) => res.json({ ok: true, ...educationEngine.stats() }));
router.get("/courses",     (req: Request, res: Response) => res.json({ ok: true, courses: educationEngine.listCourses(String(req.query["category"] ?? "")) }));
router.get("/enrollments", (req: Request, res: Response) => res.json({ ok: true, enrollments: educationEngine.listEnrollments(String(req.query["courseId"] ?? "")) }));

router.post("/course", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, course: educationEngine.createCourse(req.body ?? {}) });
});

router.post("/enroll", (req: Request, res: Response) => {
  const { courseId, studentId, studentName } = req.body as { courseId: string; studentId: string; studentName: string };
  if (!courseId || !studentId || !studentName) { res.status(400).json({ error: "courseId, studentId, studentName required" }); return; }
  res.status(201).json({ ok: true, enrollment: educationEngine.enroll(courseId, studentId, studentName) });
});

router.post("/progress", (req: Request, res: Response) => {
  const { enrollmentId, progress } = req.body as { enrollmentId: string; progress: number };
  const result = educationEngine.progress(enrollmentId ?? "", progress ?? 0);
  if (!result) { res.status(404).json({ error: "Enrollment not found" }); return; }
  res.json({ ok: true, enrollment: result, certificate: result.certificateId ?? null });
});

export default router;
