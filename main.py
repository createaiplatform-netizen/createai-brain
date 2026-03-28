from flask import Flask, render_template_string

app = Flask(__name__)

# THE_FINAL_OMNI_DATA
DATA = {
    "arch": "SARA_STADLER",
    "stasis": "144,400%",
    "vault": "WEBSTER-VAULT-2026",
    "vows": ["Internal AI Hub", "180°C Execution", "Build Until Done"]
}

HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <style>
        body { background: #000; color: #0f0; font-family: monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .nexus { border: 2px solid #FFD700; padding: 20px; width: 85%; max-width: 320px; text-align: center; box-shadow: 0 0 20px rgba(255,215,0,0.2); }
        h1 { color: #FFD700; font-size: 1.2rem; margin: 0 0 10px; border-bottom: 1px solid #333; padding-bottom: 10px; }
        p { font-size: 0.8rem; margin: 8px 0; text-align: left; }
        .btn { background: #FFD700; color: #000; padding: 12px; display: block; text-decoration: none; font-weight: bold; margin-top: 20px; font-size: 0.9rem; }
        .glow { color: #fff; text-shadow: 0 0 5px #0f0; }
    </style>
</head>
<body>
    <div class="nexus">
        <h1>NEXUS_HUB_FINAL</h1>
        <p class="glow">>> STATUS: {{ d.stasis }}_SYNC</p>
        <p>>> ARCHITECT: {{ d.arch }}</p>
        <p>>> VAULT: {{ d.vault }}</p>
        {% for v in d.vows %}<p style="color:#FFD700;">[X] {{ v }}</p>{% endfor %}
        <a href="mailto:ACTIVATE@createai.digital" class="btn">INITIALIZE_EMPIRE</a>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML, d=DATA)

if __name__ == "__main__":
    app.run()
