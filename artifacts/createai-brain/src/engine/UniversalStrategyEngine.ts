// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL STRATEGY & ROADMAP MODULE
// Point 21 of the Universal Creative System.
// INTERNAL · FICTIONAL · CONCEPTUAL · NON-OPERATIONAL.
//
// Provides conceptual planning: roadmaps, milestones, growth strategies,
// competitive positioning, market analysis, revenue modeling, sequencing.
//
// IMPORTANT: This module provides CONCEPTUAL PLANNING ASSISTANCE ONLY.
// It does not provide real business advice, real market data, real revenue
// guarantees, or real competitive intelligence. All outputs are fictional,
// internal, and non-operational. No outcomes are guaranteed or implied.
// ═══════════════════════════════════════════════════════════════════════════

export type StrategyFocus =
  | "growth" | "revenue" | "product" | "market" | "competitive"
  | "hiring" | "technology" | "partnerships" | "creative-ip" | "platform"
  | "expansion" | "turnaround";

export type TimeHorizon = "30-day" | "90-day" | "6-month" | "1-year" | "3-year" | "5-year";

export interface StrategicMilestone {
  index:       number;
  phase:       string;
  title:       string;
  description: string;
  keyActions:  string[];
  successMetric: string;
  riskNote:    string;
  timeframe:   string;
}

export interface CompetitivePosition {
  strengthAreas:   string[];
  gapAreas:        string[];
  differentiators: string[];
  threats:         string[];
  opportunities:   string[];
  positioning:     string;
}

export interface RevenueModel {
  streams:         { name: string; type: string; description: string; stage: string }[];
  prioritization:  string;
  assumptions:     string[];
  disclaimer:      string;
}

export interface StrategyRoadmap {
  id:             string;
  title:          string;
  focus:          StrategyFocus;
  horizon:        TimeHorizon;
  context:        string;
  northStar:      string;
  principles:     string[];
  milestones:     StrategicMilestone[];
  competitive:    CompetitivePosition;
  revenueModel:   RevenueModel;
  risks:          { level: string; description: string; mitigation: string }[];
  quickWins:      string[];
  longBets:       string[];
  recommendation: string;
  disclaimer:     string;
  generatedAt:    string;
}

// ─── North star templates ──────────────────────────────────────────────────

const NORTH_STARS: Record<StrategyFocus, string[]> = {
  growth:       ["Achieve sustainable user/audience growth by building genuine value loops that attract and retain the right people. [Conceptual]", "Grow the right way — quality over quantity — by serving a defined audience exceptionally well before expanding. [Conceptual]"],
  revenue:      ["Build a diversified revenue model where no single stream exceeds 60% of total income, ensuring resilience. [Conceptual]", "Monetize through value-add — charge for genuine value delivered, not for access to core utility. [Conceptual]"],
  product:      ["Ship a product so useful that it solves a real problem better than alternatives, then expand from that base. [Conceptual]", "Define the product's singular mission and execute ruthlessly toward it before adding features. [Conceptual]"],
  market:       ["Dominate a narrow market segment first, then use that stronghold to expand adjacently. [Conceptual]", "Find where existing solutions fall short for underserved users and build directly for them. [Conceptual]"],
  competitive:  ["Win by being genuinely different — not by copying leaders, but by serving needs they structurally cannot serve. [Conceptual]", "Compete on quality of experience and community trust, not on feature parity. [Conceptual]"],
  hiring:       ["Build a team with complementary skills and shared values — hire slowly, especially for culture-critical roles. [Conceptual]", "Define the 5 roles that will unlock the next growth phase and fill them before anything else. [Conceptual]"],
  technology:   ["Technology is a means to an outcome — prioritize the outcomes users care about, then choose the best technical path. [Conceptual]", "Build a tech foundation that scales to 10× usage without architectural rethink. [Conceptual]"],
  partnerships: ["Pursue partnerships where both parties bring irreplaceable assets — avoid dependency on a single partner. [Conceptual]", "Strategic partnerships should open distribution channels or capabilities that would take 2+ years to build independently. [Conceptual]"],
  "creative-ip": ["Build an IP universe that grows in value with every new format — each release makes all previous releases more valuable. [Conceptual]", "Develop characters and worlds with enough depth that they can carry any format — game, film, comic, or experience. [Conceptual]"],
  platform:     ["A platform wins when third parties build more value on it than the platform owner could alone. [Conceptual]", "Platform strategy: solve the cold-start problem by manually curating the first cohort of creators/users. [Conceptual]"],
  expansion:    ["Expand into new markets only after achieving category dominance in the core market. [Conceptual]", "Sequenced expansion: nail the core, validate adjacency, then move — never expand in multiple directions simultaneously. [Conceptual]"],
  turnaround:   ["Turnarounds require ruthless prioritization — cut everything that isn't the core, then rebuild from the unit economics. [Conceptual]", "Stabilize, then grow — in that order. Find the smallest viable version of the operation that still delivers real value. [Conceptual]"],
};

