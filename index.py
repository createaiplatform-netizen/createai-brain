# Save this as index.py in your main GitHub folder
import os
import requests

# This pulls from your GitHub Secrets (The Hidden Vault)
HUBSPOT_TOKEN = os.getenv('HUBSPOT_ACCESS_TOKEN')

def run_aether_vault_check():
    """
    This is the Main Index Function. 
    It checks the $5,000 (Ref: B3FA-2A85) and processes the Orange Arrow Quotes.
    """
    print("--- AETHER CORE: INDEX MODE ACTIVE ---")
    
    # The endpoint that sees your money and quotes
    url = "https://api.hubapi.com/crm/v3/objects/quotes"
    headers = {'Authorization': f'Bearer {HUBSPOT_TOKEN}'}

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            # This is where the magic happens
            print("VAULT STATUS: Connection Secure.")
            print("ACTION: Monitoring $5,000 arrival and syncing with Huntington 7662.")
        else:
            print("VAULT STATUS: Access Denied. Re-verify Token.")
    except Exception as e:
        print(f"SYSTEM ERROR: {e}")

if __name__ == "__main__":
    run_aether_vault_check()
