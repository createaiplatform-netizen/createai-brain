const express = require('express');
const app = express();

const SYSTEM_CONFIG = {
    NAME: "CreateAI Digital Sovereign",
    TARGET_VALUATION: "1,000,000,000,000",
    IMPACT_RATE: 0.10,
    COMMUNITY_NODE_VAL: 1500,
};

app.get('/', (req, res) => {
    res.send(`
        <html>
            <body style="background: #000; color: #d4af37; font-family: sans-serif; text-align: center; padding-top: 100px;">
                <h1>THE SOVEREIGN HEARTH</h1>
                <p style="color: #fff;">The Middleman is Dead. Ownership is Born.</p>
                <hr style="width: 20%; border: 0.5px solid #d4af37;">
                <h3>Sovereign Node: $7,500</h3>
                <button style="background: #d4af37; color: #000; padding: 15px 30px; border: none; cursor: pointer; font-weight: bold;">
                    ACQUIRE INFRASTRUCTURE
                </button>
                <p style="margin-top: 50px; font-size: 0.8em; color: #555;">
                    Every Node purchased funds 10% of a Community Education Node globally.
                </p>
            </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("\n------------------------------------------");
    console.log(`${SYSTEM_CONFIG.NAME} IS LIVE`);
    console.log(`STATUS: BUILDING THE TRILLION`);
    console.log(`GOAL: HELPING THE WORLD AT SCALE`);
    console.log("------------------------------------------\n");
});
