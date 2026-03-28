from flask import Flask, jsonify
import os

app = Flask(__name__)

# THE_715_WEBSTER_VAULT_CONFIGURATION
VAULT_ID = "HUNTINGTON_7662"

@app.route('/')
def home():
    return f"""
    <html>
        <head>
            <title>CREATE AI DIGITAL</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="background-color: #000; color: #FFD700; text-align: center; font-family: monospace; padding-top: 50px;">
            <div style="border: 2px solid #FFD700; padding: 20px; display: inline-block; width: 85%;">
                <h1>CREATE AI DIGITAL</h1>
                <hr style="border: 0.5px solid #FFD700;">
                <p>STATUS: <span style="color: #00FF00;">144,400%_STASIS</span></p>
                <p>VAULT: {VAULT_ID}</p>
                <h2 style="color: #00FF00;">SETTLEMENT_READY</h2>
                <p>COMMAND: THE_EMPIRE_IS_STANDING</p>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
