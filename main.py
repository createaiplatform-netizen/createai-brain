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
                body { background:#000; color:#00FF00; text-align:center; padding:20px; font-family:sans-serif; }
                .nexus { border:4px solid #FFD700; padding:20px; border-radius:15px; background:#050505; max-width:500px; margin:auto; }
                .tier { border:1px solid #333; padding:15px; margin:15px 0; border-radius:10px; }
                .btn { display:block; background:#FFD700; color:#000; padding:15px; text-decoration:none; font-weight:bold; border-radius:8px; margin-top:10px; }
                .app-grid { display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:20px; }
                .app-btn { background:#111; border:1px solid #00FF00; color:#00FF00; padding:10px; border-radius:5px; font-size:12px; }
            </style>
        </head>
        <body>
            <div class="nexus">
                <h1>197_NEXUS_HUB</h1>
                <p style="color:#FFF;">THE_ARCHITECT: SARA_STADLER</p>
                
                <div class="tier">
                    <h2 style="color:#FFD700;">$17_MISSION_KEY</h2>
                    <p style="font-size:12px; color:#aaa;">GARDEN_AI | DAILY_INTEL | STASIS_ACCESS</p>
                    <a href="https://buy.stripe.com/5kQfZhfZUaVS13" class="btn">ACTIVATE_ENTRY</a>
                </div>

                <div class="tier">
                    <h2 style="color:#FFD700;">$197_FOUNDER_KEY</h2>
                    <p style="font-size:12px; color:#aaa;">HEALTH_AI | CREATIVE_BUILDER | MASTER_VAULT</p>
                    <a href="#" class="btn" style="background:#FFF;">COMING_SOON</a>
                </div>

                <hr style="border:0.5px solid #222;">
                <h3>SOVEREIGN_APPS</h3>
                <div class="app-grid">
                    <div class="app-btn">HEALTH_CORE [LOCK]</div>
                    <div class="app-btn">GARDEN_SYNC [LOCK]</div>
                    <div class="app-btn">LITTLE_AI_01 [LOCK]</div>
                    <div class="app-btn">EMPIRE_VAULT [LOCK]</div>
                </div>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))
