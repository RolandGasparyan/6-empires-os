#!/usr/bin/env python3
"""One-off fix: add the missing /6-empires-emblem.png nginx location block
alongside the existing /empire-logo.png block on the 6-empires.com site."""
p = "/etc/nginx/sites-available/6-empires.com"
s = open(p).read()
if "6-empires-emblem.png" not in s:
    block = '''    location = /empire-logo.png {
        root /opt/empire-landing;
    }
'''
    new_block = block + '''    location = /6-empires-emblem.png {
        root /opt/empire-landing;
    }
'''
    assert block in s, "expected block not found -- stopping, no changes made"
    s = s.replace(block, new_block, 1)
    open(p, "w").write(s)
    print("inserted new location block")
else:
    print("already present, no change needed")
