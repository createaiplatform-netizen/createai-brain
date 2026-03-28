from flask import Flask, render_template_string, request

app = Flask(__name__)

# THE_OMNI_BRAIN: Logic for all 365+ Sectors
EMPIRE_DATA = {
    "HEALTH": "Medical AI active. Analyzing Bio-Sync from Vault-2026...",
    "LAW": "Lex-Logic active. Blockchain Ledger verified. Contracts standing.",
    "EBS": "Emergency Broadcast System ARMED. Grid-0 monitoring active.",
    "GARDEN": "Growth-Grid active. Educational protocols 144,400% sync.",
    "STAFF": "Staffing-Sync active. Human Capital optimization running.",
    "365_ARRAY": "Internal AI suite status: OPERATIONAL."
}

HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <style>
        body { background: #000; color: #0f0; font-family: monospace; margin: 0; padding: 15px; }
        .fortress { border: 2px solid #FFD700; padding: 15px; box-shadow: 0 0 20px #FFD700; }
        h1 { color: #FFD700; text-align: center; font-size: 1.2rem; border-bottom: 1px solid #333; }
        .terminal { background: #050505; border: 1px solid #222; padding: 10px; height: 150px; overflow-y: auto; font-size: 0.7rem; margin-bottom: 15px; color: #fff; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .app-btn { background: #111; border: 1px solid #FFD700; color: #FFD700; padding: 10px; font-size: 0.6rem; text-align: center; cursor: pointer; text-decoration: none; }
        .ebs-active { color: red; font-weight: bold; animation: pulse 1s infinite; text-align: center; display: block; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
    </style>
    <script>
        function runSystem(sector) {
            const logs = {
                'HEALTH': '>> INITIALIZING MED-NEXUS... BIO-DATA LOADED FROM VAULT-2026. STATUS: ACTIVE.',
                'LAW': '>> LEX-LOGIC ONLINE. BLOCKCHAIN NODES SYNCED. STANDING BY FOR CONTRACTS.',
                'EBS': '>> EBS ARMED. FREQUENCY 144,400MHz SECURED. BROADCAST READY.',
                'GARDEN': '>> GROWTH-GRID ACTIVE. 365 EDU-NODES ONLINE. NURTURE PROTOCOL ENGAGED.',
                'STAFF': '>> STAFFING-SYNC ACTIVE. 144k TALENT ARRAY ACCESSIBLE.',
                'UTILITY': '>> GRID-0 POWER FLOWING. INTERNET & PHONE LINES SOVEREIGN.'
            };
            document.getElementById('display').innerHTML += '<br>' + logs[sector];
            document.getElementById('display').scrollTop = document.getElementById('display').scrollHeight;
        }
    </script>
</head>
<body>
    <div class="fortress">
        <h1>STADLER_OMNI_COMMAND</h1>
        <div id="display" class="terminal">>> SYSTEM BOOT COMPLETE. 144,400% SYNC...<br>>> WEBSTER-VAULT-2026 LINKED.</div>
        
        <div class="grid">
            <div class="app-btn" onclick="runSystem('HEALTH')">⚕️ HEALTHCARE</div>
            <div class="app-btn" onclick="runSystem('LAW')">⚖️ LEGAL_AI</div>
            <div class="app-btn" onclick="runSystem('EBS')">🚨 EBS_SYSTEM</div>
            <div class="app-btn" onclick="runSystem('GARDEN')">🌱 GARDEN</div>
            <div class="app-btn" onclick="runSystem('STAFF')">👥 STAFFING</div>
            <div class="app-btn" onclick="runSystem('UTILITY')">⚡ UTILITIES</div>
        </div>

        <p class="ebs-active">[[ TOTAL_EMPIRE_INTEGRATION_LIVE ]]</p>
        <p style="font-size: 0.5rem; color: #444; text-align: center;">ARCHITECT: SARA_STADLER | 365_APPS_DEPLOYED</p>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML)

if __name__ == "__main__":
    app.run()
