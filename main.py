from flask import Flask, Response

app = Flask(__name__)
START_TIME = time.time()

# THE SOVEREIGN ENGINE
@app.route('/')
def health_check():
    return "CORE_LIVE"

@app.route('/genesis')
def genesis_dashboard():
    uptime = int(time.time() - START_TIME)
    
    # Inline High-Performance UI
    html = f"""
    <!DOCTYPE html>
    <html style="background:#0a0a0a;color:#d4af37;font-family:monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;overflow:hidden;text-transform:uppercase;">
        <head><title>ZENITH | GENESIS</title></head>
        <body>
            <div id="pulse" style="width:140px;height:140px;background:radial-gradient(circle,#d4af37 0%,#000 75%);border-radius:50%;box-shadow:0 0 40px #d4af37;animation:p 2s infinite ease-in-out;"></div>
            <div style="margin-top:40px;text-align:center;letter-spacing:3px;">
                <h1 style="font-size:1.5rem;margin-bottom:10px;">Genesis Core</h1>
                <div style="border:1px solid #d4af37;padding:15px;background:rgba(212,175,55,0.03);min-width:240px;">
                    <p style="margin:5px 0;">Status: <span style="color:#fff;">Active</span></p>
                    <p style="margin:5px 0;">Node: <span style="color:#fff;">Webster_01</span></p>
                    <p style="margin:5px 0;">Uptime: <span style="color:#fff;">{uptime}s</span></p>
                </div>
            </div>
            <style>
                @keyframes p {{
                    0%, 100% {{ transform: scale(0.96); box-shadow: 0 0 20px #d4af37; }}
                    50% {{ transform: scale(1.04); box-shadow: 0 0 60px #d4af37; }}
                }}
            </style>
        </body>
    </html>
    """
    return Response(html, mimetype='text/html')

@app.route('/strike', methods=['POST', 'GET'])
def manual_bypass():
    # Placeholder for Zero-Friction data entry
    return "STRIKE_READY"

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)