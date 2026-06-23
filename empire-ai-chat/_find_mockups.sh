#!/usr/bin/env bash
echo "=== Desktop + Downloads images, newest first ==="
find ~/Desktop ~/Downloads -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) -print0 2>/dev/null \
  | xargs -0 ls -lt 2>/dev/null | head -30 | awk '{print $6, $7, $8, $NF}'
echo
echo "=== anything named character/team/empire/simpsons/avatar ==="
mdfind -onlyin "$HOME" 'kMDItemContentTypeTree == "public.image"' 2>/dev/null \
  | grep -iE "character|simpson|avatar|team|ceo|gaspar|mockup" | head -20
