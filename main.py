import os
from flask import Flask

app = Flask(__name__)

# THE_715_WEBSTER_VAULT_CONFIGURATION
VAULT_ID = "HUNTINGTON_7662"
XRP_PRICE = "1.3500"
XLM_PRICE = "0.1714"

@app.route('/')
def home():
    return f"""
    <html>
        <head>
            <title>CREATE_AI_DIGITAL_EMPIRE</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ background-color: #000; color: #FFD700; text-align: center; font-family: monospace; padding: 20px; margin: 0; }}
                .container {{ border: 2px solid #FFD700; padding: 20px; display: inline-block; width: 95%; max-width: 500px; box-sizing: border-box; }}
                .status-box {{ background-color: #1a1a1a; padding: 10px; border: 1px solid #333; margin-top: 20px; }}
                .section-header {{ color: #00FF00; margin-top: 30px; font-size: 18px; border-bottom: 1px solid #00FF00; padding-bottom: 5px; }}
                .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }}
                .card {{ border: 1px solid #FFD700; padding: 10px; background: #0a0a0a; font-size: 12px; }}
                .btn {{ 
                    background-color: #FFD700; color: #000; padding: 15px; width: 100%; 
                    border: none; font-weight: bold; cursor: pointer; text-decoration: none; 
                    display: block; margin-top: 20px; font-size: 14px; box-sizing: border-box;
                }}
                hr {{ border: 0.5px solid #FFD700; margin: 20px 0; }}
                .green {{ color: #00FF00; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1 style="letter-spacing: 2px;">197_HUB_SOVEREIGN</h1>
                <p style="font-size: 10px;">GLOBAL_ACCESS_POINT</p>
                <hr>
                
                <p style="text-align: left;">STATUS: <span class="green" style="float: right;">144,400%_STASIS</span></p>
                <p style="text-align: left;">VAULT_ID: <span class="green" style="float: right;">{VAULT_ID}</span></p>
                <p style="text-align: left;">LIQUID_USD: <span style="color: #FF4500; float: right;">$3.93</span></p>

                <div class="status-box">
                    <p style="font-size: 10px; color: #666;">LIVE_QUANTUM_BRIDGE_FEED</p>
                    <div style="display: flex; justify-content: space-around;">
                        <div><p style="font-size: 10px;">XRP</p><p>${XRP_PRICE}</p></div>
                        <div><p style="font-size: 10px;">XLM</p><p>${XLM_PRICE}</p></div>
                    </div>
                </div>

                <div class="section-header">DIGITAL_MARKETPLACE</div>
                <div class="grid">
                    <div class="card">APP_01<br>SARA_AI_ASSISTANT<br><span class="green">READY</span></div>
                    <div class="card">APP_02<br>QUANTUM_LEDGER<br><span class="green">READY</span></div>
                    <div class="card">APP_03<br>CREATIVE_ENGINE<br><span class="green">READY</span></div>
                    <div class="card">APP_04<br>VAULT_SECURITY<br><span class="green">READY</span></div>
                </div>

                <div class="section-header">EMPIRE_COMMANDS</div>
                <a href="https://xrpscan.com/" class="btn">INITIATE_GLOBAL_SETTLEMENT</a>
                <a href="#" class="btn" style="background-color: #00FF00;">LAUNCH_AI_MARKETPLACE</a>
                
                <p style="font-size: 10px; margin-top: 30px; color: #555;">SARA_STADLER_COMMAND: VISION_FULLY_RENDERED</p>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))