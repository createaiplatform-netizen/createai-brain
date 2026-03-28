from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return """
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { background: black; color: #00FF00; font-family: monospace; text-align: center; padding-top: 20%; }
            .box { border: 2px solid #FFD700; padding: 20px; display: inline-block; width: 80%; }
            h1 { font-size: 5vw; color: #FFD700; }
        </style>
    </head>
    <body>
        <div class="box">
            <h1>NEXUS_HUB_ACTIVE</h1>
            <p>ARCHITECT: SARA_STADLER</p>
            <p>144,400%_SYNC</p>
        </div>
    </body>
    </html>
    """

if __name__ == "__main__":
    app.run()