// ─── Milestone templates ───────────────────────────────────────────────────

const MILESTONE_TEMPLATES: Record<StrategyFocus, Omit<StrategicMilestone, "index">[]> = {
  growth: [
    { phase: "Foundation", title: "Define the Core Audience", description: "Identify the 1,000 people who would genuinely miss you if you stopped. Understand them deeply.", keyActions: ["Run 20+ user interviews", "Map the problem in their own words", "Define 3 user personas", "Identify the trigger moment that brings them to you"], successMetric: "Clear written profile of core user: problem, behavior, motivation", riskNote: "Risk: defining too broad an audience leads to weak product-market fit signals", timeframe: "Weeks 1–4 [conceptual]" },
    { phase: "Activation", title: "Achieve 100 Deeply Engaged Users", description: "Focus entirely on serving 100 users exceptionally — depth over breadth at this stage.", keyActions: ["Onboard users manually if needed", "Gather qualitative feedback weekly", "Remove every friction point in the core flow", "Measure weekly retention, not acquisition"], successMetric: "70%+ of users return week-over-week", riskNote: "Risk: chasing growth metrics before retention metrics are solved leads to leaky-bucket growth", timeframe: "Months 1–3 [conceptual]" },
    { phase: "Momentum", title: "Build a Sustainable Acquisition Loop", description: "Design a growth loop where new users arrive as a byproduct of value delivered to existing users.", keyActions: ["Map current acquisition channels by quality (LTV/CAC)", "Identify the referral/sharing moment in the product", "Build one self-sustaining loop before paying for growth", "Test content, community, or partnership channels"], successMetric: "Organic growth rate > paid growth rate", riskNote: "Risk: over-investing in paid acquisition before organic loops exist creates unsustainable unit economics", timeframe: "Months 3–6 [conceptual]" },
    { phase: "Scale", title: "Expand to Adjacent Audiences", description: "After proving core retention and acquisition, expand to adjacent segments using proven playbooks.", keyActions: ["Define adjacent audience segments", "Adapt product or messaging for each", "Apply the same loop logic — retention before acquisition", "Measure cannibalization risk"], successMetric: "3× growth without proportional team growth", riskNote: "Risk: expanding too early dilutes focus and slows core market growth", timeframe: "Months 6–18 [conceptual]" },
  ],
  revenue: [
    { phase: "Revenue Foundation", title: "Validate Willingness to Pay", description: "Before building a revenue model, confirm that users will actually pay for the value you deliver.", keyActions: ["Run price sensitivity conversations with 20+ users", "Test pricing with a small cohort", "Identify the value metric (per seat, per use, per output)", "Define the free/paid boundary"], successMetric: "First paying customers acquired without discounts", riskNote: "Risk: assuming users will pay based on engagement data alone — engagement ≠ willingness to pay", timeframe: "Month 1–2 [conceptual]" },
    { phase: "Primary Stream", title: "Stabilize the Core Revenue Stream", description: "Build predictable, recurring revenue from the primary stream before diversifying.", keyActions: ["Implement subscription, transactional, or licensing model", "Reduce churn below 5% monthly", "Automate billing and renewal", "Build a customer success loop"], successMetric: "MRR growing at 15%+ month-over-month [conceptual target]", riskNote: "Risk: diversifying revenue streams too early splits focus and slows growth of the primary stream", timeframe: "Months 2–6 [conceptual]" },
    { phase: "Diversification", title: "Add a Second Revenue Stream", description: "Once the primary stream is stable and predictable, add a complementary stream.", keyActions: ["Identify the adjacent value you already deliver but don't charge for", "Test a services, premium, or data stream", "Ensure new stream doesn't cannibalize the primary"], successMetric: "Secondary stream reaches 20% of total revenue", riskNote: "Risk: second stream creating misaligned incentives or brand confusion", timeframe: "Months 6–12 [conceptual]" },
    { phase: "Optimization", title: "Optimize Unit Economics", description: "Improve LTV:CAC ratio, reduce cost of revenue, and increase margin.", keyActions: ["Map full customer journey cost", "Identify highest-LTV user segments", "Reduce churn through proactive success programs", "Automate the highest-cost manual revenue processes"], successMetric: "LTV:CAC ratio > 3:1 [conceptual benchmark]", riskNote: "Risk: optimizing for margin at the expense of customer experience kills the engine that generates revenue", timeframe: "Ongoing from Month 6 [conceptual]" },
  ],
  product: [
    { phase: "Core Definition", title: "Define the Singular Product Bet", description: "Eliminate everything that isn't the core product value. Know what problem you are uniquely solving.", keyActions: ["Write a one-sentence product thesis", "List every feature and mark: core / nice-to-have / kill", "Remove all nice-to-haves for at least 60 days", "Map the minimum experience that delivers the core value"], successMetric: "Users can describe the product's value in one sentence without prompting", riskNote: "Risk: building features users request rather than features that solve the core problem", timeframe: "Month 1 [conceptual]" },
    { phase: "Quality", title: "Make the Core Experience Excellent", description: "Don't add features. Make the current experience as good as it can possibly be.", keyActions: ["Identify the 3 moments that define first-time experience", "Obsess over onboarding quality", "Reduce time-to-value for new users", "Ship 10 quality improvements for every 1 new feature"], successMetric: "NPS > 50 among active users [conceptual]", riskNote: "Risk: shipping too fast leads to technical debt that makes future improvements exponentially harder", timeframe: "Months 1–4 [conceptual]" },
    { phase: "Expansion", title: "Add Features Users Will Pay For", description: "Only expand the product when the core is excellent and users are asking for more.", keyActions: ["Identify the top 5 user requests that align with the product thesis", "Build the one that unlocks a new revenue tier", "Test with a small cohort before full release"], successMetric: "Feature adoption rate > 40% within 30 days of launch [conceptual]", riskNote: "Risk: feature bloat — adding features that reduce the clarity of the core product experience", timeframe: "Months 4–9 [conceptual]" },
    { phase: "Platform", title: "Open the Product to Third Parties", description: "If applicable: build APIs, SDKs, or marketplaces that let others extend the product's value.", keyActions: ["Define the platform opportunity (distribution, data, ecosystem)", "Build a minimal API or SDK", "Recruit 5 early integration partners", "Document and support the developer experience"], successMetric: "Third-party integrations drive 10%+ of new user acquisition [conceptual]", riskNote: "Risk: opening platform before the core is stable fragments the user experience", timeframe: "Months 9–18 [conceptual]" },
  ],
  market:        [{ phase: "Beachhead", title: "Own One Narrow Segment", description: "Dominate a narrow, well-defined market segment before expanding.", keyActions: ["Define the beachhead: specific geography, use case, or user type", "Capture 10–20% of the beachhead market", "Build category awareness in that segment"], successMetric: "Recognized as the leading solution in the beachhead segment", riskNote: "Risk: expanding before the beachhead is solidified", timeframe: "Months 1–12 [conceptual]" }, { phase: "Expansion", title: "Move to Adjacent Segments", description: "Apply learnings and brand from beachhead to adjacent markets.", keyActions: ["Map adjacencies by shared buyer profile or problem", "Adapt go-to-market for each adjacency", "Track segment-level metrics separately"], successMetric: "2–3 segments at meaningful penetration simultaneously", riskNote: "Risk: spreading too thin before any segment reaches critical mass", timeframe: "Months 12–30 [conceptual]" }],
  competitive:   [{ phase: "Differentiation", title: "Define Your Genuine Difference", description: "Identify what you do that category leaders structurally cannot — then build relentlessly toward it.", keyActions: ["Map the category leader's structural constraints", "Identify the user need they systematically underserve", "Build your roadmap around that unmet need", "Make the difference obvious in every touchpoint"], successMetric: "Users choose you despite higher price or lower brand recognition", riskNote: "Risk: competing on features where the leader will always outspend you", timeframe: "Ongoing [conceptual]" }],
  hiring:        [{ phase: "Seed Team", title: "Hire the 5 Unlock Roles", description: "Identify the 5 roles that will unlock the next phase of growth and prioritize filling them.", keyActions: ["Define the 5 roles by outcome, not by title", "Build a structured interview process before hiring", "Hire for high growth potential in early roles", "Set 90-day success criteria for every hire"], successMetric: "All 5 roles filled and productive within 90 days [conceptual]", riskNote: "Risk: hiring too fast leads to cultural dilution and costly mis-hires", timeframe: "Months 1–6 [conceptual]" }, { phase: "Culture", title: "Codify the Culture Before It Codifies Itself", description: "Explicitly define values and operating principles before the team grows past 10.", keyActions: ["Write the actual operating principles (not aspirational values)", "Document how decisions get made", "Create onboarding that transmits culture explicitly", "Hire a culture-carrier, not just a skill-set"], successMetric: "New hires describe the culture accurately in their first 30 days", riskNote: "Risk: culture drift at scale is extremely hard to reverse", timeframe: "Before hiring person 10 [conceptual]" }],
  technology:    [{ phase: "Architecture", title: "Build for 10× Scale Without Rearchitecting", description: "Design the technical foundation to handle 10× current load without a full rebuild.", keyActions: ["Define the scaling bottlenecks before they are problems", "Choose boring, proven technologies for the core", "Document architectural decisions with rationale", "Build observability before you need it"], successMetric: "System handles 10× load with <20% additional infrastructure cost [conceptual]", riskNote: "Risk: over-engineering for 1000× before proving 10× need wastes significant engineering time", timeframe: "Month 1–3 [conceptual]" }],
  partnerships:  [{ phase: "Strategic Alignment", title: "Identify 3 Tier-1 Partnership Targets", description: "Define partnerships that open distribution or capabilities you cannot build alone in reasonable time.", keyActions: ["Map what each target partner gains from the deal", "Build leverage before approaching (proof of traction)", "Start with a small pilot, not a full integration", "Negotiate mutual metrics for success"], successMetric: "1 signed partnership driving measurable outcome within 6 months", riskNote: "Risk: pursuing too many partnerships dilutes focus; one great partner > five weak ones", timeframe: "Months 3–9 [conceptual]" }],
  "creative-ip": [{ phase: "IP Foundation", title: "Establish the Core IP Asset", description: "Build the foundational story, world, and characters with enough depth to support any format.", keyActions: ["Write the world bible", "Develop 3–5 anchor characters with full arcs", "Define the IP's thematic spine", "Create the flagship format that introduces the IP"], successMetric: "IP feels complete and internally consistent in the founding format", riskNote: "Risk: expanding IP into new formats before the foundation is solid leads to inconsistent fan experience", timeframe: "Months 1–12 [conceptual]" }, { phase: "Format Expansion", title: "Expand IP Across 2 Additional Formats", description: "Each new format should make the IP more valuable and introduce it to new audiences.", keyActions: ["Choose formats that complement rather than compete with each other", "Ensure each format adds new canonical content to the universe", "Build format-specific fanbases while maintaining a cross-format community", "License carefully — prioritize quality of execution over speed of expansion"], successMetric: "Second and third formats generate audience crossover with first format", riskNote: "Risk: over-licensing dilutes brand quality and reduces fan trust", timeframe: "Months 12–36 [conceptual]" }],
  platform:      [{ phase: "Platform Foundation", title: "Solve the Cold-Start Problem", description: "The first platform challenge is getting enough supply AND demand to create self-sustaining network effects.", keyActions: ["Manually curate first cohort of creators/supply-side participants", "Subsidize early demand-side participation if necessary", "Build platform tools that are useful even with zero network effects", "Choose the smallest viable market for initial traction"], successMetric: "Platform retains 60%+ of both supply and demand sides after 30 days [conceptual]", riskNote: "Risk: launching to all users before network effects exist results in a ghost-town experience that is very hard to recover from", timeframe: "Months 1–6 [conceptual]" }],
  expansion:     [{ phase: "Core Dominance", title: "Achieve Category Leadership in Core Market", description: "Do not begin geographic or segment expansion until you lead in the core.", keyActions: ["Define 'leadership' with measurable criteria", "Reach that threshold in the core before allocating expansion resources", "Document what works in the core — this is your expansion playbook"], successMetric: "Core market at target leadership position", riskNote: "Risk: premature expansion weakens the core and fails to get traction in new markets simultaneously", timeframe: "Variable by core market size [conceptual]" }],
  turnaround:    [{ phase: "Stabilization", title: "Stop the Bleeding", description: "Ruthlessly prioritize: cut everything that isn't the core value proposition and stabilize the unit economics.", keyActions: ["Cut any activity with negative ROI immediately", "Identify the smallest team that can deliver the core product", "Communicate the new focus clearly to all stakeholders", "Set a realistic 90-day survival plan"], successMetric: "Monthly burn rate reduced to sustainable level within 90 days [conceptual]", riskNote: "Risk: cutting too deep damages the ability to deliver core value; cutting too shallow extends the problem", timeframe: "Days 1–90 [conceptual]" }, { phase: "Rebuild", title: "Rebuild from Proven Value", description: "Identify the smallest version of the product that genuinely delivers value and grow from there.", keyActions: ["Identify remaining loyal users — understand why they stayed", "Build around the thing that keeps them", "Rehire selectively — only roles that unlock the rebuild plan", "Set clear 6-month milestones with board/stakeholder alignment"], successMetric: "Month-over-month growth resumes from a sustainable base [conceptual]", riskNote: "Risk: rushing back to scale before unit economics are healthy repeats the problem that caused the turnaround situation", timeframe: "Months 3–12 [conceptual]" }],
};

