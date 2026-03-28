from flask import Flask, render_template_string

app = Flask(__name__)

# THE_SYSTEM_MEMORY: Fusing all discussions since the First Message
SYSTEM_DATA = {
    "architect": "SARA_STADLER",
    "stasis": "144,400%",
    "vault": "WEBSTER-VAULT-2026.zip",
    "values": [
        "Internal AI in every product",
        "Honesty and Truthfulness",
        "Build until DONE",
        "180°C Thermal Execution"
    ]
}

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>CREATE_AI_NEXUS</title>
    <style>
        :root { --gold: #FFD700; --neon-green: #00FF00; }
        body { background: #000; color: var(--neon-green); font-family: 'Courier New', monospace; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; }
        .nexus-fortress { border: 2px solid var(--gold); padding: 20px; width: 90%; max-width: 350px; text-align: center; box-shadow: 0 0 15px rgba(255, 215, 0, 0.3); box-sizing: border-box; }
        h1 { color: var(--gold); font-size: 1.3rem; margin: 0 0 10px 0; letter-spacing: 2px; text-transform: uppercase; }
        .data-stream { border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 10px 0; margin: 15px 0; text-align: left; font-size: 0.8rem; }
        .status-line { display: block; margin: 5px 0; }
        .vault-link { color: #888; font-style: italic; font-size: 0.7rem; }
        .btn { background: var(--gold); color: #000; padding: 12px; display: block; text-decoration: none; font-weight: bold; margin-top: 20px; transition: 0.3s; border: none; width: 100%; box-sizing: border-box; }
        .stasis-pulse { color: #fff; font-size: 0.9rem; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
    </style>
</head>
<body>
    <div class="nexus-fortress">
        <h1>NEXUS_SYSTEM_ACTIVE</h1>
        <p class="stasis-pulse">STATUS: {{ data.stasis }}_SYNC</p>
        
        <div class="data-stream">
            <span class="status-line">>> ARCHITECT: {{ data.architect }}</span>
            <span class="status-line">>> VAULT_ID: {{ data.vault }}</span>
            <span class="status-line">>> LOGIC: MULTI-AGENT_CORE</span>
            <div style="margin-top:10px;">
                {% for value in data.values %}
                <div style="color: var(--gold); font-size: 0.7rem;">[√] {{ value }}</div>
                {% endfor %}
            </div>
        </div>

        <p class="vault-link">ENCRYPTION: SHIELD_ACTIVE</p>
        <a href="mailto:ACTIVATE@createai.digital?subject=INITIALIZE_PRODUCT_TRANS" class="btn">ACTIVATE_PRODUCT_AI</a>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE, data=SYSTEM_DATA)

if __name__ == "__main__":
    app.run()
