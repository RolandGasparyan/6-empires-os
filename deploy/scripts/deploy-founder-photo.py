#!/usr/bin/env python3
"""Deploy the updated landing page (real founder photo + full interactive
layer) to /opt/empire-landing, and add the missing nginx location block for
founder.jpg (nginx here only serves explicitly-listed static files, same
pattern as the earlier /6-empires-emblem.png fix)."""
import subprocess, sys

RAW = "https://raw.githubusercontent.com/RolandGasparyan/6-empires-os/main/landing"
DEST = "/opt/empire-landing"

def run(cmd):
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)

# 1) pull the new files down
run(["curl", "-fsSL", f"{RAW}/index.html", "-o", f"{DEST}/index.html"])
run(["curl", "-fsSL", f"{RAW}/founder.jpg", "-o", f"{DEST}/founder.jpg"])

# 2) make sure nginx has a location block for founder.jpg
conf = "/etc/nginx/sites-available/6-empires.com"
s = open(conf).read()
if "founder.jpg" not in s:
    anchor = "    location = /empire-logo.png {\n        root /opt/empire-landing;\n    }\n"
    if anchor not in s:
        print("WARNING: expected anchor block not found in nginx conf -- skipping nginx edit, add manually:")
        print('    location = /founder.jpg { root /opt/empire-landing; }')
    else:
        block = anchor + "    location = /founder.jpg {\n        root /opt/empire-landing;\n    }\n"
        s = s.replace(anchor, block, 1)
        open(conf, "w").write(s)
        print("inserted /founder.jpg nginx location block")
        run(["nginx", "-t"])
        run(["systemctl", "reload", "nginx"])
else:
    print("nginx already has a founder.jpg route, no config change needed")

print("done -- verify with: curl -sI https://6-empires.com/founder.jpg")
