/**
 * createDocumentary — Brain task stub.
 * Produces a structured documentary outline for any duration / style / subject.
 * Returns a validated output object that CoreEngine can accept.
 */

export interface DocumentaryResult {
  taskType:   "createDocumentary";
  title:      string;
  duration:   string;
  style:      string;
  subject:    string;
  sections:   { chapter: number; title: string; durationMin: number }[];
  wordCount:  number;
  complete:   boolean;
  completedAt: string;
}

export async function createDocumentary(
  duration: string,
  style: string,
  subject: string,
): Promise<DocumentaryResult> {
  console.log(`[createDocumentary] Building "${duration}" / "${style}" documentary on: ${subject}`);

  // Parse hours from duration string (e.g. "15h" → 15)
  const totalHours = parseFloat(duration.replace(/[^\d.]/g, "")) || 1;
  const chaptersCount = Math.max(5, Math.round(totalHours * 4));

  const sections = Array.from({ length: chaptersCount }, (_, i) => ({
    chapter:     i + 1,
    title:       `Chapter ${i + 1}: ${subject} — Part ${i + 1}`,
    durationMin: Math.round((totalHours * 60) / chaptersCount),
  }));

  // Simulate async work (e.g. calling AI API, fetching research data)
  await new Promise(res => setTimeout(res, 200));

  const result: DocumentaryResult = {
    taskType:    "createDocumentary",
    title:       `${subject} — A ${duration} ${style} Documentary`,
    duration,
    style,
    subject,
    sections,
    wordCount:   Math.round(totalHours * 8_500),
    complete:    true,
    completedAt: new Date().toISOString(),
  };

  console.log(`[createDocumentary] Done — ${chaptersCount} chapters, ${result.wordCount} words`);
  return result;
}
