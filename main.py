import os
from flask import Flask

app = Flask(__name__)

# EMPIRE_SOVEREIGN_DATA
VAULT_ID = "HUNTINGTON_7662"
STASIS_LOAD = "144,400%"

@app.route('/')
def home():
    return f"""
    <html>
        <head>
            <title>197_HUB_SOVEREIGN</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <style>
                body {{ background-color: #000; color: #FFD700; font-family: 'Courier New', monospace; text-align: center; margin: 0; padding: 20px; }}
                .master-vault {{ border: 5px double #FFD700; padding: 25px; max-width: 600px; margin: auto; background: #050505; border-radius: 20px; }}
                .status-line {{ color: #00FF00; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 20px; }}
                .market-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }}
                .app-card {{ border: 2px solid #333; background: #111; padding: 15px; border-radius: 10px; text-align: left; font-size: 12px; min-height: 100px; }}
                .app-card:hover {{ border-color: #00FF00; }}
                .launch-btn {{ display: block; background: #FFD700; color: #000; padding: 20px; margin-top: 25px; text-decoration: none; font-weight: bold; font-size: 18px; border-radius: 50px; text-transform: uppercase; }}
                .footer {{ margin-top: 40px; font-size: 10px; color: #444; letter-spacing: 2px; }}
                .green {{ color: #00FF00; }}
            </style>
        </head>
        <body>
            <div class="master-vault">
                <h1 style="font-size: 26px; letter-spacing: 5px;">197_HUB_SOVEREIGN</h1>
                <div class="status-line">STASIS: {STASIS_LOAD} | VAULT: {VAULT_ID}</div>
                
                <p style="text-align: left; font-size: 14px;">LOCATION: 715_WEBSTER</p>
                <div style="background: #111; padding: 10px; border: 1px solid #222; margin-bottom: 20px;">
                    <span class="green">LIVE_LEDGER_FEED:</span> XRP $1.35 | XLM $0.17
                </div>

                <h2 style="text-align: left; border-left: 4px solid #00FF00; padding-left: 10px;">THE_MARKETPLACE</h2>
                
                <div class="market-grid">
                    <div class="app-card"><b>SARA_ARCHITECT</b><br>Vision AI Engine<br><br><span class="green">[PUBLIC_ACCESS]</span></div>
                    <div class="app-card"><b>GHOST_PURGE</b><br>Security Protocol<br><br><span class="green">[PUBLIC_ACCESS]</span></div>
                    <div class="app-card"><b>VAULT_WATCH</b><br>Audit System<br><br><span class="green">[PUBLIC_ACCESS]</span></div>
                    <div class="app-card"><b>EMPIRE_BUILD</b><br>Expansion Tools<br><br><span class="green">[PUBLIC_ACCESS]</span></div>
                </div>

                <a href="https://xrpscan.com/" class="launch-btn">INITIATE_GLOBAL_SETTLEMENT</a>
                
                <div class="footer">
                    EACH PRODUCT CONTAINS ITS OWN LITTLE AI<br>
                    SARA_STADLER_ARCHITECT | THE_EMPIRE_IS_STANDING
                </div>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
