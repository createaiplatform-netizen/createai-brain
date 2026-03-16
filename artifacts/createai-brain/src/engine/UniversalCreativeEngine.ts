// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL CREATIVE PRODUCTION ENGINE
// Generates fictional production packages for any creative request.
// INTERNAL ONLY — FICTIONAL — DEMO-ONLY — NON-OPERATIONAL.
// All content is mock and cannot be directly used for real productions.
// ═══════════════════════════════════════════════════════════════════════════

export type CreativeType =
  | "video" | "documentary" | "training" | "simulation"
  | "storyboard" | "script" | "explainer" | "podcast"
  | "course" | "presentation" | "webinar" | "commercial";

export interface SceneChapter {
  index:      number;
  title:      string;
  duration:   string;
  narration:  string;
  visuals:    string;
  transition: string;
  pacing:     string;
  emotion:    string;
}

export interface StyleGuide {
  colorPalette:    string[];
  typography:      string;
  visualStyle:     string;
  musicGenre:      string;
  voiceoverStyle:  string;
  brandTone:       string;
}

export interface MockActor {
  name:       string;
  role:       string;
  background: string;
  style:      string;
}

export interface ProductionPackage {
  id:           string;
  type:         CreativeType;
  title:        string;
  subtitle:     string;
  purpose:      string;
  audience:     string;
  tone:         string;
  totalDuration: string;
  structure:    string;
  emotionalArc: string;
  chapters:     SceneChapter[];
  styleGuide:   StyleGuide;
  mockActors:   MockActor[];
  callToAction: string;
  disclaimer:   string;
  generatedAt:  string;
}

// ─── Style presets ────────────────────────────────────────────────────────

const STYLE_PRESETS: Record<string, StyleGuide> = {
  corporate: {
    colorPalette: ["#003087", "#FFFFFF", "#C8A951", "#F5F5F5"],
    typography: "Sans-serif (Helvetica, Inter) — headers bold, body regular",
    visualStyle: "Clean, minimal. B-roll of professionals in modern offices. Motion graphics for data.",
    musicGenre: "Ambient corporate — upbeat but professional. No lyrics.",
    voiceoverStyle: "Authoritative, warm, paced at 140 wpm",
    brandTone: "Professional, trustworthy, forward-looking",
  },
  educational: {
    colorPalette: ["#4CAF50", "#FFFFFF", "#FF9800", "#E3F2FD"],
    typography: "Rounded sans-serif — approachable, clear hierarchy",
    visualStyle: "Illustrated diagrams, on-screen text callouts, friendly presenters, whiteboard animation",
    musicGenre: "Upbeat indie — curious, encouraging, light",
    voiceoverStyle: "Friendly teacher — conversational, 120 wpm, pauses for emphasis",
    brandTone: "Encouraging, clear, jargon-free",
  },
  cinematic: {
    colorPalette: ["#1A1A2E", "#16213E", "#E94560", "#F5F5F5"],
    typography: "Serif headings — dramatic weight. Body: clean sans.",
    visualStyle: "Cinematic wide shots, golden hour lighting, drone footage, shallow depth of field",
    musicGenre: "Orchestral — emotional swells, sparse piano intro, build to full arrangement",
    voiceoverStyle: "Documentary narration — measured, gravitas, 120 wpm",
    brandTone: "Inspiring, urgent, human-centered",
  },
  playful: {
    colorPalette: ["#FF6B6B", "#FFE66D", "#4ECDC4", "#FFFFFF"],
    typography: "Rounded, bold, playful letterforms. Large size. Animated.",
    visualStyle: "Bright animation, 2D characters, bold color blocks, energetic cuts",
    musicGenre: "Upbeat pop / electronic — energetic, fun, familiar",
    voiceoverStyle: "Enthusiastic, fast-paced, 150 wpm, friendly",
    brandTone: "Fun, accessible, optimistic",
  },
};

// ─── Tone → style mapping ─────────────────────────────────────────────────

