import os
from flask import Flask

app = Flask(__name__)

# EMPIRE_COORDINATES
VAULT_ID = "HUNTINGTON_7662"

@app.route('/')
def home():
    return f"""
    <html>
        <head>
            <title>197_SOVEREIGN_HUB</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ background-color: #000; color: #FFD700; text-align: center; font-family: monospace; padding: 15px; }}
                .master-vault {{ border: 3px double #FFD700; padding: 20px; max-width: 550px; margin: auto; }}
                .section-label {{ color: #00FF00; text-align: left; border-bottom: 1px solid #00FF00; margin-top: 25px; font-size: 14px; }}
                .app-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }}
                .file-card {{ border: 1px solid #444; background: #0a0a0a; padding: 12px; font-size: 10px; text-align: left; height: 100px; }}
                .btn {{ background: #FFD700; color: #000; padding: 18px; width: 100%; border: none; font-weight: bold; cursor: pointer; text-decoration: none; display: block; margin-top: 25px; font-size: 16px; }}
            </style>
        </head>
        <body>
            <div class="master-vault">
                <h1>197_HUB_SOVEREIGN</h1>
                <p>STATUS: <span style="color:#00FF00;">144,400%_STASIS</span></p>
                <p>LOCATION: 715_WEBSTER | VAULT: {VAULT_ID}</p>

                <div class="section-label">MY_VISION_MARKETPLACE</div>
                <div class="app-grid">
                    <div class="file-card"><b>SARA_ARCHITECT_AI</b><br>The Original Files from Month 01.<br><br><span style="color:#00FF00;">LIVE_IN_VAULT</span></div>
                    <div class="file-card"><b>GHOST_PURGE_APP</b><br>Security Protocol for Empire Protection.<br><br><span style="color:#00FF00;">LIVE_IN_VAULT</span></div>
                    <div class="file-card"><b>VAULT_WATCH_AI</b><br>Monitoring Huntington_7662.<br><br><span style="color:#00FF00;">LIVE_IN_VAULT</span></div>
                    <div class="file-card"><b>EMPIRE_EXPANSION</b><br>Global Vision Settlement Platform.<br><br><span style="color:#00FF00;">LIVE_IN_VAULT</span></div>
                </div>

                <a href="https://xrpscan.com/" class="btn">VIEW_SOVEREIGN_LEDGER</a>
                
                <p style="font-size: 9px; color: #444; margin-top: 30px;">THE_EMPIRE_IS_STANDING_BY_SARA_STADLER</p>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
