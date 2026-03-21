import { Router, type Request, type Response } from "express";
import { eventBooking } from "../services/domainEngines2.js";

const router = Router();

router.get("/",               (_req, res) => res.json({ ok: true, ...eventBooking.stats(), events: eventBooking.listEvents() }));
router.get("/stats",          (_req, res) => res.json({ ok: true, ...eventBooking.stats() }));
router.get("/events",         (req: Request, res: Response) => res.json({ ok: true, events: eventBooking.listEvents(String(req.query["status"] ?? "")) }));
router.get("/bookings",       (req: Request, res: Response) => res.json({ ok: true, bookings: eventBooking.listBookings(String(req.query["eventId"] ?? "")) }));

router.post("/event", (req: Request, res: Response) => {
  res.status(201).json({ ok: true, event: eventBooking.createEvent(req.body ?? {}) });
});

router.post("/book", (req: Request, res: Response) => {
  const { eventId, name, email } = req.body as { eventId: string; name: string; email: string };
  if (!eventId || !name || !email) { res.status(400).json({ error: "eventId, name, email required" }); return; }
  const booking = eventBooking.book(eventId, name, email);
  if (!booking) { res.status(400).json({ error: "Event not available or cancelled" }); return; }
  res.status(201).json({ ok: true, booking });
});

router.post("/check-in", (req: Request, res: Response) => {
  const { bookingId } = req.body as { bookingId: string };
  const ok = eventBooking.checkIn(bookingId ?? "");
  res.json({ ok, message: ok ? "Checked in" : "Booking not found" });
});

export default router;