function pickStyle(tone: string): StyleGuide {
  const t = tone.toLowerCase();
  if (t.includes("fun") || t.includes("playful") || t.includes("energetic")) return STYLE_PRESETS.playful;
  if (t.includes("cinem") || t.includes("dramatic") || t.includes("emotion") || t.includes("documentary")) return STYLE_PRESETS.cinematic;
  if (t.includes("educat") || t.includes("learn") || t.includes("train")) return STYLE_PRESETS.educational;
  return STYLE_PRESETS.corporate;
}

// ─── Chapter generators ───────────────────────────────────────────────────

const CHAPTER_PATTERNS: Record<CreativeType, (topic: string, audience: string, i: number) => SceneChapter> = {
  video: (topic, audience, i) => ({
    index: i, title: ["Hook", "Problem Statement", "Solution Overview", "Key Benefits", "Proof Points", "Call to Action"][i] ?? `Chapter ${i + 1}`,
    duration: ["0:00–0:30", "0:30–1:30", "1:30–3:00", "3:00–4:30", "4:30–5:30", "5:30–6:00"][i] ?? "1:00",
    narration: [
      `Open on the challenge facing ${audience} in the ${topic} space. Hook with a compelling question or statistic (mock).`,
      `Describe the pain point in depth. Show what happens without a solution. Relatable scenarios for ${audience}.`,
      `Introduce the solution. Clear, simple explanation. Show it in action (mock demo).`,
      `Three key benefits: Speed, Accuracy, Scalability (fictional). Backed by fictional metrics.`,
      `Fictional testimonial or case study. Show before/after. Quantify impact.`,
      `Clear CTA. Next steps. Contact information (mock). Reinforce brand promise.`,
    ][i] ?? `Continued exploration of ${topic} for ${audience}.`,
    visuals: ["Bold title card + ambient footage", "Problem visualization, B-roll", "Product/solution demo (mock)", "Animated benefit graphics", "Testimonial clip (mock actor)", "Brand close + logo"][i] ?? "B-roll + motion graphics",
    transition: ["Cut", "Dissolve", "Wipe", "Cut", "Dissolve", "Fade to Black"][i] ?? "Cut",
    pacing: ["Fast — grab attention", "Moderate — build empathy", "Slow — explain clearly", "Dynamic — energize", "Moderate — build trust", "Slow — inspire action"][i] ?? "Moderate",
    emotion: ["Intrigue", "Empathy", "Curiosity", "Excitement", "Trust", "Inspiration"][i] ?? "Engagement",
  }),
  documentary: (topic, audience, i) => ({
    index: i, title: ["Opening — The World as It Is", "The Problem Explored", "Voices & Perspectives", "Turning Point", "Solutions Emerging", "A Look Forward"][i] ?? `Act ${i + 1}`,
    duration: ["0:00–3:00", "3:00–10:00", "10:00–20:00", "20:00–28:00", "28:00–38:00", "38:00–45:00"][i] ?? "8:00",
    narration: [
      `Open with sweeping visuals and narrator voice-over establishing the world of ${topic}. Set context without judgment.`,
      `Deep-dive into the challenge. Expert interview (mock). Data visualization. Human impact stories.`,
      `Multiple perspectives — advocates, critics, practitioners. Balanced fictional representation.`,
      `A key moment or event that changed things. The pivot in the story of ${topic}.`,
      `Innovators and solutions emerging. Hope balanced with realism. Fictional case studies.`,
      `Where do we go from here? Call to reflection. Open-ended. Empowering.`,
    ][i] ?? `Documentary segment on ${topic}.`,
    visuals: ["Aerial / establishing shots", "Interviews, archival footage (mock)", "Split perspectives, graphics", "Dramatic recreation (mock)", "Solution B-roll", "Montage + title card"][i] ?? "Documentary B-roll",
    transition: ["Cross-dissolve", "Match cut", "Jump cut", "Slow dissolve", "Cut", "Fade to black"][i] ?? "Dissolve",
    pacing: ["Slow, contemplative", "Building tension", "Balanced, measured", "Dramatic pause", "Hopeful, forward", "Reflective"][i] ?? "Measured",
    emotion: ["Wonder", "Concern", "Understanding", "Impact", "Hope", "Purpose"][i] ?? "Reflection",
  }),
  training: (topic, audience, i) => ({
    index: i, title: [`Module ${i + 1}: ` + ["Welcome & Objectives", "Core Concepts", "Demonstration", "Practice Scenario", "Knowledge Check", "Summary & Next Steps"][i] ?? `Module ${i + 1}`],
    duration: ["5:00", "10:00", "8:00", "12:00", "5:00", "5:00"][i] ?? "8:00",
    narration: [
      `Welcome, ${audience}! Today you'll learn ${topic}. Objectives: understand X, apply Y, demonstrate Z (mock).`,
      `Core concept 1: [fictional principle]. Core concept 2: [fictional rule]. Core concept 3: [fictional best practice].`,
      `Watch this step-by-step demonstration. Follow along in the mock environment. Pause and rewind as needed.`,
      `Practice Scenario: You are a ${audience}. Your task: complete the mock ${topic} workflow. What do you do first?`,
      `Quick check: 3 questions. Each has one correct answer. Your score is tracked internally (mock scoring).`,
      `You've completed the ${topic} module. Key takeaways: [1, 2, 3]. Next module in this series: [Next Topic].`,
    ][i] ?? `Training content on ${topic}.`,
    visuals: ["Welcome screen with objectives checklist", "Animated concept diagram", "Screen recording with callouts", "Interactive scenario branching", "Quiz interface", "Certificate of completion (mock)"][i] ?? "Training slide",
    transition: ["Slide transition", "Animated wipe", "Screen fade", "Branching arrow", "Question pop", "Confetti animation"][i] ?? "Slide",
    pacing: ["Welcoming, clear", "Instructional, paced", "Follow-along pace", "Learner-controlled", "Quiz tempo", "Closing, motivating"][i] ?? "Instructional",
    emotion: ["Readiness", "Focus", "Confidence", "Challenge", "Accountability", "Achievement"][i] ?? "Learning",
  }),
  explainer: (topic, audience, i) => ({
    index: i, title: ["The Hook", "What Is It?", "How It Works", "Why It Matters", "The Outcome"][i] ?? `Beat ${i + 1}`,
    duration: ["0:00–0:15", "0:15–0:45", "0:45–1:30", "1:30–2:00", "2:00–2:30"][i] ?? "0:30",
    narration: [
      `Question hook: "What if ${audience} could [result]?" — grab attention immediately.`,
      `${topic} is [simple definition]. It's designed for [use case]. Built for [audience].`,
      `Here's how it works: Step 1 → Step 2 → Step 3. Simple, fast, reliable (fictional).`,
      `Why does this matter? [Benefit 1]. [Benefit 2]. [Quantified result — mock].`,
      `The result: [audience] achieves [outcome] with less friction. Learn more at [mock URL].`,
    ][i] ?? `Explainer beat on ${topic}.`,
    visuals: ["Animated text hook", "2D illustration of concept", "Step-by-step animation", "Benefit iconography", "CTA card with logo"][i] ?? "Motion graphic",
    transition: ["Snap", "Slide", "Pop", "Dissolve", "Fade"][i] ?? "Cut",
    pacing: ["Very fast", "Clear, moderate", "Step-by-step", "Confident", "Memorable"][i] ?? "Brisk",
    emotion: ["Curiosity", "Clarity", "Confidence", "Excitement", "Satisfaction"][i] ?? "Engagement",
  }),
  storyboard: (topic, audience, i) => ({
    index: i, title: `Frame ${i + 1}`, duration: "3–5 sec",
    narration: `Narration for frame ${i + 1}: [Dialogue or VO about ${topic} for ${audience}]`,
    visuals: `[Wide/Medium/Close-up shot description. Camera angle, subject, background, props. Lighting note.]`,
    transition: ["Cut", "Dissolve", "Zoom", "Pan", "Wipe"][i % 5],
    pacing: "As scripted", emotion: "As directed",
  }),
  script: (topic, audience, i) => ({
    index: i, title: `Scene ${i + 1}`, duration: "TBD",
    narration: `INT./EXT. [LOCATION] — [DAY/NIGHT]\n\n[CHARACTER A] addresses ${audience} regarding ${topic}.\n\nCHARACTER A\n(${["warmly", "urgently", "confidently", "thoughtfully"][i % 4]})\n"[Fictional dialogue about ${topic}. Internal only. Non-operational.]"\n\n[Action line: Character A [does something]. Beat.]\n\nCHARACTER B\n"[Response line. Fictional.]"`,
    visuals: `Scene direction: [Visual note for director. Style: ${["naturalistic", "stylized", "documentary", "theatrical"][i % 4]}.]`,
    transition: "CUT TO:", pacing: "Script pace", emotion: ["Drama", "Comedy", "Tension", "Resolution"][i % 4],
  }),
  podcast: (topic, audience, i) => ({
    index: i, title: ["Intro & Hook", "Guest Intro", "Main Discussion", "Key Insight", "Listener Q&A", "Takeaways & Close"][i] ?? `Segment ${i + 1}`,
    duration: ["2:00", "3:00", "15:00", "5:00", "8:00", "5:00"][i] ?? "5:00",
    narration: [
      `Host opens: "Welcome to [Podcast Name] — I'm [Host Name]. Today: ${topic}. Our guest, [Mock Expert], joins us."`,
      `Host: "Tell us about your background in ${topic}." Guest: "[Fictional background, credentials, and perspective]."`,
      `Deep conversation about ${topic}. Key themes: [Theme 1], [Theme 2], [Theme 3]. All fictional, non-factual.`,
      `"The thing most ${audience} miss about ${topic} is..." [Insight — fictional, not real guidance]`,
      `Listener questions (fictional): "How do I start?" / "What's the biggest mistake?" [Fictional answers]`,
      `Host: "Three takeaways: [1], [2], [3]. Thanks for listening. Find us at [mock URL]. Next episode: [mock topic]."`,
    ][i] ?? `Podcast segment on ${topic}.`,
    visuals: "Audio-only — waveform visualization, chapter markers",
    transition: "Music sting", pacing: ["Welcoming", "Conversational", "Exploratory", "Insightful", "Interactive", "Reflective"][i] ?? "Conversational",
    emotion: ["Warmth", "Curiosity", "Depth", "Aha!", "Community", "Inspiration"][i] ?? "Engaged",
  }),
  simulation: (topic, audience, i) => ({
    index: i, title: `Scenario ${i + 1}: ${["Baseline State", "Trigger Event", "Decision Point", "Consequence Branch A", "Consequence Branch B", "Debrief"][i] ?? `Phase ${i + 1}`}`,
    duration: "Learner-paced",
    narration: [
      `You are a ${audience}. Current situation: [${topic} — baseline conditions, all fictional].`,
      `Event occurs: [Fictional trigger — e.g., system alert, stakeholder request, emergency, inquiry].`,
      `Decision required: Option A: [Action A]. Option B: [Action B]. Option C: [Escalate/defer].`,
      `You chose Option A. Result: [Fictional success outcome]. Score: +10 (mock). Well done!`,
      `You chose Option B. Result: [Fictional complication]. Score: 0 (mock). Consider [alternative approach].`,
      `Debrief: The correct response was [A/B/C] because [fictional rationale]. Key learning: [fictional insight].`,
    ][i] ?? `Simulation phase on ${topic}.`,
    visuals: ["Scenario setup screen", "Alert/notification popup", "Choice card interface", "Success outcome animation", "Warning outcome animation", "Debrief summary card"][i] ?? "Scenario screen",
    transition: "Branching path", pacing: "Learner-controlled", emotion: ["Setup", "Urgency", "Agency", "Pride", "Reflection", "Integration"][i] ?? "Engaged",
  }),
  course: (topic, audience, i) => ({
    index: i, title: `Lesson ${i + 1}: ${topic} — Part ${i + 1}`,
    duration: "20:00", narration: `Full lesson content for ${audience} on ${topic} — Part ${i + 1}. [Fictional educational content — non-clinical, non-legal, non-financial].`,
    visuals: "Slide deck + instructor video + downloadable resource (mock)",
    transition: "Next lesson button", pacing: "Self-paced", emotion: "Focused learning",
  }),
  presentation: (topic, audience, i) => ({
    index: i, title: `Slide ${i + 1}: ${["Title & Agenda", "Executive Summary", "Current State", "Proposed Solution", "Business Case", "Risks & Mitigations", "Recommendations", "Q&A"][i] ?? `Section ${i + 1}`}`,
    duration: "3:00 per slide", narration: `Speaker notes for slide ${i + 1}: [Talking points about ${topic} for ${audience}. Fictional — demo use only.]`,
    visuals: ["Title slide with branding", "3-point summary bullets", "Current state diagram (mock)", "Solution architecture (mock)", "ROI table (fictional)", "Risk matrix (mock)", "Action items list", "Thank you + contact"][i] ?? "Content slide",
    transition: "Slide advance", pacing: "Presenter-controlled", emotion: ["Credibility", "Clarity", "Urgency", "Confidence", "Logic", "Caution", "Authority", "Engagement"][i] ?? "Professional",
  }),
  webinar: (topic, audience, i) => ({
    index: i, title: `Segment ${i + 1}`, duration: "12:00",
    narration: `Webinar segment on ${topic} for ${audience}. Includes Q&A prompt at end. [Fictional — not real guidance].`,
    visuals: "Slide + presenter camera", transition: "Screen share", pacing: "Moderated", emotion: "Engaged",
  }),
  commercial: (topic, audience, i) => ({
    index: i, title: ["Opening Hook", "Problem", "Product Reveal", "Close"][i] ?? `Beat ${i + 1}`,
    duration: ["0:00–0:05", "0:05–0:15", "0:15–0:25", "0:25–0:30"][i] ?? "0:08",
    narration: [
      `[Sound effect / music sting]. SUPER: "${topic}." Visual impact immediately.`,
      `Quick pain point: "${audience} knows the feeling of [problem]. There's a better way."`,
      `Product reveal: [Fictional product]. "Introducing [Product Name (mock)]. [Tagline]."`,
      `Logo lockup. URL. Tagline. Music out. End card. [Mock — fictional ad only]`,
    ][i] ?? "Commercial copy",
    visuals: ["High-impact visual", "Relatable B-roll", "Hero product shot", "Logo + CTA"][i] ?? "Ad visual",
    transition: ["Cut", "Dissolve", "Cut", "Fade to black"][i] ?? "Cut",
    pacing: ["Fast", "Empathetic", "Confident", "Punchy"][i] ?? "Fast",
    emotion: ["Attention", "Empathy", "Excitement", "Recall"][i] ?? "Impact",
  }),
};

