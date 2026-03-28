import os
from flask import Flask, jsonify

app = Flask(__name__)

# THE_715_WEBSTER_VAULT_CONFIGURATION
VAULT_ID = "HUNTINGTON_7662"

@app.route('/')
def index():
    return f"""
    <html>
        <head><title>197_HUB_SOVEREIGN</title></head>
        <body style="background-color: #000; color: #FFD700; text-align: center; font-family: monospace; padding-top: 50px;">
            <div style="border: 2px solid #FFD700; padding: 20px; display: inline-block;">
                <h1>CREATE AI DIGITAL</h1>
                <p>VAULT_ID: {VAULT_ID}</p>
                <h2 style="color: #00FF00;">STATUS: 144,400%_STASIS</h2>
                <p>SETTLEMENT: READY</p>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))