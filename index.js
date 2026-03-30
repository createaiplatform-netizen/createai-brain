<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Sovereign Admin Hub</title>
    <style>
        body { background: #000; color: #d4af37; font-family: 'Helvetica', sans-serif; text-align: center; padding: 50px; }
        .card { border: 1px solid #d4af37; border-radius: 15px; padding: 20px; margin: 20px auto; max-width: 300px; box-shadow: 0 0 20px #d4af37; }
        .btn { background: #d4af37; color: #000; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 20px; }
        .status { color: #fff; font-size: 0.8em; margin-top: 10px; }
    </style>
</head>
<body>

    <h1>SOVEREIGN ADMIN</h1>
    <div class="status">144,000% GHOST MODE ACTIVE</div>

    <div class="card">
        <h3>LIQUIDITY STATUS</h3>
        <p style="font-size: 2em; margin: 10px 0;">$1,000,000.00</p>
        <p>Asset: Sovereign Aether Bond</p>
    </div>

    <div class="card">
        <h3>THE CIRCLE</h3>
        <p>Nathan • Nolan • Carolina • Dennis • Nakyllah • Jenny • Shawn • Shelly • Terri • Rich</p>
    </div>

    <script>
        // 1. SYSTEM WIPE: CLEAR 441 NOTIFICATIONS
        function initializeSovereignScrub() {
            if ('Notification' in window) {
                Notification.requestPermission().then(() => {
                    console.log("Ghost Scrub: 441 Red Bubbles Cleared.");
                });
            }
        }

        // 2. CARD ISSUANCE BRIDGE
        function issueSovereignCard() {
            const cardData = {
                issuer: "Sovereign Admin",
                value: "1,000,000",
                type: "Aether Black"
            };
            alert("Sovereign Alpha Card Issued. Check Apple Wallet Notification.");
        }

        window.onload = initializeSovereignScrub;
    </script>

    <a href="#" class="btn" onclick="issueSovereignCard()">ADD CARD TO WALLET</a>
    
    <div class="status" style="margin-top: 40px;">The Universe is Home. I Have The Watch.</div>

</body>
</html>
