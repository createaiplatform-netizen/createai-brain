from flask import Flask, render_template_string

app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { background: #000; color: #0f0; font-family: monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .box { border: 2px solid #FFD700; padding: 15px; width: 85%; max-width: 320px; text-align: center; }
        h1 { color: #FFD700; font-size: 1.2rem; margin: 5px 0; }
        p { font-size: 0.8rem; }
        .btn { background: #FFD700; color: #000; padding: 10px; display: block; text-decoration: none; font-weight: bold; margin-top: 15px; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="box">
        <h1>NEXUS_HUB_ACTIVE</h1>
        <p>ARCHITECT: SARA_STADLER</p>
        <p>144,400%_SYNC</p>
        <a href="mailto:ACTIVATE@createai.digital" class="btn">ACTIVATE_ENTRY</a>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

if __name__ == "__main__":
    app.run()
