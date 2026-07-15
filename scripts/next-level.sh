#!/bin/bash
# 找出下一個需要精修的關卡編號
# 邏輯：讀取 SKILL.md 裡的 Completed Levels 清單，找第一個未打 [x] 的
SKILL_FILE="$HOME/AppData/Local/hermes/skills/productivity/vocab-level-refine/SKILL.md"
if [ ! -f "$SKILL_FILE" ]; then
  echo "1"
  exit 0
fi

# 找 "- [ ] Level N" 的行，取最小 N
NEXT=$(grep -oP '(?<=- \[ \] Level )\d+' "$SKILL_FILE" | sort -n | head -1)
if [ -z "$NEXT" ]; then
  echo "ALL_DONE"
else
  echo "$NEXT"
fi
