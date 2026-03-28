from flask import Flask, render_template_string

app = Flask(__name__)

# THE_365_MASTER_ARRAY (Categorized for Total Empire Control)
EMPIRE_GROUPS = {
    "CRITICAL_INFRA": [
        {"n": "EBS_GLOBAL", "d": "Emergency Broadcast System - Level 10"},
        {"n": "UTILITY_GRID", "d": "Electricity & Water Sovereignty"},
        {"n": "PHONE_COMM_0", "d": "Direct Satellite Phone Encryption"}
    ],
    "PROFESSIONAL_SECTORS": [
        {"n": "MED_SYNC", "d": "Healthcare & Bio-Diagnostics"},
        {"n": "LEX_LEDGER", "d": "Blockchain Legal Automation"},
        {"n": "TALENT_HUB", "d": "Staffing & Human Capital"}
    ],
    "SOCIAL_CULTURE": [
        {"n": "CHILDRENS_GARDEN", "d": "Education & Nurture-Grid"},
        {"n": "CREATORS_FORGE", "d": "Digital Art & Media Hub"},
        {"n": "MARKETPLACE", "d": "Global Asset Exchange"}
    ],
    "THE_365_CORE": [
        {"n": "APP_STASIS_ARRAY", "d": "The 365 Internal AI Product Suite"}
    ]
}

HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>STADLER_SOVEREIGN_OS</title>
    <style>
        :root { --gold: #FFD700; --green: #00FF00; }
        body { background: #000; color: var(--green); font-family: monospace; margin: 0; padding: 10px; }
        .os-container { border: 2px solid var(--gold); padding: 10px; min-height: 95vh; display: flex; flex-direction: column; }
        .header { border-bottom: 2px solid var(--gold); padding-bottom: 10px; text-align: center; }
        .header h1 { color: var(--gold); font-size: 1.1rem; margin: 0; }
        .group-label { background: var(--gold); color: #000; font-size: 0.7rem; font-weight: bold; padding: 3px 10px; display: inline-block; margin-top: 15px; }
        .app-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
        .app-card { border: 1px solid #333; padding: 8px; background: #080808; font-size: 0.6rem; position: relative; }
        .app-card:active { border-color: var(--gold); }
        .app-name { color: var(--gold); font-weight: bold; display: block; }
        .app-desc { color: #888; font-size: 0.5rem; }
        .ebs-alert { color: #f00; font-weight: bold; animation: blink 1s infinite; font-size: 0.6rem; margin-top: 10px; display: block; text-align: center; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
        .btn { background: #111; border: 1px solid var(--gold); color: var(--gold); text-decoration: none; padding: 5px; display: block; text-align: center; margin-top: 5px; font-size: 0.6rem; }
        .footer { margin-top: auto; padding-top: 20px; font-size: 0.5rem; color: #444; text-align: center; }
    </style>
</head>
<body>
    <div class="os-container">
        <div class="header">
            <h1>STADLER_SOVEREIGN_OS</h1>
            <p style="font-size: 0.6rem; margin: 2px 0;">365_APPS_DETECTION: [ACTIVE]</p>
        </div>

        <span class="ebs-alert">[[ EBS_EMERGENCY_BROADCAST_LINK_OPERATIONAL ]]</span>

        {% for label, apps in groups.items() %}
            <span class="group-label">{{ label }}</span>
            <div class="app-grid">
                {% for app in apps %}
                <div class="app-card">
                    <span class="app-name">{{ app.n }}</span>
                    <span class="app-desc">{{ app.d }}</span>
                    <a href="mailto:ACTIVATE@createai.digital?subject=INIT_{{ app.n }}" class="btn">RUN_APP</a>
                </div>
                {% endfor %}
            </div>
        {% endfor %}

        <div class="footer">
            VAULT: WEBSTER-2026_INTEGRATED | 144,400% ARCHITECTURE<br>
            [ GRID_0_UTILITIES: ONLINE ]
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML, groups=EMPIRE_GROUPS)

if __name__ == "__main__":
    app.run()