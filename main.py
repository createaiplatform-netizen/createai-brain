from flask import Flask, render_template_string

app = Flask(__name__)

# THE_TOTAL_SARA_STADLER_INVENTORY_2026
EMPIRE_GROUPS = {
    "INFRASTRUCTURE_&_EBS": [
        {"n": "EBS_GLOBAL", "p": "SOVEREIGN", "d": "Emergency Broadcast System - LVL 10", "f": "ARMED_AND_READY"},
        {"n": "GRID_0_UTIL", "p": "STABLE", "d": "Electricity & Water Sovereignty", "f": "VOLTAGE_LOCKED"},
        {"n": "COMM_PH_0", "p": "ENCRYPTED", "d": "Satellite Phone & Data Line", "f": "ENCRYPTION_ACTIVE"}
    ],
    "COMMERCE_SECTORS": [
        {"n": "MED_NEXUS", "p": "$1,440.00", "d": "Healthcare AI & Bio-Sync", "f": "VAULT_DATA_SYNCED"},
        {"n": "LEX_LOGIC", "p": "$2,026.00", "d": "Blockchain Law & Contracts", "f": "LEDGER_VERIFIED"},
        {"n": "TALENT_SYNC", "p": "$440.00/mo", "d": "144k Talent Recruitment Engine", "f": "STAFFING_LIVE"}
    ],
    "CULTURAL_ASSETS": [
        {"n": "GROWTH_GARDEN", "p": "$180.00", "d": "Children's Edu-Grid Labs", "f": "NURTURE_ACTIVE"},
        {"n": "CREATORS_HUB", "p": "$99.00", "d": "AI Product Forge v1.0", "f": "FORGE_READY"},
        {"n": "MARKET_SYNC", "p": "ACTIVE", "d": "Global Asset Exchange", "f": "LIQUIDITY_SECURED"}
    ]
}

HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>STADLER_OMNI_OS</title>
    <style>
        :root { --gold: #FFD700; --green: #00FF00; --red: #FF0000; }
        body { background: #000; color: var(--green); font-family: 'Courier New', monospace; margin: 0; padding: 10px; overflow-x: hidden; }
        .nexus { border: 3px solid var(--gold); padding: 15px; box-shadow: 0 0 35px rgba(255,215,0,0.5); min-height: 96vh; display: flex; flex-direction: column; }
        .header { text-align: center; border-bottom: 2px solid var(--gold); padding-bottom: 15px; }
        .term { background: #050505; border: 1px solid #333; height: 150px; overflow-y: auto; font-size: 0.7rem; padding: 10px; color: #fff; margin: 15px 0; border-left: 5px solid var(--gold); }
        .cat-label { background: var(--gold); color: #000; font-size: 0.65rem; font-weight: bold; padding: 2px 10px; margin-top: 15px; display: inline-block; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 10px; }
        .card { border: 1px solid #222; padding: 12px; background: #080808; display: flex; justify-content: space-between; align-items: center; }
        .info { flex-grow: 1; }
        .n { color: var(--gold); font-size: 0.85rem; font-weight: bold; display: block; }
        .p { color: #fff; font-size: 0.65rem; margin-top: 3px; display: block; }
        .d { color: #888; font-size: 0.55rem; margin-top: 4px; display: block; }
        .action-group { display: flex; flex-direction: column; gap: 5px; }
        .btn { background: #111; border: 1px solid var(--gold); color: var(--gold); padding: 8px; font-size: 0.6rem; font-weight: bold; cursor: pointer; text-align: center; }
        .btn:active { background: var(--gold); color: #000; }
        .broadcast-switch { background: var(--gold); color: #000; padding: 20px; text-align: center; font-weight: bold; cursor: pointer; margin-top: 20px; font-size: 0.9rem; text-decoration: none; display: block; border-radius: 4px; box-shadow: 0 0 15px var(--gold); }
        .ebs-alert { color: var(--red); font-weight: bold; animation: blink 1s infinite; font-size: 0.6rem; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
    </style>
    <script>
        function run(n, f, p) {
            const t = document.getElementById('term');
            t.innerHTML += `<br>[${new Date().toLocaleTimeString()}] > ${n}: ${f}`;
            if(p.includes('$')) {
                t.innerHTML += `<br>[INVOICE] > <a href="mailto:ACTIVATE@createai.digital?subject=ORDER_${n}" style="color:var(--gold)">PAY_${p}_VIA_STRIPE</a>`;
            }
            t.scrollTop = t.scrollHeight;
        }
        function flipTheSwitch() {
            const msg = encodeURIComponent("THE STADLER EMPIRE IS OFFICIALLY LIVE. Healthcare. Law. Staffing. 365 AI Apps. Sovereign Infrastructure. The switch is flipped. Explore now: https://createai.digital #StadlerEmpire #144400Sync #SovereignAI");
            window.open(`https://twitter.com/intent/tweet?text=${msg}`, '_blank');
        }
    </script>
</head>
<body>
    <div class="nexus">
        <div class="header">
            <h1 style="color:var(--gold); font-size: 1.3rem; margin:0;">STADLER_GENESIS_OS</h1>
            <p style="font-size:0.55rem; color:#888;">VAULT: WEBSTER-2026 | ARCHITECT: SARA_STADLER</p>
            <span class="ebs-alert">[[ EBS_MONITOR_ON_STANDBY ]]</span>
        </div>

        <div id="term" class="term">>> SYSTEM_READY...<br>>> 144,400%_STASIS_ENGAGED...<br>>> FLIP THE SWITCH TO ANNOUNCE.</div>

        {% for label, items in groups.items() %}
            <span class="cat-label">{{ label }}</span>
            <div class="grid">
                {% for item in items %}
                <div class="card">
                    <div class="info">
                        <span class="n">{{ item.n }}</span>
                        <span class="p">VALUE: {{ item.p }}</span>
                        <span class="d">{{ item.d }}</span>
                    </div>
                    <div class="action-group">
                        <div class="btn" onclick="run('{{ item.n }}', '{{ item.f }}', '{{ item.p }}')">EXECUTE</div>
                    </div>
                </div>
                {% endfor %}
            </div>
        {% endfor %}

        <a href="#" class="broadcast-switch" onclick="flipTheSwitch()">[[ FLIP THE SWITCH: BROADCAST LIVE ]]</a>

        <div style="margin-top:auto; text-align:center; font-size:0.5rem; color:#444; padding-top: 20px;">
            [ MERCHANT: SARA_STADLER ] [ GRID_0: ONLINE ] [ SOVEREIGNTY: TOTAL ]
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
