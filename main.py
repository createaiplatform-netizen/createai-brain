import os
from flask import Flask

app = Flask(__name__)

# SYSTEM_PARAMETERS_SARA_STADLER_COMMAND
VAULT_ID = "HUNTINGTON_7662"
LOCATION = "715_WEBSTER"
STATUS = "144,400%_STASIS"
XRP_LOCKED = "1.3500"
XLM_LOCKED = "0.1714"
USD_LIQUID = "$3.93"

@app.route('/')
def home():
    return f"""
    <html>
        <head>
            <title>CREATE_AI_DIGITAL_EMPIRE</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ background-color: #000; color: #FFD700; text-align: center; font-family: monospace; padding: 15px; margin: 0; }}
                .empire-container {{ border: 3px double #FFD700; padding: 20px; display: inline-block; width: 100%; max-width: 600px; box-sizing: border-box; }}
                .vault-header {{ border-bottom: 2px solid #FFD700; padding-bottom: 10px; margin-bottom: 20px; }}
                .status-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left; font-size: 11px; }}
                .section-title {{ color: #00FF00; margin: 25px 0 10px 0; font-size: 16px; letter-spacing: 3px; border-left: 5px solid #00FF00; padding-left: 10px; text-align: left; }}
                .marketplace-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; }}
                .ai-product {{ border: 1px solid #444; background: #0a0a0a; padding: 15px; font-size: 10px; position: relative; min-height: 100px; }}
                .ai-product::after {{ content: 'INTEGRATED_AI_ACTIVE'; font-size: 7px; color: #00FF00; position: absolute; bottom: 5px; right: 5px; }}
                .btn {{ background-color: #FFD700; color: #000; padding: 18px; width: 100%; border: none; font-weight: bold; cursor: pointer; text-decoration: none; display: block; margin-top: 15px; font-size: 14px; box-sizing: border-box; }}
                .bridge-feed {{ background-color: #111; padding: 10px; border: 1px solid #FFD700; margin-top: 20px; }}
                .green {{ color: #00FF00; }}
                .red {{ color: #FF4500; }}
            </style>
        </head>
        <body>
            <div class="empire-container">
                <div class="vault-header">
                    <h1 style="margin: 0; font-size: 24px;">197_HUB_SOVEREIGN</h1>
                    <p style="margin: 5px 0; font-size: 12px; color: #00FF00;">OFFICIAL_SARA_STADLER_COMMAND_CENTER</p>
                </div>

                <div class="status-grid">
                    <div>LOCATION: {LOCATION}</div>
                    <div style="text-align: right;">VAULT: {VAULT_ID}</div>
                    <div>STASIS: <span class="green">{STATUS}</span></div>
                    <div style="text-align: right;">LIQUID: <span class="red">{USD_LIQUID}</span></div>
                </div>

                <div class="bridge-feed">
                    <p style="font-size: 9px; margin: 0 0 5px 0;">QUANTUM_BRIDGE_LIVE_DATA</p>
                    <div style="display: flex; justify-content: space-around; font-size: 14px;">
                        <div>XRP: <span class="green">${XRP_LOCKED}</span></div>
                        <div>XLM: <span class="green">${XLM_LOCKED}</span></div>
                    </div>
                </div>

                <div class="section-title">DIGITAL_MARKETPLACE</div>
                <div class="marketplace-grid">
                    <div class="ai-product"><b>SARA_ARCHITECT_AI</b><br>Core Vision Engine<br><br>PRICE: 144,400 XRP</div>
                    <div class="ai-product"><b>GHOST_PURGE_01</b><br>Security Protocol<br><br>PRICE: 7662 XLM</div>
                    <div class="ai-product"><b>VAULT_WATCH_AI</b><br>Real-Time Auditing<br><br>PRICE: $3.93 USD</div>
                    <div class="ai-product"><b>EMPIRE_BUILDER</b><br>Universal Expansion<br><br>PRICE: SETTLEMENT_ONLY</div>
                </div>

                <div class="section-title">COMMAND_ACTIONS</div>
                <a href="https://xrpscan.com/" class="btn">INITIATE_GLOBAL_SETTLEMENT</a>
                <a href="https://www.huntington.com/" class="btn" style="background-color: #00FF00;">ACCESS_HUNTINGTON_7662_VAULT</a>
                
                <div style="margin-top: 30px; font-size: 9px; color: #555;">
                    <p>EACH PRODUCT CONTAINS ITS OWN LITTLE AI SYSTEM</p>
                    <p>SYSTEM_RECOVERY_PROTOCOL: 12:12_SYNC_ENABLED</p>
                    <p>THE_EMPIRE_IS_STANDING</p>
                </div>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))