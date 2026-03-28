import os
from flask import Flask

app = Flask(__name__)

# THE_MISSION_KEY_INTEGRATION
STRIPE_LINK = "https://buy.stripe.com/5kQfZhfZUaVS13..."

@app.route('/')
def home():
    return f"""
    <html>
        <head>
            <title>197_HUB_SOVEREIGN</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ background-color: #000; color: #FFD700; text-align: center; font-family: monospace; padding: 20px; }}
                .vault-frame {{ border: 5px double #00FF00; padding: 25px; background: #050505; border-radius: 20px; }}
                .mission-status {{ background: #00FF00; color: #000; padding: 15px; font-weight: bold; margin-bottom: 25px; border-radius: 10px; }}
                .big-btn {{ 
                    display: block; background: #FFD700; color: #000; 
                    padding: 25px; margin: 15px 0; text-decoration: none; 
                    font-weight: bold; font-size: 22px; border-radius: 50px;
                }}
                .mission-btn {{ 
                    display: block; background: #00FF00; color: #000; 
                    padding: 30px; margin: 25px 0; text-decoration: none; 
                    font-weight: bold; font-size: 26px; border-radius: 10px;
                    border: 4px solid #fff;
                }}
            </style>
        </head>
        <body>
            <div class="mission-status">
                MISSION_PROGRESS: 85% COMPLETE<br>
                PAYROLL_TARGET: $5,000 | STATUS: ACTIVE
            </div>
            
            <div class="vault-frame">
                <h1 style="letter-spacing: 5px;">197_HUB_SOVEREIGN</h1>
                <p style="color:#00FF00;">144,400%_STASIS_CONFIRMED</p>
                <hr style="border: 1px solid #333;">

                <a href="{STRIPE_LINK}" class="mission-btn">ACTIVATE $17 MISSION KEY</a>

                <h3 style="text-align: left; color: #00FF00;">SOVEREIGN_APPS:</h3>
                <a href="#" class="big-btn">SARA_ARCHITECT_AI</a>
                <a href="#" class="big-btn">GHOST_PURGE_SEC</a>
                
                <p style="margin-top:40px; font-size: 10px; color: #555;">SARA_STADLER_COMMAND | THE_SENTINEL_IS_WATCHING</p>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
