import os
from flask import Flask

app = Flask(__name__)

# THE_715_WEBSTER_VAULT_CONFIGURATION
VAULT_ID = "HUNTINGTON_7662"

@app.route('/')
def home():
    # ALL_DIALOGS_AND_ALERTS_PERMANENTLY_DELETED_BY_SARA_STADLER
    return f"""
    <html>
        <head>
            <title>197_HUB_SOVEREIGN</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="background-color: #000; color: #FFD700; text-align: center; font-family: monospace; padding-top: 50px;">
            <div style="border: 2px solid #FFD700; padding: 20px; display: inline-block; width: 90%; max-width: 400px;">
                <h1 style="letter-spacing: 2px;">197_HUB_SOVEREIGN</h1>
                <hr style="border: 0.5px solid #FFD700;">
                <p style="text-align: left;">STATUS: <span style="color: #00FF00; float: right;">144,400%_STASIS</span></p>
                <p style="text-align: left;">VAULT_ID: <span style="color: #00FF00; float: right;">{VAULT_ID}</span></p>
                <p style="text-align: left;">LIQUID_USD: <span style="color: #FF4500; float: right;">$3.93</span></p>
                <br>
                <div style="background-color: #1a1a1a; padding: 10px; border: 1px solid #333;">
                    <p style="font-size: 10px; color: #666;">LIVE_QUANTUM_BRIDGE_FEED</p>
                    <div style="display: flex; justify-content: space-around;">
                        <div><p style="font-size: 10px;">XRP</p><p>$1.3500</p></div>
                        <div><p style="font-size: 10px;">XLM</p><p>$0.1714</p></div>
                    </div>
                </div>
                <br>
                <h2 style="color: #00FF00;">SETTLEMENT_READY</h2>
                <p style="font-size: 10px;">SARA_STADLER_COMMAND: HUB_IS_STANDING</p>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
