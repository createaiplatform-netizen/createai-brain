from flask import Flask, render_template_string

app = Flask(__name__)

# THE_CORE_VALUES_STORAGE (From your first message)
CORE_VALUES = [
    "144,400% Stasis",
    "Internal AI in every product",
    "Honesty and Truthfulness",
    "Continuous Building until Done"
]

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { background: #000; color: #0f0; font-family: monospace; margin: 0; padding: 15px; }
        .nexus-container { border: 2px solid #FFD700; padding: 15px; max-width: 400px; margin: auto; }
        h1 { color: #FFD700; font-size: 1.4rem; text-align: center; }
        .vault-status { border-top: 1px solid #333; margin-top: 20px; padding-top: 10px; }
        .value-tag { color: #FFD700; font-size: 0.8rem; display: block; margin: 5px 0; }
        .btn { background: #FFD700; color: #000; padding: 10px; display: block; text-decoration: none; font-weight: bold; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="nexus-container">
        <h1>NEXUS_SYSTEM_v1.0</h1>
        <p><strong>ARCHITECT:</strong> SARA_STADLER</p>
        
        <div class="vault-status">
            <p>[CORE_VALUES_ACTIVE]</p>
            {% for value in values %}
            <span class="value-tag">>> {{ value }}</span>
            {% endfor %}
        </div>

        <div class="vault-status">
            <p>[DATA_LINK: WEBSTER-VAULT-2026]</p>
            <p>STATUS: SECURED_IN_ROOT</p>
        </div>

        <a href="mailto:ACTIVATE@createai.digital" class="btn">INITIALIZE_AI_PRODUCT</a>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE, values=CORE_VALUES)

if __name__ == "__main__":
    app.run()
