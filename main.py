from flask import Flask, render_template_string

app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXUS_HUB_144400%</title>
    <style>
        body { background-color: #000; color: #00FF00; font-family: 'Courier New', monospace; text-align: center; padding: 50px; margin: 0; }
        .nexus-border { border: 3px double #FFD700; padding: 30px; display: inline-block; max-width: 90%; margin-top: 10%; }
        h1 { font-size: 2.5em; margin: 0; color: #FFD700; text-shadow: 2px 2px #000; }
        h2 { font-size: 1.2em; color: #00FF00; letter-spacing: 2px; }
        .status { color: #FFF; font-size: 0.9em; margin-top: 20px; }
        .btn { background: #FFD700; color: #000; padding: 15px 30px; border: none; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 30px; font-size: 1.1em; transition: 0.3s; }
        .btn:hover { background: #FFF; color: #000; }
    </style>
</head>
<body>
    <div class="nexus-border">
        <h1>NEXUS_HUB_ACTIVE</h1>
        <h2>ARCHITECT: SARA_STADLER</h2>
        <div class="status">
            <p>144,400%_SYNCHRONIZED</p>
            <p>DOMAIN_SECURED: createai.digital</p>
        </div>
        <a href="mailto:ACTIVATE@createai.digital" class="btn">ACTIVATE_ENTRY</a>
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

if __name__ == "__main__":
    app.run(debug=True)
