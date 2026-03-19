import { Router } from "express";

const router = Router();

router.get("/sources", (_req, res) => {
  res.json({
    ok: true,
    sources: {
      health: [
        {
          sourceId:     "SMART_FHIR_SANDBOX",
          displayName:  "SMART-on-FHIR Sandbox",
          description:  "Public SMART Health IT sandbox with real OAuth 2.0 / SMART-on-FHIR login flow. Test data only — no real PHI. Architecture-identical to Epic/MyChart production flow.",
          status:       "available",
          requires:     ["UserAuthorization"],
          authType:     "oauth2_smart",
          note:         "Public sandbox — no credentials required for demo use. Replace client_id + base URL for Epic/MyChart once App Orchard approval is obtained.",
          testDataOnly: true,
        },
        { sourceId: "MYCHART_TEST",        displayName: "MyChart (Simulated)",              description: "Epic MyChart — simulated. Requires App Orchard approval in production." },
        { sourceId: "POINTCLICKCARE_TEST", displayName: "PointClickCare (Simulated)",       description: "Long-term care EHR — simulated. Requires Marketplace approval in production." },
        { sourceId: "ECP_TEST",            displayName: "ECP / Simplexis (Simulated)",      description: "Assisted living system — ingested via PDF/CSV pipeline." },
        { sourceId: "FHIR_GENERIC_TEST",   displayName: "Generic FHIR R4 Server (Simulated)", description: "Any FHIR R4-certified EHR. Provide base URL and credentials to activate." },
      ],
      banking: [
        { sourceId: "BANK_TEST",    displayName: "Personal Bank Account (Simulated)", description: "Generic bank connector — simulated. Uses OAuth 2.0 + open banking APIs in production." },
        { sourceId: "PAYROLL_TEST", displayName: "Payroll Provider (Simulated)",      description: "Pay stubs and direct deposit records — simulated connector." },
      ],
      care: [
        { sourceId: "CARE_FACILITY_TEST", displayName: "Care Facility Record (Simulated)", description: "Assisted living / SNF resident record — ingested via UDC pipeline." },
      ],
      other: [
        { sourceId: "QUICKBOOKS_TEST", displayName: "QuickBooks (Simulated)",  description: "QuickBooks Online accounting — simulated. Requires Intuit OAuth in production." },
        { sourceId: "SALESFORCE_TEST", displayName: "Salesforce (Simulated)",  description: "Salesforce CRM — simulated. Requires Salesforce OAuth in production." },
      ],
    },
    total: 9,
    note: "Simulated sources only. Real connectors activate when partner credentials are provided.",
  });
});

export default router;
