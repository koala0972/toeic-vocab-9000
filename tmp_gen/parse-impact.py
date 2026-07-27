#!/usr/bin/env python3
"""
Parse Impact-style affiliate HTML snippet from user-provided data.
Extract:
  - click URL: <a href='...'> 的 linktrack URL
  - impression img URL: <img src='...'> 的 vbtrax.com URL (若有)
  - brand name + (optional) deep-link t= param

輸出 lib/affiliates.ts 完整檔案 (寫死 URL, 不 env-overridable)
"""
import json
import urllib.parse

# 8 個品牌: (id, 品牌名, 點擊 URL, 印象追蹤 img URL 或 None)
BRANDS = [
    ('ivy-bar',    'iVY BAR 學英文吧',
     'https://tlcafftrax.com/track/clicks/8567/c627c2bc9b0527d7fd8bec23d62e9b47266f4ddf2aabebfc0266b513234652eed671a3ea103a9e71',
     None),
    ('jiantan',    '巨匠美語',
     'https://affclkr.online/track/clicks/8172/c627c2bc9b0527d7fd89ec36d32e9d43276c4fdf24bbebf00563b205715b19e3c836a6e5423c9929398ffb9f45a77cbc87?t=https%3A%2F%2Fwww.soeasyedu.com.tw%2Fsoeasy%2Factivity%2F2019%2F201910-English-and-Japanese-learning-subsidy%2Findex.html%3Fpid%3Daffiliates%26id%3D-aff_id-%26id2%3D-transaction_id-%26utm_medium%3Daffiliates-one%26utm_source%3Daffiliate%26utm_campaign%3D201910-English-and-Japanese-learning-subsidy%26fromto%3D99144002',
     None),
    ('51talk',     '51Talk',
     'https://affclkr.com/track/clicks/7352/c627c2bc9b0527d7fd8eec2bd32e9e4d206b4fc863bcb0f90362b105671200a8cd30a2e2566e9f663499abdb4aee7abb970d?t=https%3A%2F%2Fwap.51talk.com%2Flanding%2Faffiliate_1vs1_01.html',
     'https://vbtrax.com/track/imp/img/185421/c627c2bc9b0527d7fd8eec2bd32e9e4d206b4fc863bcb0f90362b105671200a8cd30a2e2566e9d2634ddffd81d'),
    ('oikid',      'OiKID',
     'https://affckr.site/track/clicks/7331/c627c2bc9b0527d7fd8cec2bd32e9e4d2c694ec063bcb0f90362b105671200a8cd30a2e4556e9f663499abdb4aee7abb970d?t=https%3A%2F%2Fwww.oikid.com%2Fpromote%2Fcampaign-Aff%2F3Futm_source%3Daffiliates%26utm_medium%3Dcpc%26utm_campaign%3Doikid_04',
     'https://vbtrax.com/track/imp/img/189639/c627c2bc9b0527d7fd8cec2bd32e9e4d2c694ec063bcb0f90362b105671200a8cd30a2e4556e9d2634ddffd81d'),
    ('voicetube',  'VoiceTube Vclass 名師課',
     'https://affckr.site/track/clicks/7063/c627c2bc9b0527d7fd8dec23d62e9b47266f4ddf2aabebf30766b113234652eed671a3ea103a9e71',
     None),
    ('yingdai',    '英代外語',
     'https://vbshoptrax.com/track/clicks/7099/c627c2bc9b0527d7fd82ec2bd32e9e41236f4ec063bcb0f90362b105671200a8cd30a1ee5d6e9f663499abdb4aee7abb970d',
     'https://vbtrax.com/track/imp/img/146039/c627c2bc9b0527d7fd82ec2bd32e9e41236f4ec063bcb0f90362b105671200a8cd30a1ee5d6e9d2634ddffd81d'),
    ('d-plus',     'D+ Language Plus',
     'https://affclk.site/track/clicks/9192/c627c2bc9b0527d7fd83ec2bd32e9d4520694ec163bcb0f90362b105671200a8cd3ea0ee566e9f663499abdb4aee7abb970d?t=https%3A%2F%2Fwww.dahhsinmedia.com%2Fproduct%2Fcindy-toeic-video%2F',
     'https://vbtrax.com/track/imp/img/205638/c627c2bc9b0527d7fd83ec2bd32e9d4520694ec163bcb0f90362b105671200a8cd3ea0ee566e9d2634ddffd81d'),
    ('preply',     'Preply',
     'https://twshop4coupon.com/track/clicks/8282/c627c2bc9b0527d7fc8aec2bd32e9d44206844cc63bcb0f90362b105671200a8cd3fa3ef566e9f663499abdb4aee7abb970d?t=https%3A%2F%2Fpreply.sjv.io%2Fc%2F1231835%2F2037688%2F24422%3FsubId1%3D-aff_id-%26subId2%3D-transaction_id-%26sharedid%3D-aff_id-_-transaction_referer_domain-%26%3D-t-',
     'https://vbtrax.com/track/imp/img/215795/c627c2bc9b0527d7fc8aec2bd32e9d44206844cc63bcb0f90362b105671200a8cd3fa3ef566e9d2634ddffd81d'),
]

# 看一下哪些 Impact URL 帶 t= deep link (real destination), parse 它
print('=== Impact URL 中的真實目的地 (t= 參數) ===')
for bid, name, click_url, imp_url in BRANDS:
    parsed = urllib.parse.urlsplit(click_url)
    qs = urllib.parse.parse_qs(parsed.query)
    dest = qs.get('t', [None])[0]
    print(f"  {bid:12s} | dest: {dest}")

print('\n=== 印象追蹤 URL (vbtrax) ===')
for bid, name, click_url, imp_url in BRANDS:
    print(f"  {bid:12s} | imp: {imp_url}")

# 寫 JSON 給下一個步驟用
out = [{
    'id': bid,
    'name': name,
    'click_url': click_url,
    'impression_url': imp_url,
    'image_path': f'/affiliates/{bid}.png',
} for bid, name, click_url, imp_url in BRANDS]
with open('tmp_gen/impact-affiliates.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print(f'\n=== 寫入 tmp_gen/impact-affiliates.json ({len(out)} 筆) ===')
