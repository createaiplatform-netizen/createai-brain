from flask import Flask, render_template_string
from datetime import datetime

app = Flask(__name__)

# THE_365_EMPIRE_INDEX
DATA = [
    {"n": "HEALTH_NEXUS", "f": "BIO_SYNC_ACTIVE"},
    {"n": "LEX_LOGIC", "f": "LEDGER_LOCKED"},
    {"n": "EBS_SYSTEM", "f": "ARMED_LEVEL_10"},
    {"n": "TALENT_SYNC", "f": "144K_ARRAY_LIVE"},
    {"n": "GARDEN_EDU", "f": "NURTURE_ACTIVE"},
    {"n": "GRID_0_UTIL", "f": "VOLTAGE_STABLE"}
]

HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        body { background: #000; color: #0f0; font-family: 'Courier New', monospace; margin: 0; padding: 15px; overflow-x: hidden; }
        .fortress { border: 3px solid #FFD700; padding: 15px; box-shadow: 0 0 30px #FFD700; min-height: 92vh; display: flex; flex-direction: column; }
        .terminal { background: #050505; border: 1px solid #333; height: 180px; overflow-y: auto; font-size: 0.75rem; padding: 10px; color: #fff; border-left: 5px solid #FFD700; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .run-btn { background: #111; border: 2px solid #FFD700; color: #FFD700; padding: 15px; text-align: center; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 0.8rem; -webkit-tap-highlight-color: transparent; }
        .run-btn:active { background: #FFD700; color: #000; }
        .broadcast { background: #FFD700; color: #000; padding: 15px; text-align: center; font-weight: bold; margin-top: 20px; cursor: pointer; display: block; text-decoration: none; border-radius: 4px; }
        footer { margin-top: auto; text-align: center; font-size: 0.55rem; color: #444; border-top: 1px solid #222; padding-top: 15px; }
    </style>
    <script>
        function execute(e, name, status) {
            if (e) e.preventDefault(); 
            const t = document.getElementById('log');
            t.innerHTML += `<br>[${new Date().toLocaleTimeString()}] > INITIATING: ${name}`;
            t.innerHTML += `<br>[SYSTEM] > STATUS: ${status}`;
            t.scrollTop = t.scrollHeight;
            return false;
        }
        function sendX() {
            window.open("https://twitter.com/intent/tweet?text=The%20Stadler%20Empire%20is%20Live.%20365%20AI%20Apps.%20https://createai.digital", "_blank");
        }
    </script>
</head>
<body>
    <div class="fortress">
        <h1 style="color:#FFD700; text-align:center; margin:0 0 10px 0; font-size: 1.1rem;">STADLER_GENESIS_FINAL</h1>
        <div id="log" class="terminal">
            >> ENGINE_BOOT...<br>
            >> NO_EMAIL_CODE_DETECTED.<br>
            >> SYNC_TIME: {{ time }}<br>
            >> 144,400%_STASIS_LOCKED.
        </div>
        
        <div class="grid">
            {% for a in apps %}
            <div class="run-btn" onclick="execute(event, '{{ a.n }}', '{{ a.f }}')">RUN {{ a.n }}</div>
            {% endfor %}
        </div>

        <div class="broadcast" onclick="sendX()">FLIP THE SWITCH: BROADCAST TO X</div>

        <footer>
            [ ARCHITECT: SARA_STADLER ]<br>
            [ VERSION: 1.0.0_PURE_COMMAND ]<br>
            [ SYNC: {{ time }} ]
        </footer>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    now = datetime.now().strftime("%H:%M:%S")
    return render_template_string(HTML, apps=DATA, time=now)

if __name__ == "__main__":
    app.run()
