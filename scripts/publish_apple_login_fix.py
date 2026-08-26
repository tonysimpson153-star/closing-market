import base64, json, re, subprocess
from pathlib import Path

repo = "repos/tonysimpson153-star/closing-market"
root = Path(__file__).resolve().parents[1]
files = [
    ("closing-market/server/db.ts", root / "server/db.ts"),
    ("closing-market/server/routers.ts", root / "server/routers.ts"),
]

def api(endpoint, method="GET", payload=None):
    args = ["gh", "api", endpoint]
    if method != "GET":
        args += ["--method", method, "--input", "-", "--header", "Accept: application/vnd.github+json"]
    p = subprocess.run(args, input=json.dumps(payload).encode() if payload else None, stdout=subprocess.PIPE, check=True)
    return json.loads(re.sub(rb"\x1b\[[0-9;]*m", b"", p.stdout))

head = api(f"{repo}/commits/main")["sha"]
base_tree = api(f"{repo}/commits/{head}")["commit"]["tree"]["sha"]
tree_items = []
for path, local in files:
    remote = api(f"{repo}/contents/{path}?ref=main")
    current = base64.b64decode(remote["content"]).decode()
    content = local.read_text()
    if content == current:
        continue
    blob = api(f"{repo}/git/blobs", "POST", {"content": base64.b64encode(content.encode()).decode(), "encoding": "base64"})
    tree_items.append({"path": path, "mode": "100644", "type": "blob", "sha": blob["sha"]})
if not tree_items:
    print(json.dumps({"status": "already-up-to-date", "head": head}))
    raise SystemExit

tree = api(f"{repo}/git/trees", "POST", {"base_tree": base_tree, "tree": tree_items})
commit = api(f"{repo}/git/commits", "POST", {"message": "fix: make Apple account creation legacy-schema safe", "tree": tree["sha"], "parents": [head]})
api(f"{repo}/git/refs/heads/main", "PATCH", {"sha": commit["sha"], "force": False})
print(json.dumps({"previous": head, "commit": commit["sha"], "files": [item["path"] for item in tree_items]}))
