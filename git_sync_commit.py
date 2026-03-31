import subprocess
import os

# ----------------------------
# CONFIG
# ----------------------------
# Path to your new file to commit (relative to repo root)
new_file = "AI_WebBuilder/backend/ai_webbuilder_allinone.py"
commit_message = "Add all-in-one AI web builder file"

# ----------------------------
# FUNCTIONS
# ----------------------------
def run(cmd):
    """Run a shell command and print output"""
    result = subprocess.run(cmd, shell=True, text=True, capture_output=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr)

# ----------------------------
# STEP 1: Backup uncommitted changes
# ----------------------------
print("💾 Stashing uncommitted changes...")
run("git stash")

# ----------------------------
# STEP 2: Fetch latest remote
# ----------------------------
print("🌐 Fetching remote updates...")
run("git fetch origin")

# ----------------------------
# STEP 3: Reset local branch to match remote
# ----------------------------
current_branch = subprocess.check_output(
    "git rev-parse --abbrev-ref HEAD", shell=True, text=True
).strip()
print(f"🔧 Resetting branch '{current_branch}' to match remote...")
run(f"git reset --hard origin/{current_branch}")

# ----------------------------
# STEP 4: Apply stashed changes
# ----------------------------
print("♻️ Restoring stashed changes...")
run("git stash pop")

# ----------------------------
# STEP 5: Add new file
# ----------------------------
print(f"➕ Adding new file: {new_file}")
run(f"git add {new_file}")

# ----------------------------
# STEP 6: Commit
# ----------------------------
print(f"📝 Committing: {commit_message}")
run(f'git commit -m "{commit_message}"')

# ----------------------------
# STEP 7: Push
# ----------------------------
print("🚀 Pushing to remote...")
run(f"git push origin {current_branch}")

print("✅ Done! Your branch is synced and your file is committed.")