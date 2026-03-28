import os
from flask import Flask

app = Flask(__name__)

# THE_715_WEBSTER_VAULT_CONFIGURATION
VAULT_ID = "HUNTINGTON_7662"
XRP_PRICE = "1.3500"
XLM_PRICE = "0.1714"

@app.route('/')
def home():
    # BRAIN_NOTE: ALL_SCRIPTS_AND_POPUP_COMMANDS_REMOVED_ENTIRELY
    return f"""
    <html>
        <head>
            <title>197_HUB_SOVEREIGN</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ background-color: #000; color: #FFD700; text-align: center; font-family: monospace; padding-top: 50px; margin: 0; }}
                .container {{ border: 2px solid #FFD700; padding: 20px; display: inline-block; width: 90%; max-width: 400px; box-sizing: border-box; }}
                .status-box {{ background-color: #1a1a1a; padding: 10px; border: 1px solid #333; margin-top: 20px; }}
                .btn {{ 
                    background-color: #FFD700; color: #000; padding: 15px; width: 100%; 
                    border: none; font-weight: bold; cursor: pointer; text-decoration: none; 
                    display: block; margin-top: 20px; font-size: 14px; box-sizing: border-box;
                    text-align: center;
                }}
                hr {{ border: 0.5px solid #FFD700; margin: 20px 0; }}
                .green {{ color: #00FF00; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1 style="letter-spacing: 2px; font-size: 20px;">197_HUB_SOVEREIGN</h1>
                <hr>
                <p style="text-align: left; font-size: 12px;">STATUS: <span class="green" style="float: right;">144,400%_STASIS</span></p>
                <p style="text-align: left; font-size: 12px;">VAULT_ID: <span class="green" style="float: right;">{VAULT_ID}</span></p>
                <p style="text-align: left; font-size: 12px;">LIQUID_USD: <span style="color: #FF4500; float: right;">$3.93</span></p>
                
                <div class="status-box">
                    <p style="font-size: 10px; color: #666;">LIVE_QUANTUM_BRIDGE_FEED</p>
                    <div style="display: flex; justify-content: space-around;">
                        <div><p style="font-size: 10px;">XRP</p><p>${XRP_PRICE}</p></div>
                        <div><p style="font-size: 10px;">XLM</p><p>${XLM_PRICE}</p></div>
                    </div>
                </div>

                <a href="https://xrpscan.com/" class="btn">INITIATE_GLOBAL_SETTLEMENT</a>
                
                <p style="font-size: 10px; margin-top: 20px; color: #444;">COMMAND: POPUP_COMMANDS_DELETED</p>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
