"""Generator for Level 401 refined JSON."""
import json
import os

data = {
    "cefr": "B2",
    "level": 401,
    "tier": "intermediate",
    "words": [
        {
            "id": "B2-401-001",
            "level": 401,
            "tier": "intermediate",
            "cefr": "B2",
            "toeic_score_min": 750,
            "word": "indian",
            "pos": ["noun", "adjective"],
            "conjugations": {
                "plural": "indians"
            },
            "domain": "general",
            "translations": [
                {
                    "lang": "zh-TW",
                    "lang_word": "indian",
                    "definition": "n. 印度人、印第安人  a. 印度的、印第安人的"
                }
            ],
            "examples": [
                {
                    "en": "The Indian government has eased foreign investment rules in its technology sector.",
                    "highlight": ["Indian"],
                    "translations": {"zh-TW": "印度政府已放寬其科技業的外國投資規範。"}
                },
                {
                    "en": "Many Indians living abroad send remittances home during the Diwali festival season.",
                    "highlight": ["Indians"],
                    "translations": {"zh-TW": "許多旅居海外的印度人會在排燈節期間，將匯款寄回國內。"}
                },
                {
                    "en": "The regional office in Bangalore is staffed almost entirely by Indian software engineers.",
                    "highlight": ["Indian"],
                    "translations": {"zh-TW": "班加羅爾的分公司幾乎全部由印度的軟體工程師組成。"}
                }
            ],
            "synonyms": ["Indian subcontinent"],
            "antonyms": ["non-Indian"],
            "phrases": ["Indian market", "Indian rupee", "Indian Ocean", "Indian cuisine"]
        },
        {
            "id": "B2-401-002",
            "level": 401,
            "tier": "intermediate",
            "cefr": "B2",
            "toeic_score_min": 750,
            "word": "voter",
            "pos": ["noun"],
            "conjugations": {
                "plural": "voters"
            },
            "domain": "general",
            "translations": [
                {
                    "lang": "zh-TW",
                    "lang_word": "voter",
                    "definition": "n. 選民、投票人"
                }
            ],
            "examples": [
                {
                    "en": "Each voter must present a government-issued ID before casting a ballot at the polling station.",
                    "highlight": ["voter"],
                    "translations": {"zh-TW": "每位選民在投票所投票前，都必須出示政府核發的身分證件。"}
                },
                {
                    "en": "Older voters tend to participate in elections at a higher rate than younger cohorts.",
                    "highlight": ["voters"],
                    "translations": {"zh-TW": "年長選民的參與投票比率，通常高於年輕族群。"}
                },
                {
                    "en": "The survey found that a typical undecided voter switches preference at least twice before election day.",
                    "highlight": ["voter"],
                    "translations": {"zh-TW": "調查發現，典型的未決定選民在投票日前至少會改變意向兩次。"}
                }
            ],
            "synonyms": ["elector", "constituent"],
            "antonyms": ["nonvoter"],
            "phrases": ["registered voter", "swing voter", "voter turnout", "voter registration"]
        },
        {
            "id": "B2-401-003",
            "level": 401,
            "tier": "intermediate",
            "cefr": "B2",
            "toeic_score_min": 750,
            "word": "democracy",
            "pos": ["noun"],
            "conjugations": {
                "plural": "democracies"
            },
            "domain": "general",
            "translations": [
                {
                    "lang": "zh-TW",
                    "lang_word": "democracy",
                    "definition": "n. 民主政治、民主制度"
                }
            ],
            "examples": [
                {
                    "en": "A free press is often described as the cornerstone of any functioning democracy.",
                    "highlight": ["democracy"],
                    "translations": {"zh-TW": "新聞自由常被形容為任何運作良好的民主制度的基石。"}
                },
                {
                    "en": "Several emerging democracies in the region have rewritten their constitutions in the past decade.",
                    "highlight": ["democracies"],
                    "translations": {"zh-TW": "該區域內幾個新興的民主國家，在過去十年中都已重寫憲法。"}
                },
                {
                    "en": "The keynote speaker argued that democracy requires both active citizenship and rule of law.",
                    "highlight": ["democracy"],
                    "translations": {"zh-TW": "專題演講者主張，民主政治需要積極的公民參與以及法治兩者兼備。"}
                }
            ],
            "synonyms": ["republic", "self-government"],
            "antonyms": ["autocracy", "dictatorship"],
            "phrases": ["liberal democracy", "participatory democracy", "democracy index", "direct democracy"]
        },
        {
            "id": "B2-401-004",
            "level": 401,
            "tier": "intermediate",
            "cefr": "B2",
            "toeic_score_min": 750,
            "word": "theater",
            "pos": ["noun"],
            "conjugations": {
                "plural": "theaters"
            },
            "domain": "general",
            "translations": [
                {
                    "lang": "zh-TW",
                    "lang_word": "theater",
                    "definition": "n. 劇院、電影院、戲劇"
                }
            ],
            "examples": [
                {
                    "en": "A grand new theater opened downtown, with seating for two thousand guests and a digital sound system.",
                    "highlight": ["theater"],
                    "translations": {"zh-TW": "市中心新開了一家宏偉的劇院，可容納兩千名觀眾，並配備數位音響系統。"}
                },
                {
                    "en": "Outdoor theaters reported record attendance during the summer season, despite the heat wave.",
                    "highlight": ["theaters"],
                    "translations": {"zh-TW": "夏季期間，戶外劇場的入場人次創下紀錄，儘管當時正逢熱浪。"}
                },
                {
                    "en": "She works as the marketing director of a film theater chain with thirty branches across the country.",
                    "highlight": ["theater"],
                    "translations": {"zh-TW": "她擔任一家在全國擁有三十個分店的電影院連鎖的行銷總監。"}
                }
            ],
            "synonyms": ["cinema", "playhouse", "auditorium"],
            "antonyms": [],
            "phrases": ["movie theater", "theater district", "theater production", "operating theater"]
        },
        {
            "id": "B2-401-005",
            "level": 401,
            "tier": "intermediate",
            "cefr": "B2",
            "toeic_score_min": 750,
            "word": "lots",
            "pos": ["noun"],
            "conjugations": {
                "plural": "lots"
            },
            "domain": "general",
            "translations": [
                {
                    "lang": "zh-TW",
                    "lang_word": "lots",
                    "definition": "n. 大量、許多（lot 的複數）"
                }
            ],
            "examples": [
                {
                    "en": "There are lots of meeting rooms available, but only three can host more than fifty attendees.",
                    "highlight": ["lots"],
                    "translations": {"zh-TW": "這裡有許多會議室可用，但只有三間能容納超過五十人。"}
                },
                {
                    "en": "We have produced lots of prototypes, yet only one passed the durability test.",
                    "highlight": ["lots"],
                    "translations": {"zh-TW": "我們製作了大量原型，卻只有一個通過了耐久性測試。"}
                },
                {
                    "en": "Investors expressed lots of concerns about the company's reliance on a single supplier.",
                    "highlight": ["lots"],
                    "translations": {"zh-TW": "投資人對該公司僅依賴單一供應商表達了許多擔憂。"}
                }
            ],
            "synonyms": ["many", "plenty", "heaps"],
            "antonyms": ["few", "scarce"],
            "phrases": ["lots of", "lots and lots", "parking lot", "job lot"]
        },
        {
            "id": "B2-401-006",
            "level": 401,
            "tier": "intermediate",
            "cefr": "B2",
            "toeic_score_min": 750,
            "word": "nod",
            "pos": ["noun", "verb"],
            "conjugations": {
                "plural": "nods",
                "present_3rd": "nods",
                "past": "nodded",
                "past_participle": "nodded",
                "ing": "nodding"
            },
            "domain": "general",
            "translations": [
                {
                    "lang": "zh-TW",
                    "lang_word": "nod",
                    "definition": "n. 點頭、打盹  v. 點頭表示、打盹"
                }
            ],
            "examples": [
                {
                    "en": "With a quick nod, the manager signaled approval of the revised proposal.",
                    "highlight": ["nod"],
                    "translations": {"zh-TW": "經理快速點頭，示意批准修改後的提案。"}
                },
                {
                    "en": "After two hours of presentations, several board members nodded off in their seats.",
                    "highlight": ["nodded"],
                    "translations": {"zh-TW": "經過兩小時的簡報後，幾位董事在座位上打起了瞌睡。"}
                },
                {
                    "en": "Nodding along during the speech, the CEO conveyed agreement with the keynote speaker's position.",
                    "highlight": ["nodding"],
                    "translations": {"zh-TW": "在演講過程中，執行長不斷點頭，傳達出與主講人立場一致的態度。"}
                }
            ],
            "synonyms": ["gesture", "bow", "doze"],
            "antonyms": ["shake"],
            "phrases": ["give a nod", "nod off", "nod of approval", "get the nod"]
        },
        {
            "id": "B2-401-007",
            "level": 401,
            "tier": "intermediate",
            "cefr": "B2",
            "toeic_score_min": 750,
            "word": "russian",
            "pos": ["noun", "adjective"],
            "conjugations": {
                "plural": "russians"
            },
            "domain": "general",
            "translations": [
                {
                    "lang": "zh-TW",
                    "lang_word": "russian",
                    "definition": "n. 俄羅斯人、俄語  a. 俄羅斯的、俄語的"
                }
            ],
            "examples": [
                {
                    "en": "The Russian delegation walked out of the trade summit after sanctions were announced.",
                    "highlight": ["Russian"],
                    "translations": {"zh-TW": "在制裁措施宣布後，俄羅斯代表團退出了這場貿易高峰會。"}
                },
                {
                    "en": "Negotiators drafted the contract in both English and Russian to avoid interpretation disputes.",
                    "highlight": ["Russian"],
                    "translations": {"zh-TW": "談判代表以英文和俄文雙語起草合約，以避免解釋上的爭議。"}
                },
                {
                    "en": "Sanctions have hit Russians in the export sector hardest, particularly those in energy.",
                    "highlight": ["Russians"],
                    "translations": {"zh-TW": "制裁措施對出口領域的俄羅斯人打擊最為嚴重，尤其是能源產業的從業人員。"}
                }
            ],
            "synonyms": ["Muscovite"],
            "antonyms": ["non-Russian"],
            "phrases": ["Russian ruble", "Russian language", "Russian market", "Russian economy"]
        },
        {
            "id": "B2-401-008",
            "level": 401,
            "tier": "intermediate",
            "cefr": "B2",
            "toeic_score_min": 750,
            "word": "greatest",
            "pos": ["adjective"],
            "conjugations": {
                "comparative": "greater",
                "superlative": "greatest"
            },
            "domain": "general",
            "translations": [
                {
                    "lang": "zh-TW",
                    "lang_word": "greatest",
                    "definition": "a. 最大的、最偉大的（great 的最高級）"
                }
            ],
            "examples": [
                {
                    "en": "Customer retention is one of the greatest challenges facing subscription-based businesses.",
                    "highlight": ["greatest"],
                    "translations": {"zh-TW": "客戶留存是訂閱制企業所面臨的最大挑戰之一。"}
                },
                {
                    "en": "The greatest risk to the project is not regulation but a shortage of qualified engineers.",
                    "highlight": ["greatest"],
                    "translations": {"zh-TW": "本專案最大的風險並非法規，而是合格工程師的短缺。"}
                },
                {
                    "en": "Among all candidates, she showed the greatest potential to lead the restructuring effort.",
                    "highlight": ["greatest"],
                    "translations": {"zh-TW": "在所有候選人當中，她展現出領導這次重組工作的最大潛力。"}
                }
            ],
            "synonyms": ["largest", "utmost", "supreme"],
            "antonyms": ["smallest", "least"],
            "phrases": ["greatest hits", "greatest concern", "greatest hits collection", "the greatest"]
        },
        {
            "id": "B2-401-009",
            "level": 401,
            "tier": "intermediate",
            "cefr": "B2",
            "toeic_score_min": 750,
            "word": "presidential",
            "pos": ["adjective"],
            "conjugations": {},
            "domain": "general",
            "translations": [
                {
                    "lang": "zh-TW",
                    "lang_word": "presidential",
                    "definition": "a. 總統的、總統制的"
                }
            ],
            "examples": [
                {
                    "en": "A presidential election typically dominates national news coverage for several months.",
                    "highlight": ["presidential"],
                    "translations": {"zh-TW": "總統選舉通常會主導全國新聞數月之久。"}
                },
                {
                    "en": "The presidential decree established a new ministry focused on digital infrastructure.",
                    "highlight": ["presidential"],
                    "translations": {"zh-TW": "這道總統政令設立了專責數位基礎建設的新部委。"}
                },
                {
                    "en": "Under the presidential system, the executive and the legislature are elected separately.",
                    "highlight": ["presidential"],
                    "translations": {"zh-TW": "在總統制之下，行政部門和立法部門是分別選舉產生的。"}
                }
            ],
            "synonyms": ["executive", "head-of-state"],
            "antonyms": ["parliamentary"],
            "phrases": ["presidential election", "presidential candidate", "presidential system", "presidential debate"]
        },
        {
            "id": "B2-401-010",
            "level": 401,
            "tier": "intermediate",
            "cefr": "B2",
            "toeic_score_min": 750,
            "word": "supreme",
            "pos": ["adjective"],
            "conjugations": {},
            "domain": "general",
            "translations": [
                {
                    "lang": "zh-TW",
                    "lang_word": "supreme",
                    "definition": "a. 至高的、最高的、極端的"
                }
            ],
            "examples": [
                {
                    "en": "The Supreme Court will hear arguments on the merger case next month.",
                    "highlight": ["Supreme"],
                    "translations": {"zh-TW": "最高法院將於下個月針對這起合併案進行言詞辯論。"}
                },
                {
                    "en": "Under the contract, the board holds supreme authority over all strategic decisions.",
                    "highlight": ["supreme"],
                    "translations": {"zh-TW": "根據該合約，董事會對所有策略性決策擁有最高權限。"}
                },
                {
                    "en": "The CEO made a supreme effort to keep the company private during the takeover battle.",
                    "highlight": ["supreme"],
                    "translations": {"zh-TW": "在這場收購戰中，執行長做出了極大的努力以維持公司的私有地位。"}
                }
            ],
            "synonyms": ["highest", "ultimate", "utmost"],
            "antonyms": ["lowest", "inferior"],
            "phrases": ["supreme court", "supreme authority", "supreme commander", "supreme power"]
        }
    ]
}

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(base, "data", "levels", "intermediate", "401.json")
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

with open(path, "r", encoding="utf-8") as f:
    v = json.load(f)
print("Written {} words to {}".format(len(v["words"]), path))
for w in v["words"]:
    print("  {:14s} ex={}  highlights={}".format(
        w["word"], len(w["examples"]),
        [e["highlight"] for e in w["examples"]]
    ))
