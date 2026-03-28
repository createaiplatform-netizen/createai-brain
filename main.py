from flask import Flask, render_template_string

app = Flask(__name__)

# THE_365_MARKET_PRICE_INDEX
DATA = {
    "PREMIUM_ASSETS": [
        {"n": "MED_NEXUS_PRO", "p": "$1,440.00", "d": "Full Healthcare AI Suite"},
        {"n": "LEX_LOGIC_LEGAL", "p": "$2,026.00", "d": "Blockchain Legal Engine"},
        {"n": "EBS_GRID_CONTROL", "p": "UNAVAILABLE", "d": "Government/Sovereign Only"}
    ],
    "EMPIRE_UTILITIES": [
        {"n": "STAFFING_SYNC", "p": "$440.00/mo", "d": "144k Talent Acquisition"},
        {"n": "GARDEN_EDU", "p": "$180.00", "d": "Growth-Grid Learning Module"},
        {"n": "CREATORS_HUB", "p": "$99.00", "d": "AI Forge Access"}
    ]
}

HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        body { background: #000; color: #0f0; font-family: monospace; margin: 0; padding: 10px; }
        .nexus { border: 2px solid #FFD700; padding: 15px; box-shadow: 0 0 20px #FFD700; min-height: 95vh; display: flex; flex-direction: column; }
        .header { text-align: center; border-bottom: 2px solid #FFD700; padding-bottom: 10px; }
        .term { background: #050505; border: 1px solid #333; height: 120px; overflow-y: auto; font-size: 0.7rem; padding: 10px; color: #fff; margin: 10px 0; border-left: 3px solid #FFD700; }
        .label { background: #FFD700; color: #000; font-size: 0.6rem; padding: 2px 8px; font-weight: bold; margin-top: 15px; display: inline-block; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 10px; }
        .card { border: 1px solid #222; padding: 12px; background: #080808; display: flex; justify-content: space-between; align-items: center; }
        .info { flex-grow: 1; }
        .n { color: #FFD700; font-size: 0.8rem; font-weight: bold; display: block; }
        .p { color: #fff; font-size: 0.7rem; margin-top: 4px; display: block; }
        .buy-btn { background: #FFD700; color: #000; padding: 10px; font-size: 0.7rem; font-weight: bold; cursor: pointer; border: none; min-width: 80px; text-align: center; }
        .buy-btn:active { background: #fff; }
        .footer { margin-top: auto; text-align: center; font-size: 0.5rem; color: #444; padding-top: 10px; }
    </style>
    <script>
        function initiatePurchase(name, price) {
            const t = document.getElementById('t');
            t.innerHTML += `<br>[${new Date().toLocaleTimeString()}] > INITIATING ACQUISITION: ${name}`;
            t.innerHTML += `<br>[SYSTEM] > GENERATING SECURE INVOICE FOR ${price}...`;
            t.innerHTML += `<br>[PAYMENT] > CLICK LINK TO FINALIZE: <a href="https://buy.stripe.com/mock_endpoint" style="color:#FFD700">SECURE_CHECKOUT</a>`;
            t.scrollTop = t.scrollHeight;
        }
    </script>
</head>
<body>
    <div class="nexus">
        <div class="header">
            <h1 style="color:#FFD700; font-size:1.1rem; margin:0;">STADLER_MARKET_SOVEREIGN</h1>
            <p style="font-size:0.5rem; color:#888;">VAULT: 2026 | LIQUIDITY: ACTIVE</p>
        </div>
        <div id="t" class="term">>> MARKET_OPEN...<br>>> SECURE_GATEWAY_LINKED...<br>>> STANDING BY FOR ORDERS.</div>
        
        {% for cat, items in data.items() %}
            <span class="label">{{ cat }}</span>
            <div class="grid">
                {% for a in items %}
                <div class="card">
                    <div class="info">
                        <span class="n">{{ a.n }}</span>
                        <span class="p">VALUE: {{ a.p }}</span>
                    </div>
                    <div class="buy-btn" onclick="initiatePurchase('{{ a.n }}', '{{ a.p }}')">BUY_NOW</div>
                </div>
                {% endfor %}
            </div>
        {% endfor %}
        
        <div class="footer">ENCRYPTION: AES-256 | MERCHANT_ID: SARA_STADLER</div>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML, data=DATA)

if __name__ == "__main__":
    app.run()
