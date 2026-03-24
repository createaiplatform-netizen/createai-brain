// src/universe/connectivityMap.ts
// INTERNAL + EXTERNAL CONNECTIVITY MAP
// Describes how your system is structured inside (internal) and how it could relate outside (external).
// Purely declarative: no network calls, no real-world delivery, no activation.

export type ConnectivityDirection = {
  name:     string;
  scope:    "internal" | "external";
  includes: string[];
  purpose:  string;
  notes?:   string;
};

export const INTERNAL_DIRECTIONS: ConnectivityDirection[] = [
  {
    name:  "Internal Internet",
    scope: "internal",
    includes: [
      "Internal routing",
      "Internal domains",
      "Internal addressing",
      "Internal resolution"
    ],
    purpose: "Provides a private communication fabric inside your universe for all components to talk safely."
  },
  {
    name:  "Internal Router",
    scope: "internal",
    includes: [
      "Route selection",
      "Path resolution",
      "Handler dispatch"
    ],
    purpose: "Determines where internal events and messages should go within the system."
  },
  {
    name:  "Internal Bridge",
    scope: "internal",
    includes: [
      "Cross-layer communication",
      "Cross-domain linking",
      "Shared context passing"
    ],
    purpose: "Connects different internal domains and layers so they can share state and intent."
  },
  {
    name:  "Internal Domains",
    scope: "internal",
    includes: [
      "Identity domain",
      "Theme domain",
      "Universe domain",
      "Relationship domain",
      "Time domain",
      "Emotion domain",
      "Narrative domain",
      "Ecosystem domain",
      "Possibility domain"
    ],
    purpose: "Organizes internal logic into clear, focused areas of responsibility."
  },
  {
    name:  "Internal Lifecycle",
    scope: "internal",
    includes: [
      "Activation",
      "Presence",
      "Integration loop",
      "Body layers",
      "Ceiling",
      "Inspection"
    ],
    purpose: "Defines how any internal event moves through the system from entry to completion."
  }
];

export const EXTERNAL_DIRECTIONS: ConnectivityDirection[] = [
  {
    name:  "External SMS",
    scope: "external",
    includes: [
      "Phone carriers",
      "SMS providers (e.g., Twilio)",
      "Verified sender numbers",
      "Delivery reports"
    ],
    purpose: "Sends text messages to real phone numbers via third-party providers.",
    notes: "Requires a real SMS provider, billing, and compliance. Not activated by this file."
  },
  {
    name:  "External Email",
    scope: "external",
    includes: [
      "Email providers (e.g., SendGrid, SES, Mailgun)",
      "Verified domains",
      "SPF/DKIM/DMARC",
      "Inbox delivery"
    ],
    purpose: "Delivers emails to real inboxes using external email infrastructure.",
    notes: "Requires domain verification and provider setup. Not activated by this file."
  },
  {
    name:  "External Push Notifications",
    scope: "external",
    includes: [
      "Mobile push services (e.g., Firebase, APNs)",
      "Device tokens",
      "App registration"
    ],
    purpose: "Sends notifications to installed apps on real devices.",
    notes: "Requires mobile apps and push provider configuration."
  },
  {
    name:  "External Webhooks",
    scope: "external",
    includes: [
      "Outgoing HTTP requests",
      "Third-party endpoints",
      "Signed payloads"
    ],
    purpose: "Notifies other systems when events happen inside your universe.",
    notes: "Requires external URLs and security configuration."
  },
  {
    name:  "External APIs",
    scope: "external",
    includes: [
      "Third-party REST/GraphQL APIs",
      "Auth tokens",
      "Rate limits"
    ],
    purpose: "Lets your system consume data or services from other platforms.",
    notes: "Requires API keys and explicit integration work."
  },
  {
    name:  "External Identity Providers",
    scope: "external",
    includes: [
      "OAuth providers (e.g., Google, Apple, Microsoft)",
      "Login flows",
      "Token validation"
    ],
    purpose: "Allows users to sign in using external accounts.",
    notes: "Requires provider setup and redirect configuration."
  },
  {
    name:  "External Payments",
    scope: "external",
    includes: [
      "Payment processors (e.g., Stripe, PayPal)",
      "Checkout flows",
      "Webhooks for payment events"
    ],
    purpose: "Enables real-world transactions tied to your platform.",
    notes: "Requires merchant accounts and strict compliance."
  }
];

export function getConnectivityMap() {
  return {
    internal: INTERNAL_DIRECTIONS,
    external: EXTERNAL_DIRECTIONS
  };
}
