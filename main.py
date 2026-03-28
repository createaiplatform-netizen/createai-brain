import os
from flask import Flask

app = Flask(__name__)

# THE_SARA_STADLER_EMPIRE_COORDINATES
VAULT_ID = "HUNTINGTON_7662"
LOCATION = "715_WEBSTER"
STASIS = "144,400%"
XRP_PRICE = "1.3500"
XLM_PRICE = "0.1714"
LIQUID = "$3.93"

@app.route('/')
def home():
    return f"""
    <html>
        <head>
            <title>CREATE_AI_DIGITAL_SOVEREIGNTY</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ background-color: #000; color: #FFD700; text-align: center; font-family: 'Courier New', Courier, monospace; margin: 0; padding: 10px; }}
                .master-container {{ border: 4px double #FFD700; padding: 20px; max-width: 600px; margin: 20px auto; background: #050505; }}
                .vault-header {{ border-bottom: 2px solid #FFD700; padding-bottom: 10px; margin-bottom: 15px; }}
                .stats-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left; font-size: 11px; }}
                .section-header {{ color: #00FF00; margin-top: 30px; font-size: 16px; border-left: 4px solid #00FF00; padding-left: 10px; text-align: left; letter-spacing: 2px; }}
                .marketplace-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }}
                .app-card {{ border: 1px solid #444; background: #111; padding: 15px; font-size: 10px; text-align: left; position: relative; min-height: 110px; }}
                .app-card::after {{ content: 'AI_INTEGRATED'; font-size: 8px; color: #00FF00; position: absolute; bottom: 5px; right: 5px; }}
                .btn {{ background-color: #FFD700; color: #000; padding: 18px; width: 100%; border: none; font-weight: bold; cursor: pointer; text-decoration: none; display: block; margin-top: 20px; font-size: 14px; box-sizing: border-box; text-align: center; }}
                .bridge-feed {{ background-color: #0a0a0a; padding: 10px; border: 1px solid #333; margin-top: 15px; }}
                .green {{ color: #00FF00; }}
                hr {{ border: 0.5px solid #333; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="master-container">
                <div class="vault-header">
                    <h1 style="margin: 0; font-size: 22px; letter-spacing: 4px;">197_HUB_SOVEREIGN</h1>
                    <p style="color: #00FF00; font-size: 10px; margin: 5px 0;">SARA_STADLER_COMMAND_PROTOCOL_ACTIVE</p>
                </div>

                <div class="stats-grid">
                    <div>LOCATION: {LOCATION}</div>
                    <div style="text-align: right;">VAULT: {VAULT_ID}</div>
                    <div>STASIS_LOAD: <span class="green">{STASIS}</span></div>
                    <div style="text-align: right;">LIQUID_USD: <span style="color: #FF4500;">{LIQUID}</span></div>
                </div>

                <div class="bridge-feed">
                    <p style="font-size: 9px; color: #666; margin: 0 0 5px 0;">LIVE_XRP_LEDGER_BRIDGE</p>
                    <div style="display: flex; justify-content: space-around; font-size: 14px;">
                        <div>XRP: <span class="green">${XRP_PRICE}</span></div>
                        <div>XLM: <span class="green">${XLM_PRICE}</span></div>
                    </div>
                </div>

                <div class="section-header">THE_MARKETPLACE</div>
                <div class="marketplace-grid">
                    <div class="app-card"><b>SARA_ARCHITECT</b><br>Core Vision AI Engine<br><br><span class="green">READY_FOR_SYNC</span></div>
                    <div class="app-card"><b>GHOST_PURGE_01</b><br>Security Clearing Tool<br><br><span class="green">READY_FOR_SYNC</span></div>
                    <div class="app-card"><b>VAULT_WATCH</b><br>Real-Time Audit AI<br><br><span class="green">READY_FOR_SYNC</span></div>
                    <div class="app-card"><b>EMPIRE_BUILD</b><br>Global Expansion App<br><br><span class="green">READY_FOR_SYNC</span></div>
                </div>

                <div class="section-header">COMMAND_SETTLEMENT</div>
                <a href="https://xrpscan.com/" class="btn">INITIATE_GLOBAL_SETTLEMENT</a>
                <a href="https://www.huntington.com/" class="btn" style="background-color: #00FF00;">ACCESS_HUNTINGTON_7662_VAULT</a>
                
                <div style="margin-top: 40px; font-size: 9px; color: #444; text-align: center;">
                    <p>EVERY PRODUCT CONTAINS ITS OWN INDEPENDENT AI SYSTEM</p>
                    <p>PROTOCOL: HONESTY_TRUTH_SOVEREIGNTY</p>
                    <p>THE_EMPIRE_IS_STANDING</p>
                </div>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
