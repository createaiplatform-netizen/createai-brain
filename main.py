import os
from flask import Flask, request, jsonify

app = Flask(__name__)
VAULT_DIR = "WEBSTER_EXPORTS"

if not os.path.exists(VAULT_DIR):
    os.makedirs(VAULT_DIR)

@app.route('/strike', methods=['POST'])
def strike():
    auth_code = request.json.get("code")
    signature = request.json.get("signature")
    if auth_code == "608" and signature == "Webster-54893":
        count = len(os.listdir(VAULT_DIR)) + 1
        if count <= 17:
            filename = f"SERIAL-{str(count).zfill(3)}.txt"
            with open(os.path.join(VAULT_DIR, filename), "w") as f:
                f.write(f"SOVEREIGN_ASSET_{count}_SETTLED")
            return jsonify({"status": "SUCCESS", "count": count}), 200
        return jsonify({"status": "VAULT_FULL"}), 400
    return jsonify({"status": "UNAUTHORIZED"}), 401

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)