/**
 * dns-instructions.ts
 *
 * Prints the exact DNS values needed to connect createai.digital
 * to the live Replit deployment via Namecheap.
 *
 * HOW TO FIND YOUR DEPLOYMENT URL:
 *   1. Open this Replit project
 *   2. Click the "Deploy" tab in the top bar
 *   3. Copy the URL shown under "Deployment URL" — it looks like:
 *      createai-brain.sivh.replit.app  (or similar)
 *   4. Set REPLIT_DEPLOYMENT_URL below to that value (no https://, no trailing slash)
 *
 * Then run:  npx ts-node dns-instructions.ts
 */

export const REPLIT_DEPLOYMENT_URL = "createai-brain.sivh.replit.app";

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DNS SETUP — Namecheap → Advanced DNS → Host Records
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add TWO records:

  1. Root domain (createai.digital)
     Type:   ALIAS  (or ANAME if Namecheap shows that)
     Host:   @
     Target: ${REPLIT_DEPLOYMENT_URL}
     TTL:    30 min

  2. www subdomain (www.createai.digital)
     Type:   CNAME
     Host:   www
     Target: ${REPLIT_DEPLOYMENT_URL}
     TTL:    30 min

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ALSO REQUIRED — add the domain in Replit:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Deploy tab → Custom Domains → Add domain
  Enter: createai.digital
  Enter: www.createai.digital

  Replit will verify the CNAME/ALIAS and issue a TLS certificate
  automatically. DNS propagation typically takes 5–60 minutes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VERIFY once live:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  curl -I https://createai.digital
  curl -I https://www.createai.digital

  Both should return HTTP 200 with:
  x-powered-by: Express

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
