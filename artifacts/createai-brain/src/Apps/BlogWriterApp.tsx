// Auto-generated app — Blog Writer
import { GenericEngineApp, type GenericEngineAppConfig } from "./GenericEngineApp";

const CONFIG: GenericEngineAppConfig = {
  appId: "blogwriter",
  title: "Blog Writer",
  icon: "✍️",
  color: "#16a34a",
  description: "Blog posts, content strategy, SEO writing, and audience-focused content creation.",
  engines: [
    {
      id: "BlogPostEngine",
      name: "Blog Post Writer",
      icon: "📄",
      tagline: "Content craftsman",
      description: "Writes complete, structured blog posts with headers, examples, and clear takeaways.",
      placeholder: "What is the blog post topic and who is the target reader?",
      example: "e.g. A post for small business owners about using AI to write better customer emails",
      color: "#16a34a",
    },
    {
      id: "HeadlineEngine",
      name: "Headline Generator",
      icon: "🎯",
      tagline: "Attention architect",
      description: "Generates 10 irresistible headlines for any blog post topic using proven formulas.",
      placeholder: "What is the topic and main value of your blog post?",
      example: "e.g. A post about why most productivity advice fails for people with ADHD",
      color: "#15803d",
    },
    {
      id: "SEOStructureEngine",
      name: "SEO Structurer",
      icon: "🔍",
      tagline: "Search architect",
      description: "Designs SEO-optimized post structure with keyword placement, meta descriptions, and headers.",
      placeholder: "What keyword or topic are you targeting?",
      example: "e.g. Targeting 'how to start a podcast with no audience' for beginner creators",
      color: "#16a34a",
    },
    {
      id: "IntroHookEngine",
      name: "Intro Hook Writer",
      icon: "🎣",
      tagline: "Hook architect",
      description: "Writes blog introductions that immediately address reader pain and promise a solution.",
      placeholder: "What pain point does your blog post solve?",
      example: "e.g. Readers who start creative projects and abandon them before finishing",
      color: "#15803d",
    },
    {
      id: "ContentStrategyEngine",
      name: "Content Strategy",
      icon: "📅",
      tagline: "Strategy planner",
      description: "Designs 12-week content calendars aligned with audience, goals, and platform.",
      placeholder: "What is your brand, audience, and content goal?",
      example: "e.g. A B2B SaaS company targeting HR directors who struggle with employee retention",
      color: "#16a34a",
    }
  ],
};

export function BlogWriterApp() {
  return <GenericEngineApp config={CONFIG} />;
}
