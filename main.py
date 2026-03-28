from flask import Flask, jsonify, render_template
import os

app = Flask(__name__)

# THE_715_WEBSTER_VAULT_CONFIGURATION
VAULT_ID = "HUNTINGTON_7662"
XRP_RATIO = 1.3500
XLM_RATIO = 0.1714

@app.route('/')
def home():
    return """
    <html>
        <head><title>CREATE AI DIGITAL - SOVEREIGN HUB</title></head>
        <body style="background-color: #000; color: #FFD700; text-align: center; font-family: sans-serif; padding-top: 100px;">
            <div style="border: 2px solid #FFD700; padding: 50px; display: inline-block;">
                <h1>CREATE AI DIGITAL</h1>
                <p>VAULT: """ + VAULT_ID + """</p>
                <hr>
                <h2>SETTLEMENT STATUS: <span style="color: #00FF00;">ACTIVE</span></h2>
                <p>XRP: $""" + str(XRP_RATIO) + """ | XLM: $""" + str(XLM_RATIO) + """</p>
                <p>COMMAND: THE_EMPIRE_IS_STANDING</p>
            </div>
        </body>
    </html>
    """

@app.route('/api/status')
def status():
    return jsonify({
        "status": "LIVE",
        "vault": VAULT_ID,
        "bridge": "OPEN",
        "stasis": "144,400%"
    })

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