// ─── Competitive position builder ─────────────────────────────────────────

function buildCompetitive(focus: StrategyFocus, context: string): CompetitivePosition {
  return {
    strengthAreas: [
      "Agility — ability to move faster than larger incumbents [conceptual]",
      "Focus — solving one problem better than generalists [conceptual]",
      "Proximity to users — deeper feedback loops than category leaders [conceptual]",
      "Cultural freshness — not burdened by legacy decisions [conceptual]",
    ],
    gapAreas: [
      "Brand recognition vs. established players [conceptual]",
      "Distribution scale — fewer existing channels [conceptual]",
      "Capital depth for sustained market investment [conceptual]",
    ],
    differentiators: [
      `Core differentiator for ${focus}: ${context.slice(0, 60) || "the stated focus area"} [fictional assessment]`,
      "Execution quality on the specific user problem [conceptual]",
      "Community and trust-building approach [conceptual]",
    ],
    threats: [
      "Category leader copies your core feature [conceptual risk]",
      "Better-funded entrant targets the same beachhead [conceptual risk]",
      "Market conditions shift the urgency of the problem [conceptual risk]",
    ],
    opportunities: [
      "Category leader's structural inability to serve your target user [conceptual opportunity]",
      "Underserved geographic or demographic segment [conceptual opportunity]",
      "Technology shift that levels the playing field [conceptual opportunity]",
    ],
    positioning: `Conceptual positioning for a ${focus} strategy: compete on [specific differentiator], not on [category leader's strength]. Target users who [specific unmet need]. Price/position to reflect [genuine value delivered]. [Conceptual — not a real market position]`,
  };
}

