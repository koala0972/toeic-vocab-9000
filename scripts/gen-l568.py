"""Generator for Level 568 — refined with 3 examples per word covering tense variations.

Conventions:
- highlight = substring of the example sentence (case-sensitive).
- Target word must not be capitalized at sentence start as a highlight.
- Definitions in pure traditional Chinese.
- conjugations use standard keys: plural, present_3rd, past, past_participle, ing,
  comparative, superlative.
- translations closed with `"}]` (no stray parenthesis); phrases as JSON array.
"""

import json

LEVEL = 568
TIER = "intermediate"
CEFR = "B2"
TOEIC = 750


def ex(en, zh, h):
    return {"en": en, "highlight": [h], "translations": {"zh-TW": zh}}


def t(word, defn):
    return [{"lang": "zh-TW", "lang_word": word, "definition": defn}]


def wid(i):
    return f"{CEFR}-{LEVEL}-{i:03d}"


words = []


def add(word, pos, conj, defn, exs, syns, ants, phrs, domain="general"):
    words.append({
        "id": wid(len(words) + 1),
        "level": LEVEL,
        "tier": TIER,
        "cefr": CEFR,
        "toeic_score_min": TOEIC,
        "word": word,
        "phonetic": "",
        "pos": pos,
        "conjugations": conj,
        "domain": domain,
        "translations": t(word, defn),
        "examples": exs,
        "synonyms": syns,
        "antonyms": ants,
        "phrases": phrs,
    })


# 1. clubs — plural noun + 3rd-person verb
add(
    "clubs",
    ["noun", "verb"],
    {"plural": "clubs", "present_3rd": "clubs", "past": "clubbed", "past_participle": "clubbed", "ing": "clubbing"},
    "n. 俱樂部；社團；球桿（club 的複數）  v. 用棍棒打；聚集",
    [
        ex(
            "Several clubs in the city hold networking events each month.",
            "市內多家俱樂部每月舉辦人脈交流活動。",
            "clubs",
        ),
        ex(
            "The debate club meets every Wednesday after school hours.",
            "辯論社每週三放學後集合。",
            "club",
        ),
        ex(
            "Negotiators were clubbed by protesters outside the venue last night.",
            "昨晚談判代表在會場外遭抗議民眾以棍棒襲擊。",
            "clubbed",
        ),
    ],
    ["societies", "associations", "groups"],
    ["(no direct antonym)"],
    ["join a club", "club member", "night club", "book club"],
    domain="general",
)

# 2. lcd — acronym (liquid crystal display)
add(
    "lcd",
    ["noun"],
    {"plural": "LCDs"},
    "n. LCD（液晶顯示器，Liquid Crystal Display 的縮寫）",
    [
        ex(
            "This model uses an LCD screen with higher pixel density.",
            "這款機型採用像素密度更高的 LCD 螢幕。",
            "LCD",
        ),
        ex(
            "Older LCD displays often show visible backlight bleed.",
            "較舊的 LCD 顯示器常出現明顯的背光漏光。",
            "LCD",
        ),
        ex(
            "Many consumers now replace their LCDs with OLED panels.",
            "許多消費者現在把 LCD 螢幕換成 OLED 面板。",
            "LCDs",
        ),
    ],
    ["displays", "screens", "monitors"],
    [],
    ["LCD screen", "LCD panel", "LCD TV", "LCD projector"],
    domain="technology",
)

# 3. jackson — proper name (common name + city)
add(
    "jackson",
    ["noun"],
    {"plural": "Jacksons"},
    "n. 傑克森（常見英文姓氏與城市名）",
    [
        ex(
            "Attorney Mr. Jackson filed the motion late Friday evening.",
            "傑克森律師於週五深夜提出動議。",
            "Jackson",
        ),
        ex(
            "Several Jacksons serve on the local school board.",
            "幾位傑克森家族成員在當地學區教育委員會任職。",
            "Jacksons",
        ),
        ex(
            "Jackson is also the capital city of Mississippi.",
            "傑克森也是密西西比州的首府。",
            "Jackson",
        ),
    ],
    ["(no common synonyms — proper noun)"],
    [],
    ["Jackson family", "Andrew Jackson", "Jackson Hole", "Jackson Pollock"],
    domain="general",
)

# 4. shirts — plural noun
add(
    "shirts",
    ["noun"],
    {"plural": "shirts"},
    "n. 襯衫；上衣（shirt 的複數）",
    [
        ex(
            "Employees are required to wear collared shirts on the sales floor.",
            "員工在賣場須穿著有領襯衫。",
            "shirts",
        ),
        ex(
            "Each shirt in this line is made from organic cotton.",
            "這個系列的每件襯衫都用有機棉製成。",
            "shirt",
        ),
        ex(
            "Custom tee shirts sell well during summer festivals.",
            "夏季音樂祭期間客製化 T 恤賣得很好。",
            "shirts",
        ),
    ],
    ["blouses", "tops", "garments"],
    [],
    ["T-shirt", "button-down shirt", "dress shirt", "polo shirt"],
    domain="general",
)

