// ─── Creation Store — localStorage persistence for all creations ─────────────

export type CreationType =
  | "movie"
  | "comic"
  | "software"
  | "document"
  | "marketing"
  | "custom";

export interface CreationSection {
  title: string;
  content: string;
}

export interface Creation {
  id: string;
  type: CreationType;
  name: string;
  description: string;
  genre: string;
  style: string;
  tone: string;
  createdAt: string;
  rawContent: string; // full AI-generated text
  sections: CreationSection[]; // parsed sections
}

const STORE_KEY = "createai_creations_v1";

function loadAll(): Creation[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(list: Creation[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch {}
}

export const CreationStore = {
  getAll(): Creation[] {
    return loadAll();
  },

  get(id: string): Creation | undefined {
    return loadAll().find((c) => c.id === id);
  },

  save(creation: Creation) {
    const list = loadAll().filter((c) => c.id !== creation.id);
    list.unshift(creation);
    // Keep max 50
    saveAll(list.slice(0, 50));
  },

  delete(id: string) {
    saveAll(loadAll().filter((c) => c.id !== id));
  },
};

// ─── Parse raw AI output into sections ───────────────────────────────────────
export function parseSections(raw: string): CreationSection[] {
  const lines = raw.split("\n");
  const sections: CreationSection[] = [];
  let current: CreationSection | null = null;

  for (const line of lines) {
    const headerMatch = line.match(/^==\s*(.+?)\s*==\s*$/);
    if (headerMatch) {
      if (current) sections.push(current);
      current = { title: headerMatch[1], content: "" };
    } else {
      if (current) {
        current.content += (current.content ? "\n" : "") + line;
      } else if (line.trim()) {
        current = { title: "Overview", content: line };
      }
    }
  }
  if (current && current.content.trim()) sections.push(current);
  return sections.map((s) => ({ ...s, content: s.content.trim() })).filter((s) => s.content);
}

// ─── Build generation prompts per type ───────────────────────────────────────
export function buildPrompt(
  type: CreationType,
  name: string,
  description: string,
  genre: string,
  style: string,
  tone: string,
): string {
  const disclaimer =
    "All content is mock/simulated and for demonstration only. No real production, publishing, or deployment is implied.";

  const shared = `Title: "${name}"\nDescription: "${description}"\nGenre/Industry: ${genre}\nStyle: ${style}\nTone: ${tone}\n\n${disclaimer}\n\n`;

  const SECTION = (t: string) => `== ${t} ==`;

  if (type === "movie") {
    return `${shared}Generate a complete movie/film treatment. Use == SECTION NAME == markers for each section. Include:

${SECTION("Synopsis")}
A vivid 2-3 paragraph synopsis. Genre: ${genre}, Style: ${style}.

${SECTION("Scene 1 — Opening")}
Full scene description with visual direction, setting, atmosphere, action. Include dialogue snippets.

${SECTION("Scene 2 — Inciting Incident")}
Scene description with character action, dialogue, visual cues.

${SECTION("Scene 3 — Rising Action")}
Scene description with escalating tension, dialogue, and visual beats.

${SECTION("Scene 4 — Midpoint")}
Major turning point. Visual direction, character interaction, dialogue.

${SECTION("Scene 5 — Climax")}
Full climactic scene. Maximum drama, visual spectacle, peak dialogue.

${SECTION("Scene 6 — Resolution")}
Emotional closing scene. Character arcs resolved. Visual tone.

${SECTION("Character: Protagonist")}
Name, role, backstory, personality, key traits, visual description.

${SECTION("Character: Antagonist")}
Name, role, backstory, motivation, visual description.

${SECTION("Character: Supporting")}
Name, role, function in story, key scene.

${SECTION("Full Script Excerpt")}
A properly formatted screenplay excerpt from the most dramatic scene. Include scene headings, action lines, dialogue.

${SECTION("Director's Vision")}
Visual style notes, color palette, cinematography approach, tone and mood.

${SECTION("Marketing — Tagline")}
Three potential taglines and a one-sentence pitch.

${SECTION("Marketing — Trailer Script")}
A 90-second trailer script with beats, music cues, and VO.

${SECTION("Marketing — Social Copy")}
3 social media posts (Instagram, Twitter/X, TikTok) with hashtags.`;
  }

  if (type === "comic") {
    return `${shared}Generate a complete comic book/graphic novel. Use == SECTION NAME == markers.

${SECTION("Story Overview")}
Issue summary, story arc setup, tone and visual style.

${SECTION("Panel 1")}
Panel description: Visual — [what we see]. Caption: [narration text]. Dialogue: [character name]: "[dialogue]". Action notes.

${SECTION("Panel 2")}
Panel description: Visual — [what we see]. Caption: [narration]. Dialogue. Visual composition notes.

${SECTION("Panel 3")}
Panel description with visual, caption, and dialogue.

${SECTION("Panel 4")}
Action panel — dynamic visual, sound effects, minimal dialogue.

${SECTION("Panel 5")}
Emotional beat — close-up or reaction panel. Dialogue and caption.

${SECTION("Panel 6")}
Plot twist or revelation panel. Strong visual, impactful dialogue.

${SECTION("Panel 7")}
Rising tension. Multi-character panel. Dialogue exchange.

${SECTION("Panel 8 — Cliffhanger")}
Final panel. Strong cliffhanger image. Final caption or dialogue.

${SECTION("Character: Hero")}
Name, appearance, powers/skills, backstory, personality, signature look.

${SECTION("Character: Villain")}
Name, appearance, powers, motivation, visual design notes.

${SECTION("Character: Ally")}
Name, role, relationship to hero, visual notes.

${SECTION("Full Issue Script")}
Complete issue script in standard comic format with panel breakdowns, captions, dialogue.

${SECTION("Art Direction")}
Color palette, panel layout style, lettering style, visual mood.

${SECTION("Marketing — Solicitation Copy")}
Publisher-style solicitation text and cover description.

${SECTION("Marketing — Social Copy")}
Launch announcement copy for social media.`;
  }

  if (type === "software") {
    return `${shared}Generate a complete software product specification and UI content. Use == SECTION NAME == markers.

${SECTION("Product Overview")}
What the software does, who it's for, key value proposition, and problem it solves.

${SECTION("Feature 1 — Core Feature")}
Feature name, description, user benefit, workflow steps, UI notes.

${SECTION("Feature 2 — AI Engine")}
AI capabilities built in, what it automates, sample interaction.

${SECTION("Feature 3 — Dashboard")}
Dashboard layout, key metrics, widgets, data shown (mock).

${SECTION("Feature 4 — Workflow Engine")}
Step-by-step workflows the software enables. Primary workflow with all steps.

${SECTION("Feature 5 — Document Suite")}
Documents, exports, reports the software generates.

${SECTION("Feature 6 — Integrations (Future)")}
Third-party integrations this software would connect to in LIVE mode.

${SECTION("Dashboard KPIs")}
6-8 key performance indicators the dashboard tracks. Values (mock), trend direction.

${SECTION("Primary Workflow")}
Step-by-step primary user workflow (8-10 steps) with action descriptions.

${SECTION("Secondary Workflow")}
Second key workflow (5-6 steps).

${SECTION("Marketing — Hero Copy")}
Landing page hero headline, subheadline, and 3 bullet benefits.

${SECTION("Marketing — Features Page")}
Feature grid copy (6 features with icons described and descriptions).

${SECTION("Marketing — Pricing")}
3 pricing tiers with feature lists (all mock).

${SECTION("Documentation — Getting Started")}
Quick start guide for new users (5-7 steps).

${SECTION("Documentation — Key Concepts")}
3-4 core concepts explained in plain language.`;
  }

  if (type === "document") {
    return `${shared}Generate a complete, professional document. Use == SECTION NAME == markers. This is structural/mock content only.

${SECTION("Executive Summary")}
A concise 2-3 paragraph executive summary capturing purpose, key findings, and recommendations.

${SECTION("Introduction")}
Background, context, scope, and purpose of this document. 2-3 paragraphs.

${SECTION("Section 1 — Background & Context")}
Detailed background. Historical context, current state, and why this document is needed.

${SECTION("Section 2 — Key Findings")}
3-5 key findings or main points. Each with explanation. Structural/mock only.

${SECTION("Section 3 — Analysis")}
Detailed analysis of the topic. Multiple paragraphs with structured insights.

${SECTION("Section 4 — Recommendations")}
5-7 specific, actionable recommendations with rationale for each.

${SECTION("Section 5 — Implementation Plan")}
Phased implementation plan with timeline, responsible parties (mock), and success metrics.

${SECTION("Section 6 — Risk Assessment")}
3-5 key risks with likelihood, impact, and mitigation strategies.

${SECTION("Conclusion")}
Closing summary of key points and call to action.

${SECTION("Appendix A — References")}
Mock reference list and supporting materials.

${SECTION("Appendix B — Glossary")}
Key terms and definitions relevant to this document.`;
  }

  if (type === "marketing") {
    return `${shared}Generate a complete marketing system. Use == SECTION NAME == markers.

${SECTION("Brand Positioning")}
Brand position statement, target audience, unique value proposition, competitive differentiator.

${SECTION("Landing Page — Hero Section")}
Hero headline, subheadline, CTA text, and hero description. Trust indicators below fold.

${SECTION("Landing Page — Features")}
Features section with 6 feature blocks (icon described, title, 2-sentence description each).

${SECTION("Landing Page — Social Proof")}
3 mock testimonials with name, company, role, and quote.

${SECTION("Landing Page — CTA Section")}
Bottom CTA section with headline, offer description, and button copy.

${SECTION("Funnel Stage 1 — Awareness")}
Top-of-funnel strategy. Content types, messaging, channels, goals.

${SECTION("Funnel Stage 2 — Interest")}
Middle funnel. Lead magnet idea, opt-in copy, nurture strategy.

${SECTION("Funnel Stage 3 — Decision")}
Decision stage. Offer presentation, objection handling, social proof usage.

${SECTION("Funnel Stage 4 — Action")}
Conversion stage. CTA copy, checkout flow notes, urgency/scarcity (mock).

${SECTION("Email 1 — Welcome")}
Full welcome email: subject line, preheader, body, CTA.

${SECTION("Email 2 — Value Delivery")}
Value email: subject line, body content, CTA.

${SECTION("Email 3 — Offer")}
Sales email: subject line, body with offer, CTA, P.S. line.

${SECTION("Ad Copy — Social")}
2 Facebook/Instagram ad variants: headline, primary text, description, CTA.

${SECTION("Ad Copy — Search")}
2 Google Search ad variants: headline 1/2/3, description 1/2.

${SECTION("Content Calendar — Week 1")}
7-day social content calendar with post type, topic, caption, and hashtags for each day.`;
  }

  // custom
  return `${shared}Generate a complete, rich product/creation based on this description. Use == SECTION NAME == markers. Be creative and thorough.

${SECTION("Overview")}
Full description of what this creation is, its purpose, audience, and key elements.

${SECTION("Core Content — Part 1")}
The main content. Rich, detailed, and fully developed. First major section.

${SECTION("Core Content — Part 2")}
Second major section with additional depth and detail.

${SECTION("Core Content — Part 3")}
Third section continuing the content development.

${SECTION("Interactive Features")}
Key interactive elements, user actions, or engagement points if applicable.

${SECTION("Supporting Elements")}
Supporting content, data, references, or supplementary materials (mock).

${SECTION("AI Capabilities")}
How AI is integrated or could enhance this creation.

${SECTION("Marketing Copy")}
How to present and promote this creation. Tagline, description, key selling points.

${SECTION("Downloads & Exports")}
What can be downloaded or exported from this creation and in what format.

${SECTION("Next Steps")}
What a user should do next. How to expand, iterate, or build on this creation.`;
}
