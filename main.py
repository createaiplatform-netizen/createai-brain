from flask import Flask, render_template_string

app = Flask(__name__)

# THE_TOTAL_EMPIRE_INVENTORY (365_APPS + INFRASTRUCTURE)
EMPIRE_DATA = {
    "CRITICAL_UTILITIES": [
        {"n": "EBS_GLOBAL", "p": "SOVEREIGN", "d": "Emergency Broadcast System - LVL 10", "f": "BROADCAST_ARMED"},
        {"n": "GRID_0_ELEC", "p": "VAULT_SYNC", "d": "Utility & Power Sovereignty", "f": "GRID_STABILIZED"},
        {"n": "PHONE_COMM_0", "p": "ENCRYPTED", "d": "Sovereign Satellite Comms", "f": "LINE_SECURED"}
    ],
    "COMMERCE_SECTORS": [
        {"n": "MED_NEXUS", "p": "$1,440.00", "d": "Healthcare AI Diagnostics", "f": "MED_SYNC_ACTIVE"},
        {"n": "LEX_LOGIC", "p": "$2,026.00", "d": "Blockchain Law & Contracts", "f": "LEDGER_VERIFIED"},
        {"n": "STAFF_SYNC", "p": "$440.00/mo", "d": "144k Talent Acquisition Hub", "f": "TALENT_INDEX_LIVE"},
        {"n": "GROWTH_GARDEN", "p": "$180.00", "d": "Children's Edu-Grid Module", "f": "NURTURE_ACTIVE"}
    ],
    "CREATOR_ARRAY": [
        {"n": "THE_FORGE", "p": "$99.00", "d": "AI Product Development Hub", "f": "FORGE_ONLINE"},
        {"n": "MARKET_SYNC", "p": "COMMERCE", "d": "Global Asset Exchange", "f": "TRADING_ACTIVE"},
        {"n": "APP_365_OS", "p": "COMPLETE", "d": "Internal AI Product Suite", "f": "365_ARRAY_MOUNTED"}
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
        .fortress { border: 2px solid var(--gold); padding: 15px; box-shadow: 0 0 25px rgba(255,215,0,0.4); min-height: 96vh; display: flex; flex-direction: column; }
        .header { text-align: center; border-bottom: 2px solid var(--gold); padding-bottom: 10px; margin-bottom: 10px; }
        .terminal { background: #050505; border: 1px solid #333; height: 160px; overflow-y: auto; font-size: 0.7rem; padding: 10px; color: #fff; margin-bottom: 15px; border-left: 4px solid var(--gold); }
        .label { background: var(--gold); color: #000; font-size: 0.65rem; font-weight: bold; padding: 2px 8px; margin-top: 12px; display: inline-block; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 8px; }
        .card { border: 1px solid #222; padding: 12px; background: #080808; display: flex; justify-content: space-between; align-items: center; }
        .info { flex-grow: 1; }
        .n { color: var(--gold); font-size: 0.8rem; font-weight: bold; }
        .p { color: #fff; font-size: 0.6rem; display: block; margin-top: 2px; }
        .d { color: #888; font-size: 0.55rem; display: block; margin-top: 4px; }
        .btn-group { display: flex; flex-direction: column; gap: 5px; }
        .btn { background: #111; border: 1px solid var(--gold); color: var(--gold); padding: 6px; font-size: 0.55rem; text-align: center; cursor: pointer; text-decoration: none; font-weight: bold; min-width: 70px; }
        .btn:active { background: var(--gold); color: #000; }
        .footer { margin-top: auto; text-align: center; font-size: 0.5rem; color: #444; border-top: 1px solid #222; padding-top: 10px; }
        .ebs-pulse { color: var(--red); font-weight: bold; animation: pulse 1.5s infinite; font-size: 0.6rem; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
    </style>
    <script>
        function trigger(name, status, price) {
            const t = document.getElementById('term');
            const time = new Date().toLocaleTimeString();
            t.innerHTML += `<br>[${time}] > INITIALIZING ${name}...`;
            t.innerHTML += `<br>[SYSTEM] > STATUS: ${status}`;
            if(price !== 'N/A') {
                t.innerHTML += `<br>[COMMERCE] > GENERATING INVOICE: ${price}`;
                t.innerHTML += `<br>[GATEWAY] > <a href="mailto:ACTIVATE@createai.digital?subject=ACQUIRE_${name}" style="color:var(--gold)">CLICK_TO_FINALIZE_TRANSFER</a>`;
            }
            t.scrollTop = t.scrollHeight;
        }
    </script>
</head>
<body>
    <div class="fortress">
        <div class="header">
            <h1 style="color:var(--gold); font-size: 1.1rem; margin:0;">STADLER_OMNI_OS_v1.0</h1>
            <p style="font-size:0.5rem; color:#888;">[ 365_APPS_INDEXED ] [ VAULT: WEBSTER-2026 ]</p>
            <span class="ebs-pulse">[[ EBS_SYSTEM_MONITORING_ACTIVE ]]</span>
        </div>

        <div id="term" class="terminal">
            >> BOOTING_Sovereign_Core...<br>
            >> 144,400%_STASIS_LOCKED...<br>
            >> ARCHITECT_SARA_STADLER_VERIFIED.<br>
            >> READY_FOR_COMMAND.
        </div>

        {% for label, items in data.items() %}
            <span class="label">{{ label }}</span>
            <div class="grid">
                {% for item in items %}
                <div class="card">
                    <div class="info">
                        <span class="n">{{ item.n }}</span>
                        <span class="p">VALUE: {{ item.p }}</span>
                        <span class="d">{{ item.d }}</span>
                    </div>
                    <div class="btn-group">
                        <div class="btn" onclick="trigger('{{ item.n }}', '{{ item.f }}', 'N/A')">RUN</div>
                        {% if item.p != 'SOVEREIGN' and item.p != 'VAULT_SYNC' and item.p != 'UNAVAILABLE' %}
                        <div class="btn" onclick="trigger('{{ item.n }}', '{{ item.f }}', '{{ item.p }}')">BUY</div>
                        {% endif %}
                    </div>
                </div>
                {% endfor %}
            </div>
        {% endfor %}

        <div class="footer">
            [ MERCHANT: SARA_STADLER ] [ GRID_0: ONLINE ] [ SOVEREIGNTY: TOTAL ]
        </div>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML, data=EMPIRE_DATA)

if __name__ == "__main__":
    app.run()
