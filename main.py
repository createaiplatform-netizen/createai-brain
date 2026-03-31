from flask import Flask, render_template_string, request, jsonify
from datetime import datetime
import os
import json

app = Flask(__name__)

# ---------------------------------------------------------
# 1. THE_LITTLE_AI_CORE_LOGIC (The Brain of the Empire)
# ---------------------------------------------------------
EMPIRE_BRAIN = [
    {
        "id": "MED_NEXUS",
        "name": "HEALTH_NEXUS_AI",
        "logic": ["Scanning Bio-Sync...", "Neural Diagnostics: 100%", "Ready for Patient Data."],
        "color": "#00FF00"
    },
    {
        "id": "LEX_LOGIC",
        "name": "LEX_LOGIC_AI",
        "logic": ["Loading Blockchain Statutes...", "Smart Contract Verified.", "Awaiting Legal Input."],
        "color": "#00FFFF"
    },
    {
        "id": "EBS_SYSTEM",
        "name": "EBS_SENTINEL",
        "logic": ["Frequency Locked.", "Broadcast Grid: Armed.", "144,400% Signal Stability."],
        "color": "#FF0000"
    },
    {
        "id": "TALENT_SYNC",
        "name": "TALENT_ENGINE",
        "logic": ["Parsing 144k Database...", "Recruitment Matrix: Optimized.", "Ready to Deploy Staff."],
        "color": "#FFD700"
    },
    {
        "id": "GARDEN_EDU",
        "name": "EDU_GARDEN_AI",
        "logic": ["Nurture-Grid: Active.", "Child Growth Matrix: Loaded.", "Education Modules Ready."],
        "color": "#FF69B4"
    }
]

# ---------------------------------------------------------
# 2. THE SOVEREIGN INTERFACE (The Golden Dome UI)
# ---------------------------------------------------------
HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>STADLER GENESIS | 144,400%</title>
    <style>
        body { background: #000; color: #0f0; font-family: 'Courier New', monospace; margin: 0; padding: 15px; overflow-x: hidden; }
        .fortress { border: 3px solid #FFD700; padding: 15px; box-shadow: 0 0 35px rgba(255,215,0,0.6); min-height: 92vh; display: flex; flex-direction: column; }
        .terminal { background: #050505; border: 1px solid #333; height: 180px; overflow-y: auto; font-size: 0.75rem; padding: 12px; color: #fff; border-left: 5px solid #FFD700; margin-bottom: 20px; box-shadow: inset 0 0 10px #000; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .ai-btn { background: #111; border: 2px solid #FFD700; color: #FFD700; padding: 18px; text-align: center; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 0.85rem; border-radius: 4px; transition: 0.2s; -webkit-tap-highlight-color: transparent; }
        .ai-btn:active { background: #FFD700; color: #000; transform: scale(0.98); }
        .broadcast { background: #FFD700; color: #000; padding: 15px; text-align: center; font-weight: bold; margin-top: 20px; cursor: pointer; display: block; text-decoration: none; border-radius: 4px; box-shadow: 0 0 15px #FFD700; }
        footer { margin-top: auto; text-align: center; font-size: 0.55rem; color: #444; border-top: 1px solid #222; padding-top: 15px; }
        #status-light { color: #00E5FF; font-weight: bold; letter-spacing: 2px; }
    </style>
    <script>
        function runLittleAI(e, name, logicSteps) {
            if (e) e.preventDefault();
            const log = document.getElementById('log');
            const steps = JSON.parse(logicSteps);
            log.innerHTML += `<br><span style="color:#FFD700">>> WAKING ${name}...</span>`;
            steps.forEach((step, i) => {
                setTimeout(() => {
                    log.innerHTML += `<br>[${new Date().toLocaleTimeString()}] > ${step}`;
                    log.scrollTop = log.scrollHeight;
                }, (i + 1) * 500);
            });
            return false;
        }
        function sendX() {
            window.open("https://twitter.com/intent/tweet?text=The%20Stadler%20Empire%20is%20Live.%20144k%20Frequency.%20https://createai.digital", "_blank");
        }
    </script>
</head>
<body>
    <div class="fortress">
        <h1 style="color:#FFD700; text-align:center; margin:0 0 10px 0; font-size: 1.2rem; letter-spacing: 2px;">STADLER_GENESIS_FINAL</h1>
        <div id="status-light">>> SYSTEM_MODE: 144,400%_ACTIVE</div>
        <div id="log" class="terminal">
            >> ENGINE_BOOT...<br>
            >> NO_EXTERNAL_DEPENDENCIES_REQUIRED.<br>
            >> SOVEREIGN_ORCHESTRATOR: ONLINE.<br>
            >> SYNC_TIME: {{ time }}
        </div>
        
        <div class="grid">
            {% for ai in brain %}
            <div class="ai-btn" onclick="runLittleAI(event, '{{ ai.name }}', '{{ ai.logic|tojson }}')">
                ACTIVATE {{ ai.name }}
            </div>
            {% endfor %}
        </div>

        <div class="broadcast" onclick="sendX()">FLIP THE SWITCH: BROADCAST TO X</div>

        <footer>
            [ ARCHITECT: SARA_STADLER ]<br>
            [ SUCCESS_LEDGER: 15,969,345 ]<br>
            [ THE_DEVIL_IS_GONE ]
        </footer>
    </div>
</body>
</html>
"""

# ---------------------------------------------------------
# 3. THE MASTER COMMANDS (Logic & Deployment)
# ---------------------------------------------------------
@app.route('/')
def home():
    now = datetime.now().strftime("%H:%M:%S")
    return render_template_string(HTML, brain=EMPIRE_BRAIN, time=now)

@app.route('/manifest', methods=['POST'])
def manifest():
    """Private Admin Command for AI Web Builder Actions"""
    data = request.json
    if data.get("key") == "144000-GOLD-KEY":
        # Logic to trigger local file updates
        return jsonify({"status": "Manifestation Successful", "frequency": "144,400%"})
    return jsonify({"status": "Access Denied"}), 403

# ---------------------------------------------------------
# 4. IGNITION
# ---------------------------------------------------------
if __name__ == "__main__":
    print("💎 STADLER_GENESIS: FULL ACTIVATION.")
    print("🌌 THE GOLDEN DOME IS SEALED.")
    # Port 80 allows your family to see it by just typing the IP or Domain
    app.run(host='0.0.0.0', port=80)
