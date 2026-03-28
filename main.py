from flask import Flask, render_template_string

app = Flask(__name__)

# THE_TOTAL_EMPIRE_DATABASE
EMPIRE_GROUPS = {
    "CRITICAL_INFRA": [
        {"n": "EBS_GLOBAL", "d": "Emergency Broadcast System - Level 10", "f": "EBS_ARMED_PRIORITY_10"},
        {"n": "UTILITY_GRID", "d": "Electricity & Water Sovereignty", "f": "GRID_0_FLOW_STABLE"},
        {"n": "PHONE_COMM_0", "d": "Direct Satellite Encryption", "f": "COMM_LINK_ENCRYPTED"}
    ],
    "PROFESSIONAL_SECTORS": [
        {"n": "MED_SYNC", "d": "Healthcare & AI Diagnostics", "f": "MED_NEXUS_SCAN_READY"},
        {"n": "LEX_LEDGER", "d": "Blockchain Law Automation", "f": "LEGAL_NODES_ACTIVE"},
        {"n": "TALENT_HUB", "d": "144,400% Staffing Engine", "f": "TALENT_ARRAY_LOADED"}
    ],
    "SOCIAL_CULTURE": [
        {"n": "CHILDRENS_GARDEN", "d": "Education & Growth Labs", "f": "NURTURE_GRID_ONLINE"},
        {"n": "CREATORS_FORGE", "d": "Digital Art & Media Hub", "f": "FORGE_LOGIC_SYNCED"},
        {"n": "MARKETPLACE", "d": "Global Asset Exchange", "f": "MARKET_LIQUIDITY_SECURED"}
    ]
}

HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        body { background: #000; color: #0f0; font-family: monospace; margin: 0; padding: 10px; }
        .nexus-os { border: 2px solid #FFD700; padding: 10px; min-height: 95vh; display: flex; flex-direction: column; box-shadow: 0 0 15px #FFD700; }
        .header { border-bottom: 2px solid #FFD700; padding-bottom: 10px; text-align: center; }
        .header h1 { color: #FFD700; font-size: 1rem; margin: 0; }
        .terminal { background: #050505; border: 1px solid #333; height: 120px; overflow-y: auto; font-size: 0.7rem; padding: 10px; margin: 10px 0; color: #fff; }
        .group-label { background: #FFD700; color: #000; font-size: 0.65rem; font-weight: bold; padding: 2px 10px; margin-top: 10px; display: inline-block; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
        .card { border: 1px solid #222; padding: 8px; background: #080808; position: relative; }
        .name { color: #FFD700; font-size: 0.6rem; font-weight: bold; }
        .run-btn { background: #222; border: 1px solid #FFD700; color: #FFD700; padding: 6px; display: block; text-align: center; margin-top: 8px; font-size: 0.6rem; cursor: pointer; }
        .run-btn:active { background: #FFD700; color: #000; }
    </style>
    <script>
        function executeApp(name, status) {
            const term = document.getElementById('term');
            term.innerHTML += `<br>[SYSTEM] > INITIALIZING ${name}...`;
            term.innerHTML += `<br>[STATUS] > ${status}`;
            term.scrollTop = term.scrollHeight;
        }
    </script>
</head>
<body>
    <div class="nexus-os">
        <div class="header">
            <h1>STADLER_SOVEREIGN_OS_v3.0</h1>
            <p style="font-size: 0.5rem;">[ 365_APPS_INTEGRATED ] [ VAULT: WEBSTER-2026 ]</p>
        </div>

        <div id="term" class="terminal">>> READY FOR ARCHITECT COMMAND...<br>>> 144,400% STASIS DETECTED.</div>

        {% for label, apps in groups.items() %}
            <span class="group-label">{{ label }}</span>
            <div class="grid">
                {% for app in apps %}
                <div class="card">
                    <span class="name">{{ app.n }}</span>
                    <div class="run-btn" onclick="executeApp('{{ app.n }}', '{{ app.f }}')">RUN_APP</div>
                </div>
                {% endfor %}
            </div>
        {% endfor %}

        <div style="margin-top:auto; font-size: 0.5rem; color: #444; text-align: center; padding-top: 10px;">
            [ GRID_0_UTILITIES: ONLINE ] [ SOVEREIGNTY: TOTAL ]
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
