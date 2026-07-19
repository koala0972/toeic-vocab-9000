"""
verify-level.py — structural validator for refined level JSON.

Mirrors:
- app/api/levels/[n]/route.ts: JSON.parse the file content
- WordCard.tsx consumer fields: word, translations[].lang_word/definition,
  examples[].en/highlight/translations.zh-TW, synonyms/antonyms/phrases,
  conjugations (standard keys).

Usage: python scripts/verify-level.py <N> [tier]
"""
import json
import os
import sys


def tier_for(level: int) -> str:
    if 1 <= level <= 300:
        return "basic"
    if 301 <= level <= 600:
        return "intermediate"
    if 601 <= level <= 900:
        return "advanced"
    raise ValueError(f"level {level} out of range")


def main(level: int, tier: str) -> int:
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(base, "data", "levels", tier, f"{level}.json")
    if not os.path.exists(path):
        print(f"FAIL: file not found: {path}")
        return 1

    errors = []
    warnings = []

    # 1) JSON.parse — same as route.ts
    try:
        with open(path, "r", encoding="utf-8") as f:
            d = json.load(f)
    except json.JSONDecodeError as e:
        print(f"FAIL: JSON.parse error: {e}")
        return 1

    # 2) Top-level shape
    for k in ("level", "tier", "cefr", "words"):
        if k not in d:
            errors.append(f"missing top-level key: {k}")
    if d.get("level") != level:
        errors.append(f"level mismatch: got {d.get('level')}, want {level}")
    if d.get("tier") != tier:
        errors.append(f"tier mismatch: got {d.get('tier')}, want {tier}")
    words = d.get("words")
    if not isinstance(words, list):
        errors.append("words is not a list")
        print("FAIL: " + "; ".join(errors))
        return 1
    if len(words) != 10:
        errors.append(f"expected 10 words, got {len(words)}")

    # 3) Per-word (WordCard.tsx consumer)
    SIMP = set("亲产为对从与运营电马买卖观让说请谢谢语词资计济东门车纸钟")
    LEGACY_CONJ = {"past_tense", "present_participle", "third_person"}

    for w in words:
        word = w.get("word", "<unknown>")
        for k in ("id", "word", "pos", "conjugations", "translations",
                  "examples", "synonyms", "antonyms", "phrases"):
            if k not in w:
                errors.append(f"{word}: missing key {k}")

        # translations
        tr = w.get("translations", [])
        if not tr:
            errors.append(f"{word}: no translations")
        else:
            t = tr[0]
            if t.get("lang") != "zh-TW":
                errors.append(f"{word}: lang != zh-TW (got {t.get('lang')})")
            if t.get("lang_word") != word:
                errors.append(f"{word}: lang_word != word (got {t.get('lang_word')})")
            defn = t.get("definition", "")
            if not defn:
                errors.append(f"{word}: empty definition")
            simp_in_def = [c for c in SIMP if c in defn]
            if simp_in_def:
                errors.append(f"{word}: simplified chars in definition: {simp_in_def}")

        # examples — exactly 3, highlight matches sentence, has zh-TW
        exs = w.get("examples", [])
        if len(exs) != 3:
            errors.append(f"{word}: expected 3 examples, got {len(exs)}")
        forms = []
        for e in exs:
            if "en" not in e or "highlight" not in e or "translations" not in e:
                errors.append(f"{word}: example missing en/highlight/translations")
                continue
            zh = e["translations"].get("zh-TW", "")
            if not zh or "尚未翻譯" in zh:
                errors.append(f"{word}: untranslated example: {e['en']}")
            simp_in_zh = [c for c in SIMP if c in zh]
            if simp_in_zh:
                errors.append(f"{word}: simplified chars in zh-TW: {simp_in_zh}")
            for h in e["highlight"]:
                forms.append(h)
                if h not in e["en"]:
                    errors.append(f"{word}: highlight '{h}' not in sentence: {e['en']}")
        if len(set(forms)) < 2:
            # Uncountable nouns / pronouns may legitimately share form
            warnings.append(f"{word}: {len(set(forms))} distinct form(s): {forms}")

        # conjugation keys standardized
        conj = w.get("conjugations", {})
        legacy = LEGACY_CONJ & set(conj.keys())
        if legacy:
            errors.append(f"{word}: legacy conjugation keys: {legacy}")

        # enrichment
        if len(w.get("synonyms", [])) < 2:
            warnings.append(f"{word}: synonyms < 2 ({w.get('synonyms')})")
        if len(w.get("antonyms", [])) < 1:
            warnings.append(f"{word}: antonyms empty")
        if len(w.get("phrases", [])) < 3:
            warnings.append(f"{word}: phrases < 3 ({w.get('phrases')})")

    print(f"=== Level {level} ({tier}) structural verification ===")
    print(f"file: {path}")
    print(f"words: {len(words)}   errors: {len(errors)}   warnings: {len(warnings)}")
    print()
    print(f"{'word':14s}  ex  forms                        conj-keys")
    for w in words:
        forms = ", ".join(e["highlight"][0] for e in w["examples"])
        ckeys = ",".join(sorted(w.get("conjugations", {}).keys())) or "(none)"
        print(f"{w['word']:14s}  {len(w['examples'])}   {forms:28s}  {ckeys}")
    if errors:
        print("\nERRORS:")
        for e in errors:
            print(f"  ERR  {e}")
    if warnings:
        print("\nWARNINGS (informational):")
        for wng in warnings:
            print(f"  WARN {wng}")
    print()
    if errors:
        print("FAIL")
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python scripts/verify-level.py <N> [tier]")
        sys.exit(2)
    level = int(sys.argv[1])
    tier = sys.argv[2] if len(sys.argv) >= 3 else tier_for(level)
    sys.exit(main(level, tier))
