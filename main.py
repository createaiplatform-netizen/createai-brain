from flask import Flask, render_template_string

app = Flask(__name__)

# THE_TOTAL_EMPIRE_FINAL_INDEX
EMPIRE = {
    "INFRASTRUCTURE": [
        {"n": "EBS_GLOBAL", "p": "SOVEREIGN", "d": "Emergency Broadcast System", "f": "ARMED_LEVEL_10"},
        {"n": "GRID_0_POWER", "p": "STABLE", "d": "Sovereign Utility Control", "f": "VOLTAGE_SYNCED"}
    ],
    "COMMERCE_SECTORS": [
        {"n": "MED_NEXUS", "p": "$1,440.00", "d": "Healthcare AI Suite", "f": "BIO_SYNC_ACTIVE"},
        {"n": "LEX_LOGIC", "p": "$2,026.00", "d": "Blockchain Law & Contracts", "f": "LEDGER_LOCKED"},
        {"n": "STAFF_SYNC", "p": "$440.00/mo", "d": "144k Talent Engine", "f": "TALENT_LIVE"}
    ],
    "YOUTH_EDU": [
        {"n": "CHILDRENS_GARDEN", "p": "$180.00", "d": "Growth-Grid Edu-Labs", "f": "NURTURE_ACTIVE"}
    ]
}

HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        :root { --gold: #FFD700; --green: #00FF00; }
        body { background: #000; color: var(--green); font-family: 'Courier New', monospace; margin: 0; padding: 10px; }
        .fortress { border: 3px solid var(--gold); padding: 15px; box-shadow: 0 0 30px rgba(255,215,0,0.5); min-height: 95vh; display: flex; flex-direction: column; }
        .term { background: #050505; border: 1px solid #333; height: 140px; overflow-y: auto; font-size: 0.7rem; padding: 10px; color: #fff; margin-bottom: 15px; border-left: 5px solid var(--gold); }
        .card { border: 1px solid #222; padding: 12px; background: #080808; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
        .btn { background: #111; border: 1px solid var(--gold); color: var(--gold); padding: 10px; font-size: 0.6rem; font-weight: bold; cursor: pointer; text-decoration: none; }
        .broadcast-btn { background: var(--gold); color: #000; padding: 15px; text-align: center; font-weight: bold; cursor: pointer; margin-top: 15px; display: block; text-decoration: none; }
    </style>
    <script>
        function run(n, f, p) {
            const t = document.getElementById('t');
            t.innerHTML += `<br>[${new Date().toLocaleTimeString()}] > ${n}: ${f}`;
            if(p !== 'SOVEREIGN' && p !== 'STABLE') {
                t.innerHTML += `<br>[INVOICE] > <a href="mailto:ACTIVATE@createai.digital?subject=BUY_${n}" style="color:var(--gold)">PAY_${p}_NOW</a>`;
            }
            t.scrollTop = t.scrollHeight;
        }
        function xBroad() {
            const msg = encodeURIComponent("THE STADLER EMPIRE IS DONE. 365 AI Apps. Sovereign Infrastructure. Webster-Vault-2026. See the live OS: https://createai.digital #StadlerEmpire #144400Sync");
            window.open(`https://twitter.com/intent/tweet?text=${msg}`, '_blank');
        }
    </script>
</head>
<body>
    <div class="fortress">
        <h1 style="color:var(--gold); text-align:center; font-size:1.2rem; margin:0;">STADLER_EMPIRE_OS_FINAL</h1>
        <div id="t" class="term">>> SYSTEM_READY...<br>>> ARCHITECT_AUTHENTICATED.<br>>> ENGINE_STABLE.</div>
        
        {% for cat, apps in data.items() %}
            <div style="background:var(--gold); color:#000; font-size:0.6rem; font-weight:bold; padding:2px 8px; margin-top:10px;">{{ cat }}</div>
            {% for a in apps %}
            <div class="card">
                <div><b style="color:var(--gold); font-size:0.75rem;">{{ a.n }}</b><br><span style="color:#888; font-size:0.55rem;">{{ a.d }}</span></div>
                <div class="btn" onclick="run('{{ a.n }}', '{{ a.f }}', '{{ a.p }}')">ACTIVATE</div>
            </div>
            {% endfor %}
        {% endfor %}

        <a href="#" class="broadcast-btn" onclick="xBroad()">FINAL_STEP: BROADCAST_TO_X</a>

        <div style="margin-top:auto; text-align:center; font-size:0.5rem; color:#444;">[ DONE ] [ 144,400% ]</div>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML, data=EMPIRE)

if __name__ == "__main__":
    app.run()
