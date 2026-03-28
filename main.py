import os
from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return """
    <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { background:#000; color:#00FF00; text-align:center; padding:30px; font-family:sans-serif; }
                .nexus { border:5px solid #FFD700; padding:20px; border-radius:20px; background:#050505; }
                .btn { display:block; background:#FFD700; color:#000; padding:20px; text-decoration:none; font-weight:bold; border-radius:10px; margin-top:20px; font-size:18px; }
                .unlocks { color:#FFF; margin-top:20px; font-size:14px; letter-spacing:1px; }
            </style>
        </head>
        <body>
            <div class="nexus">
                <h1 style="letter-spacing:3px;">197_NEXUS_SOVEREIGN</h1>
                <p style="color:#00FF00; font-weight:bold;">STASIS: 144,400%_ACTIVE</p>
                <hr style="border:1px solid #333;">
                <p style="color:#FFF;">THE_GOLD_BOX_IS_DEAD. THE_NEXUS_IS_ALIVE.</p>
                
                <a href="https://buy.stripe.com/5kQfZhfZUaVS13" class="btn">ACTIVATE_MISSION_KEY</a>
                
                <div class="unlocks">
                    ACCESS: SARA_ARCHITECT_AI | EMPIRE_VAULT<br>
                    SETTLEMENT_STATUS: LIQUID
                </div>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
