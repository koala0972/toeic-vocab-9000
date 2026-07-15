import json, os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for tier_name, lo, hi in [("basic", 1, 300), ("intermediate", 301, 600), ("advanced", 601, 900)]:
    for i in range(lo, hi + 1):
        path = os.path.join(base, "data", "levels", tier_name, f"{i}.json")
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            d = json.load(f)
        ex_counts = [len(w.get("examples", [])) for w in d.get("words", [])]
        if not ex_counts or not all(c >= 3 for c in ex_counts):
            print(i)
            exit(0)
print("ALL_DONE")
