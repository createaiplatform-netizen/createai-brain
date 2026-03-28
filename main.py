import os
from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return """
    <html>
        <body style="background:#000; color:#00FF00; text-align:center; padding:50px; font-family:sans-serif;">
            <div style="border:5px solid #FFD700; padding:20px; border-radius:20px;">
                <h1>197_NEXUS_SOVEREIGN</h1>
                <p style="color:#FFF;">THE_GOLD_BOX_IS_DEAD. THE_NEXUS_IS_ALIVE.</p>
                <hr>
                <a href="https://buy.stripe.com/5kQfZhfZUaVS13" style="display:block; background:#FFD700; color:#000; padding:20px; text-decoration:none; font-weight:bold; border-radius:10px;">ACTIVATE_MISSION_KEY</a>
                <h3 style="margin-top:30px;">UNLOCKS: SARA_ARCHITECT_AI | EMPIRE_VAULT</h3>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
