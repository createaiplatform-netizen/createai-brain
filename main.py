import os
from flask import Flask

app = Flask(__name__)

# THE_NEXUS_COORDINATES
VAULT = "HUNTINGTON_7662"
MISSION_KEY_LINK = "https://buy.stripe.com/5kQfZhfZUaVS13" # Your Mom's link

@app.route('/')
def home():
    return f"""
    <html>
        <head>
            <title>197_HUB_NEXUS</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ background-color: #000; color: #FFD700; text-align: center; font-family: monospace; padding: 20px; }}
                .nexus-frame {{ border: 5px solid #00FF00; padding: 25px; background: #050505; border-radius: 20px; }}
                .value-list {{ text-align: left; background: #111; padding: 15px; border: 1px solid #333; margin: 20px 0; }}
                .green {{ color: #00FF00; }}
                .big-btn {{ 
                    display: block; background: #00FF00; color: #000; padding: 25px; 
                    text-decoration: none; font-weight: bold; font-size: 22px; border-radius: 10px; margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="nexus-frame">
                <h1 style="letter-spacing: 5px;">197_NEXUS_SOVEREIGN</h1>
                <p class="green">144,400%_REALITY_CONFIRMED</p>
                <hr>

                <h3>WHAT THE $17 MISSION KEY UNLOCKS:</h3>
                <div class="value-list">
                    <p>• <span class="green">SARA_ARCHITECT_AI:</span> Full vision engine access.</p>
                    <p>• <span class="green">EMPIRE_VAULT:</span> All historical files (Month 01-Present).</p>
                    <p>• <span class="green">715_WEBSTER_BRIDGE:</span> Direct connection to Global Settlement data.</p>
                    <p>• <span class="green">GHOST_PURGE_01:</span> Personal digital security clearing.</p>
                </div>

                <a href="{MISSION_KEY_LINK}" class="big-btn">ACTIVATE_MISSION_KEY</a>
                
                <p style="margin-top:30px; font-size: 10px; color: #555;">AFTER PAYMENT, REFRESH THIS PAGE FOR FULL VAULT SIGHT.</p>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))