// ─── Mock Actor Generator ─────────────────────────────────────────────────

const MOCK_NAMES = ["Jordan M.", "Alex T.", "Sam R.", "Morgan K.", "Casey L.", "Taylor P.", "Drew F.", "Quinn B."];
const MOCK_ROLES_CREATIVE = ["Lead Narrator", "Subject Matter Expert (mock)", "Host", "Interviewer", "Presenter", "Protagonist", "Supporting Role", "Voiceover Artist"];

function generateMockActors(count: number): MockActor[] {
  return Array.from({ length: Math.min(count, 4) }, (_, i) => ({
    name: MOCK_NAMES[i] ?? `Actor ${i + 1}`,
    role: MOCK_ROLES_CREATIVE[i] ?? "Supporting",
    background: "Fictional talent — not a real person. Demo placeholder only.",
    style: ["Professional, warm", "Authoritative, calm", "Energetic, relatable", "Measured, thoughtful"][i] ?? "Professional",
  }));
}

// ─── Chapter count by type ────────────────────────────────────────────────

const CHAPTER_COUNTS: Record<CreativeType, number> = {
  video: 6, documentary: 6, training: 6, explainer: 5, storyboard: 8,
  script: 6, podcast: 6, simulation: 6, course: 5, presentation: 8,
  webinar: 4, commercial: 4,
};

