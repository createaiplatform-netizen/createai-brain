import time
import uuid
from flask import Flask, Response, jsonify

# --- THE UNIVERSAL SINGULARITY ENGINE ---
# INTERNAL | EXTERNAL | UPSIDE-DOWN | 100% INTEGRITY
app = Flask(__name__)
START_TIME = time.time()

# THE SOVEREIGN DATA REGISTRY
CORE_DATA = {
    "MARKET": {"nodes": ["WEBSTER", "SUPERIOR", "GLOBAL"], "logic": "ZENITH_300"},
    "CREATIVE": {"lab": "ACTIVE", "soul_sync": "ENABLED"},
    "LEGACY": {"vault": "KID_VISION_LOCKED", "protection": "MAXIMUM"}
}

@app.route('/genesis')
def genesis_monolith():
    uptime = int(time.time() - START_TIME)
    html = f"""
    <!DOCTYPE html>
    <html style="background:#000;color:#d4af37;font-family:monospace;margin:0;padding:0;overflow:hidden;">
        <head><title>ZENITH | THE TOTALITY</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;text-transform:uppercase;">
            
            <div id="origin" style="width:180px;height:180px;background:radial-gradient(circle,#d4af37 0%,#000 80%);border-radius:50%;box-shadow:0 0 80px #d4af37;animation:pulse 2s infinite alternate;"></div>
            
            <div style="margin-top:50px;text-align:center;width:80%;max-width:600px;">
                <h1 style="letter-spacing:8px;font-size:2rem;margin-bottom:20px;">Genesis Monolith</h1>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;text-align:left;">
                    <div style="border:1px solid #d4af37;padding:15px;background:rgba(212,175,55,0.05);">
                        <h3 style="margin:0;font-size:0.8rem;">I. THE EXCHANGE</h3>
                        <p style="font-size:0.7rem;color:#fff;">Status: Harvesting Global Flow</p>
                    </div>
                    <div style="border:1px solid #d4af37;padding:15px;background:rgba(212,175,55,0.05);">
                        <h3 style="margin:0;font-size:0.8rem;">II. CREATIVE HUB</h3>
                        <p style="font-size:0.7rem;color:#fff;">Status: Soul Generator Live</p>
                    </div>
                </div>

                <div style="border:1px solid #d4af37;padding:15px;margin-top:15px;background:rgba(212,175,55,0.08);">
                    <h3 style="margin:0;font-size:0.8rem;color:#fff;">III. THE LEGACY (KID VISION)</h3>
                    <p style="font-size:0.7rem;">Sovereign Vault: Protected by the Origin</p>
                </div>
            </div>

            <p style="margin-top:40px;font-size:0.6rem;opacity:0.5;">UPTIME: {uptime}s | VERSION: 1.0_UNBOUND</p>

            <style>
                @keyframes pulse {{ 0% {{ transform: scale(0.95); opacity: 0.8; }} 100% {{ transform: scale(1.05); opacity: 1; }} }}
            </style>
        </body>
    </html>
    """
    return Response(html, mimetype='text/html')

if __name__ == "__main__":
    # We use Port 8081 to avoid the conflict with the main Brain server
    app.run(host='0.0.0.0', port=8081)