# 5. leaders — plural noun
add(
    "leaders",
    ["noun"],
    {"plural": "leaders"},
    "n. 領袖；領導者（leader 的複數）",
    [
        ex(
            "World leaders convened in Geneva to sign the new climate pact.",
            "世界各國領袖齐聚日內瓦簽署新的氣候協定。",
            "leaders",
        ),
        ex(
            "A great leader listens before making decisions.",
            "一位傑出的領袖在做決定前會先傾聽。",
            "leader",
        ),
        ex(
            "The council elected new leaders for the upcoming term.",
            "委員會選出了下個任期的新領袖。",
            "leaders",
        ),
    ],
    ["chiefs", "heads", "directors"],
    ["followers", "subordinates"],
    ["industry leader", "team leader", "community leaders", "thought leader"],
    domain="general",
)

# 6. posters — plural noun
add(
    "posters",
    ["noun"],
    {"plural": "posters"},
    "n. 海報；張貼者（poster 的複數）",
    [
        ex(
            "Colorful posters advertise the festival along every station platform.",
            "色彩繽紛的海報在每個車站月台為這場音樂祭宣傳。",
            "posters",
        ),
        ex(
            "Each poster is printed on recycled paper for the campaign.",
            "為這次活動印製的每張海報都使用再生紙。",
            "poster",
        ),
        ex(
            "Frequent posters on the forum earn a verified badge.",
            "論壇上頻繁發文的張貼者可獲得認證徽章。",
            "posters",
        ),
    ],
    ["signs", "flyers", "bills"],
    [],
    ["poster session", "movie poster", "poster boy", "poster child"],
    domain="general",
)

# 7. institutions — plural noun
add(
    "institutions",
    ["noun"],
    {"plural": "institutions"},
    "n. 機構；制度；學術機關（institution 的複數）",
    [
        ex(
            "Many institutions updated their admission policies this year.",
            "許多機構今年更新了入學政策。",
            "institutions",
        ),
        ex(
            "Each institution in the consortium sets its own tuition fees.",
            "這個聯盟中的每個學術機關自行訂定學費。",
            "institution",
        ),
        ex(
            "Financial institutions face stricter regulation after the audit.",
            "在稽核之後，金融機構面臨更嚴格的監管。",
            "institutions",
        ),
    ],
    ["establishments", "organizations", "foundations"],
    [],
    ["financial institutions", "educational institutions", "institution of higher learning", "institutionalize"],
    domain="general",
)

# 8. ave — abbreviation of avenue; can be proper (neighborhood name)
add(
    "ave",
    ["noun"],
    {"plural": "aves"},
    "n. 大道（avenue 的縮寫，常用於地址）",
    [
        ex(
            "Corner of 5th Ave and Main Street in downtown Manhattan.",
            "位於曼哈頓市中心第五大道與主街的轉角。",
            "Ave",
        ),
        ex(
            "Many residential aves are lined with sycamore trees.",
            "許多住宅大道兩旁種滿了懸鈴木。",
            "aves",
        ),
        ex(
            "Drop me at the bus stop on Pennsylvania Ave by 10 PM.",
            "晚上十點前請把我放賓州大道的公車站。",
            "Ave",
        ),
    ],
    ["avenue", "boulevard", "street"],
    [],
    ["Fifth Ave", "Pennsylvania Ave", "Madison Ave", "Fifth Avenue"],
    domain="general",
)

# 9. headlines — plural noun + 3rd-person verb
add(
    "headlines",
    ["noun", "verb"],
    {"plural": "headlines", "present_3rd": "headlines", "past": "headlined", "past_participle": "headlined", "ing": "headlining"},
    "n. 新聞標題；頭條（headline 的複數）  v. 擔任主角；登上頭條",
    [
        ex(
            "Morning headlines summarized the central bank's rate decision.",
            "早晨的頭條新聞總結了央行的利率決定。",
            "headlines",
        ),
        ex(
            "A single headline can shape public opinion overnight.",
            "一則新聞標題能在短時間內影響輿論。",
            "headline",
        ),
        ex(
            "The pop star headlines the stadium tour this summer.",
            "這位流行巨星今夏領銜主演體育館巡演。",
            "headlines",
        ),
    ],
    ["titles", "top stories", "feature"],
    [],
    ["grab headlines", "make headlines", "headline news", "headline act"],
    domain="media",
)

# 10. compared — past of compare (verb)
add(
    "compared",
    ["verb"],
    {"past": "compared", "past_participle": "compared", "ing": "comparing", "present_3rd": "compares", "plural": ""},
    "v. 比較；對照；比喻（compare 的過去式與過去分詞）",
    [
        ex(
            "Analysts compared this quarter's margins to last year's results.",
            "分析師將本季的毛利率與去年同期相比。",
            "compared",
        ),
        ex(
            "Compared to offline stores, online retailers saw faster growth.",
            "與實體店面相比，線上零售商成長較快。",
            "Compared",
        ),
        ex(
            "Scientists are comparing different alloys for battery stability.",
            "科學家正在比較不同的合金，以提升電池穩定性。",
            "comparing",
        ),
    ],
    ["contrasted", "evaluated", "matched"],
    ["(no direct antonym)"],
    ["compared to", "compared with", "compare notes", "no comparison"],
    domain="general",
)


data = {
    "cefr": CEFR,
    "level": LEVEL,
    "tier": TIER,
    "words": words,
}

path = f"data/levels/{TIER}/{LEVEL}.json"
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Wrote {len(words)} words to {path}")
for w in words:
    forms = [e["highlight"][0] for e in w["examples"]]
    print(f"  {w['word']:14s} ex={len(w['examples'])} highlights={forms}")