// ─── Engine Class ─────────────────────────────────────────────────────────

class UniversalCreativeEngineClass {
  private packages: Map<string, ProductionPackage> = new Map();

  generate(params: {
    type:     CreativeType;
    topic:    string;
    audience: string;
    tone:     string;
    title?:   string;
  }): ProductionPackage {
    const { type, topic, audience, tone, title } = params;
    const count = CHAPTER_COUNTS[type] ?? 5;
    const gen = CHAPTER_PATTERNS[type];
    const chapters: SceneChapter[] = Array.from({ length: count }, (_, i) => gen(topic, audience, i));
    const style = pickStyle(tone);
    const totalMinutes = chapters.reduce((acc, c) => {
      const match = c.duration.match(/(\d+)[:.](\d+)/);
      return match ? acc + parseInt(match[1]) : acc + 3;
    }, 0);
    const pkg: ProductionPackage = {
      id: `pkg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      title: title ?? `${topic} — ${type.charAt(0).toUpperCase() + type.slice(1)} (Mock)`,
      subtitle: `A fictional ${type} for ${audience}`,
      purpose: `To educate, inform, or inspire ${audience} about ${topic} through a ${tone} ${type}. All fictional.`,
      audience,
      tone,
      totalDuration: `~${totalMinutes} minutes (estimated, mock)`,
      structure: `${count} ${type === "documentary" ? "acts" : type === "script" ? "scenes" : type === "storyboard" ? "frames" : "chapters"} across a ${tone} narrative arc`,
      emotionalArc: this.buildEmotionalArc(type, tone),
      chapters,
      styleGuide: style,
      mockActors: generateMockActors(type === "podcast" ? 2 : type === "simulation" ? 1 : 3),
      callToAction: `[Fictional CTA for ${audience}] — Internal demo only. Not a real call to action.`,
      disclaimer: "FICTIONAL & INTERNAL ONLY. This production package is a demo-generated creative outline. It is non-operational, non-factual, and cannot be used as a real production document. All names, organizations, statistics, and scenarios are fictional.",
      generatedAt: new Date().toISOString(),
    };
    this.packages.set(pkg.id, pkg);
    return pkg;
  }

  private buildEmotionalArc(type: CreativeType, tone: string): string {
    const arcs: Record<string, string> = {
      "corporate-video": "Awareness → Problem Recognition → Solution Discovery → Confidence → Action",
      "cinematic-documentary": "Calm Opening → Rising Concern → Complexity Revealed → Turning Point → Cautious Hope → Forward Vision",
      "educational-training": "Curiosity → Learning → Understanding → Practice → Mastery → Pride",
      "playful-explainer": "Surprise → Delight → Clarity → Excitement → Satisfaction",
    };
    const key = `${tone.toLowerCase().split(" ")[0]}-${type}`;
    return arcs[key] ?? `${tone} arc: Introduction → Development → Climax → Resolution → Impact`;
  }

  getAll(): ProductionPackage[] { return [...this.packages.values()]; }
  get(id: string): ProductionPackage | undefined { return this.packages.get(id); }
  delete(id: string) { this.packages.delete(id); }

  getTypeLabel(type: CreativeType): string {
    const labels: Record<CreativeType, string> = {
      video: "Marketing Video", documentary: "Documentary", training: "Training Module",
      simulation: "Interactive Simulation", storyboard: "Storyboard", script: "Script",
      explainer: "Explainer Video", podcast: "Podcast Episode", course: "Online Course",
      presentation: "Presentation", webinar: "Webinar", commercial: "Commercial Spot",
    };
    return labels[type] ?? type;
  }
}

export const CreativeEngine = new UniversalCreativeEngineClass();