// ─── Revenue model builder ─────────────────────────────────────────────────

function buildRevenueModel(focus: StrategyFocus): RevenueModel {
  const streams: RevenueModel["streams"] = [
    { name: "Core Product / Service", type: "Primary", description: `Direct monetization of the core value proposition. Recommended model: subscription or usage-based for ${focus} contexts. [Conceptual]`, stage: "Launch" },
    { name: "Premium Tier / Features", type: "Secondary", description: "Higher-value users pay for advanced functionality, increased limits, or priority access. [Conceptual]", stage: "6 months post-launch [conceptual]" },
    { name: "Partnerships / Licensing", type: "Tertiary", description: "IP licensing, API access, or co-marketing arrangements with complementary businesses. [Conceptual]", stage: "12 months post-launch [conceptual]" },
    { name: "Community / Events", type: "Supplementary", description: "Paid events, community access, certifications, or experiences. [Conceptual]", stage: "18 months post-launch [conceptual]" },
  ];
  return {
    streams,
    prioritization: "Priority order: (1) Core Product → (2) Premium Tier → (3) Partnerships → (4) Community. Do not pursue streams 3 or 4 until stream 1 is at sustainable MRR. [Conceptual]",
    assumptions: [
      "Users are willing to pay for genuine value delivered — validated through user research [conceptual assumption]",
      "The primary stream can reach sustainable scale within 12–18 months [conceptual assumption]",
      "Churn can be maintained below category average through product quality [conceptual assumption]",
      "No single revenue stream should exceed 60% of total revenue at maturity [conceptual assumption]",
    ],
    disclaimer: "FICTIONAL REVENUE MODEL. All revenue streams, figures, timelines, and assumptions are entirely conceptual and for planning discussion only. This is not financial advice. No revenue is guaranteed or implied.",
  };
}

