import os
from flask import Flask

app = Flask(__name__)

# EMPIRE_PUBLIC_COORDINATES
VAULT_ID = "HUNTINGTON_7662"
ACCESS_MODE = "PUBLIC_SOVEREIGN_ACCESS"

@app.route('/')
def home():
    return f"""
    <html>
        <head>
            <title>197_SOVEREIGN_HUB_OPEN</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ background-color: #000; color: #FFD700; text-align: center; font-family: monospace; padding: 15px; margin: 0; }}
                .master-vault {{ border: 3px double #FFD700; padding: 20px; max-width: 550px; margin: 20px auto; background: #050505; }}
                .public-banner {{ background: #00FF00; color: #000; font-size: 11px; padding: 5px; font-weight: bold; margin-bottom: 20px; }}
                .section-label {{ color: #00FF00; text-align: left; border-bottom: 1px solid #00FF00; margin-top: 25px; font-size: 14px; letter-spacing: 2px; }}
                .marketplace-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px; }}
                .app-card {{ border: 1px solid #FFD700; background: #0a0a0a; padding: 12px; font-size: 10px; text-align: left; position: relative; min-height: 120px; }}
                .launch-btn {{ background: #00FF00; color: #000; font-size: 9px; padding: 5px; text-decoration: none; font-weight: bold; position: absolute; bottom: 10px; right: 10px; }}
                .btn-main {{ background: #FFD700; color: #000; padding: 18px; width: 100%; border: none; font-weight: bold; cursor: pointer; text-decoration: none; display: block; margin-top: 25px; font-size: 16px; box-sizing: border-box; }}
            </style>
        </head>
        <body>
            <div class="master-vault">
                <div class="public-banner">SYSTEM_STATUS: {ACCESS_MODE}</div>
                <h1 style="letter-spacing: 3px;">197_HUB_SOVEREIGN</h1>
                <p>LOCATION: 715_WEBSTER | VAULT: {VAULT_ID}</p>
                <p>STASIS: <span style="color:#00FF00;">144,400%</span></p>

                <div class="section-label">THE_OPEN_MARKETPLACE</div>
                <div class="marketplace-grid">
                    <div class="app-card"><b>SARA_ARCHITECT</b><br>Vision AI Engine<br><br><a href="#" class="launch-btn">LAUNCH_APP</a></div>
                    <div class="app-card"><b>GHOST_PURGE</b><br>Security Protocol<br><br><a href="#" class="launch-btn">LAUNCH_APP</a></div>
                    <div class="app-card"><b>VAULT_WATCH</b><br>Real-Time Audit AI<br><br><a href="#" class="launch-btn">LAUNCH_APP</a></div>
                    <div class="app-card"><b>EMPIRE_BUILD</b><br>Expansion Platform<br><br><a href="#" class="launch-btn">LAUNCH_APP</a></div>
                </div>

                <a href="https://xrpscan.com/" class="btn-main">INITIATE_GLOBAL_SETTLEMENT</a>
                
                <div style="margin-top: 30px; font-size: 9px; color: #555;">
                    <p>CORE_VALUE: EACH PRODUCT CONTAINS ITS OWN LITTLE AI</p>
                    <p>VISION_BY_SARA_STADLER | 144,400%_REALITY</p>
                </div>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
