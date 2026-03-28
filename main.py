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
        body { background-color: #000; color: #00FF00; font-family: monospace; text-align: center; padding: 20px; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .nexus-border { border: 3px double #FFD700; padding: 20px; width: 90%; max-width: 400px; box-sizing: border-box; }
        h1 { font-size: 8vw; color: #FFD700; margin: 0; word-wrap: break-word; }
        h2 { font-size: 4vw; color: #00FF00; letter-spacing: 1px; margin-top: 10px; }
        .status { color: #FFF; font-size: 3vw; margin-top: 15px; border-top: 1px solid #333; padding-top: 10px; }
        .btn { background: #FFD700; color: #000; padding: 12px 20px; border: none; font-weight: bold; text-decoration: none; display: inline-block; margin-top: 20px; font-size: 4vw; }
    </style>
</head>
<body>
    <div class="nexus-border">
        <h1>NEXUS_HUB_ACTIVE</h1>
        <h2>ARCHITECT: SARA_STADLER</h2>
        <div class="status">
            <p>144,400%_SYNCHRONIZED</p>
            <p>createai.digital</p>
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