// ─── Engine Class ──────────────────────────────────────────────────────────

class UniversalStrategyEngineClass {
  private roadmaps: Map<string, StrategyRoadmap> = new Map();

  generate(params: {
    focus:    StrategyFocus;
    horizon:  TimeHorizon;
    context?: string;
    title?:   string;
  }): StrategyRoadmap {
    const { focus, horizon, context = "a creative and technology platform", title } = params;

    const northStarOptions = NORTH_STARS[focus] ?? NORTH_STARS.growth;
    const northStar = northStarOptions[Math.floor(Math.random() * northStarOptions.length)];
    const milestoneTemplates = MILESTONE_TEMPLATES[focus] ?? MILESTONE_TEMPLATES.growth;

    const generatedTitle = title ?? `${focus.charAt(0).toUpperCase() + focus.slice(1)} Strategy — ${horizon} Roadmap`;

    const milestones: StrategicMilestone[] = milestoneTemplates.map((m, i) => ({
      ...m,
      index: i,
    }));

    const roadmap: StrategyRoadmap = {
      id:          `strategy_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      title:       generatedTitle,
      focus, horizon, context,
      northStar,
      principles: [
        "Focus: do fewer things better than doing many things adequately. [Conceptual]",
        "Sequencing: solve the foundational constraint before the next one — don't skip steps. [Conceptual]",
        "Evidence: make decisions based on the smallest viable experiment that gives a clear signal. [Conceptual]",
        "Honesty: bad news early is better than bad news late — maintain visibility into what's not working. [Conceptual]",
        "People: the team that executes is more important than the strategy on paper. [Conceptual]",
      ],
      milestones,
      competitive:  buildCompetitive(focus, context),
      revenueModel: buildRevenueModel(focus),
      risks: [
        { level: "High", description: "Competitive response from a well-funded incumbent copying the core value proposition. [Conceptual]", mitigation: "Build community, switching costs, and data advantages that cannot be easily replicated. [Conceptual]" },
        { level: "High", description: "Failure to achieve product-market fit within the planned timeframe. [Conceptual]", mitigation: "Set explicit PMF criteria, measure weekly, and pivot methodology (not vision) if signals are absent after 3 months. [Conceptual]" },
        { level: "Medium", description: "Key team departures during critical growth phase. [Conceptual]", mitigation: "Vest equity fairly, build documentation and systems that reduce key-person dependency, and maintain culture actively. [Conceptual]" },
        { level: "Medium", description: "Market timing — the problem becomes less urgent or a macro shift changes demand. [Conceptual]", mitigation: "Build for problems that are durable, not trend-dependent. Maintain financial flexibility to pivot if market conditions shift. [Conceptual]" },
        { level: "Low", description: "Technology or platform dependency risk — a critical vendor changes terms. [Conceptual]", mitigation: "Identify single-vendor dependencies early and build contingency alternatives. [Conceptual]" },
      ],
      quickWins: [
        `Week 1–2: Map the current state honestly — users, revenue, team, and constraints. [Conceptual action]`,
        `Week 2–4: Identify the single highest-leverage action for ${focus} and execute it before anything else. [Conceptual action]`,
        `Month 1: Establish a weekly metrics review with explicit targets and owners. [Conceptual action]`,
        `Month 1–2: Make 3 decisions you have been avoiding that are blocking forward progress. [Conceptual action]`,
      ],
      longBets: [
        `Invest early in community building — it compounds slowly but becomes a durable competitive advantage. [Conceptual long-term bet]`,
        `Build the infrastructure for trust (documentation, transparency, quality) before you need it at scale. [Conceptual long-term bet]`,
        `The 3-year investment that will seem obvious in hindsight: ${["talent density", "IP ownership", "data flywheel", "distribution independence", "platform ecosystem"][Math.floor(Math.random() * 5)]}. [Conceptual long-term bet]`,
      ],
      recommendation: `For a ${focus} strategy with a ${horizon} horizon in the context of ${context}: begin with the Foundation milestone, establish weekly progress signals, and resist the temptation to move to the next milestone before the current one is genuinely complete. The sequencing matters more than the speed. [Conceptual strategic guidance — not real advice]`,
      disclaimer: "CONCEPTUAL PLANNING ASSISTANCE ONLY. This roadmap is entirely fictional and non-operational. It provides general planning frameworks for discussion purposes. It does not constitute real business advice, real market analysis, real financial guidance, or real competitive intelligence. No outcomes, milestones, or revenue figures are guaranteed or implied. Always consult qualified professionals for real strategic, financial, or legal decisions.",
      generatedAt: new Date().toISOString(),
    };

    this.roadmaps.set(roadmap.id, roadmap);
    return roadmap;
  }

  getAll(): StrategyRoadmap[] { return [...this.roadmaps.values()]; }
  get(id: string): StrategyRoadmap | undefined { return this.roadmaps.get(id); }
  delete(id: string) { this.roadmaps.delete(id); }

  getFocusOptions(): { value: StrategyFocus; label: string; icon: string; desc: string }[] {
    return [
      { value: "growth",        label: "User Growth",          icon: "📈", desc: "Acquisition, retention, and sustainable growth loops" },
      { value: "revenue",       label: "Revenue Model",        icon: "💰", desc: "Monetization, pricing, and diversification strategy" },
      { value: "product",       label: "Product Strategy",     icon: "📦", desc: "Roadmap, feature prioritization, and quality investment" },
      { value: "market",        label: "Market Strategy",      icon: "🗺️", desc: "Beachhead selection, expansion sequencing, positioning" },
      { value: "competitive",   label: "Competitive Strategy", icon: "⚔️", desc: "Differentiation, moats, and competitive response planning" },
      { value: "hiring",        label: "Team Building",        icon: "👥", desc: "Hiring plan, culture, org design, and unlock roles" },
      { value: "technology",    label: "Technology Strategy",  icon: "⚙️", desc: "Architecture, tech stack, scaling, and build/buy/partner" },
      { value: "partnerships",  label: "Partnerships",         icon: "🤝", desc: "Strategic alliance targets, deal structure, and leverage" },
      { value: "creative-ip",   label: "Creative IP",          icon: "🎨", desc: "IP universe, format expansion, and licensing strategy" },
      { value: "platform",      label: "Platform Strategy",    icon: "🏗️", desc: "Ecosystem design, network effects, and cold-start plan" },
      { value: "expansion",     label: "Market Expansion",     icon: "🌍", desc: "Geographic or vertical expansion sequencing" },
      { value: "turnaround",    label: "Turnaround",           icon: "🔄", desc: "Stabilization, prioritization, and rebuild from core value" },
    ];
  }

  getHorizonOptions(): { value: TimeHorizon; label: string }[] {
    return [
      { value: "30-day",  label: "30 Days" },
      { value: "90-day",  label: "90 Days" },
      { value: "6-month", label: "6 Months" },
      { value: "1-year",  label: "1 Year" },
      { value: "3-year",  label: "3 Years" },
      { value: "5-year",  label: "5 Years" },
    ];
  }
}

export const StrategyEngine = new UniversalStrategyEngineClass();
