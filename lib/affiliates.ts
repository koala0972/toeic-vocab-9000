/**
 * Affiliate recommendations — 8 real brands, Impact-style tracking links.
 * Updated 2026-07-27: upgraded from short links to Impact platform links.
 *
 * - `url`         : Impact click tracker (twshop4coupon/affclkr/tlcafftrax...)
 * - `impressionUrl`: vbtrax imp pixel (5 of 8 have this; null for the rest)
 * - `image`       : Brand logo hosted locally (og:image / favicon fallback)
 */
export type AffiliateSku = {
  id: string;
  title: string;
  /** Logo 圖 (本地 PNG, /affiliates/<id>.png) */
  image: string;
  /** Impact 點擊追蹤連結. 含 subId1/2 cookie 歸因. */
  url: string;
  /** vbtrax 印象追蹤 URL. Modal 開啟會植入 <img> 來累積曝光. 沒有則 null. */
  impressionUrl: string | null;
  /** SEO/aria 長文字 */
  aria: string;
};

export const AFFILIATE_SKUS: readonly AffiliateSku[] = [
  {
    id: 'ivy-bar',
    title: 'iVY BAR 學英文吧',
    image: '/affiliates/ivy-bar.png',
    url: 'https://tlcafftrax.com/track/clicks/8567/c627c2bc9b0527d7fd8bec23d62e9b47266f4ddf2aabebfc0266b513234652eed671a3ea103a9e71',
    impressionUrl: null,
    aria: 'iVY BAR 學英文吧 — 帶你走向世界',
  },
  {
    id: 'jiantan',
    title: '巨匠美語',
    image: '/affiliates/jiantan.png',
    url: 'https://affclkr.online/track/clicks/8172/c627c2bc9b0527d7fd89ec36d32e9d43276c4fdf24bbebf00563b205715b19e3c836a6e5423c9929398ffb9f45a77cbc87?t=https%3A%2F%2Fwww.soeasyedu.com.tw%2Fsoeasy%2Factivity%2F2019%2F201910-English-and-Japanese-learning-subsidy%2Findex.html%3Fpid%3Daffiliates%26id%3D-aff_id-%26id2%3D-transaction_id-%26utm_medium%3Daffiliates-one%26utm_source%3Daffiliate%26utm_campaign%3D201910-English-and-Japanese-learning-subsidy%26fromto%3D99144002',
    impressionUrl: null,
    aria: '巨匠美語成人英文課程推薦, 全台37間分校',
  },
  {
    id: '51talk',
    title: '51Talk',
    image: '/affiliates/51talk.png',
    url: 'https://affclkr.com/track/clicks/7352/c627c2bc9b0527d7fd8eec2bd32e9e4d206b4fc863bcb0f90362b105671200a8cd30a2e2566e9f663499abdb4aee7abb970d?t=https%3A%2F%2Fwap.51talk.com%2Flanding%2Faffiliate_1vs1_01.html',
    impressionUrl: 'https://vbtrax.com/track/imp/img/185421/c627c2bc9b0527d7fd8eec2bd32e9e4d206b4fc863bcb0f90362b105671200a8cd30a2e2566e9d2634ddffd81d',
    aria: '51Talk 兒童線上英文, 讓孩子愛上說英文',
  },
  {
    id: 'oikid',
    title: 'OiKID',
    image: '/affiliates/oikid.png',
    url: 'https://affckr.site/track/clicks/7331/c627c2bc9b0527d7fd8cec2bd32e9e4d2c694ec063bcb0f90362b105671200a8cd30a2e4556e9f663499abdb4aee7abb970d?t=https%3A%2F%2Fwww.oikid.com%2Fpromote%2Fcampaign-Aff%2F3Futm_source%3Daffiliates%26utm_medium%3Dcpc%26utm_campaign%3Doikid_04',
    impressionUrl: 'https://vbtrax.com/track/imp/img/189639/c627c2bc9b0527d7fd8cec2bd32e9e4d2c694ec063bcb0f90362b105671200a8cd30a2e4556e9d2634ddffd81d',
    aria: 'OiKID 提升孩童英語能力',
  },
  {
    id: 'voicetube',
    title: 'VoiceTube Vclass 名師課',
    image: '/affiliates/voicetube.png',
    url: 'https://affckr.site/track/clicks/7063/c627c2bc9b0527d7fd8dec23d62e9b47266f4ddf2aabebf30766b113234652eed671a3ea103a9e71',
    impressionUrl: null,
    aria: 'VoiceTube Vclass 名師課, 專業老師規劃的語言學習課程',
  },
  {
    id: 'yingdai',
    title: '英代外語',
    image: '/affiliates/yingdai.png',
    url: 'https://vbshoptrax.com/track/clicks/7099/c627c2bc9b0527d7fd82ec2bd32e9e41236f4ec063bcb0f90362b105671200a8cd30a1ee5d6e9f663499abdb4aee7abb970d',
    impressionUrl: 'https://vbtrax.com/track/imp/img/146039/c627c2bc9b0527d7fd82ec2bd32e9e41236f4ec063bcb0f90362b105671200a8cd30a1ee5d6e9d2634ddffd81d',
    aria: '英代外語, 挑戰多益700分, 一週只要888',
  },
  {
    id: 'd-plus',
    title: 'D+ Language Plus',
    image: '/affiliates/d-plus.png',
    url: 'https://affclk.site/track/clicks/9192/c627c2bc9b0527d7fd83ec2bd32e9d4520694ec163bcb0f90362b105671200a8cd3ea0ee566e9f663499abdb4aee7abb970d?t=https%3A%2F%2Fwww.dahhsinmedia.com%2Fproduct%2Fcindy-toeic-video%2F',
    impressionUrl: 'https://vbtrax.com/track/imp/img/205638/c627c2bc9b0527d7fd83ec2bd32e9d4520694ec163bcb0f90362b105671200a8cd3ea0ee566e9d2634ddffd81d',
    aria: 'D+ Language Plus 大新線上語言教育平台',
  },
  {
    id: 'preply',
    title: 'Preply',
    image: '/affiliates/preply.png',
    url: 'https://twshop4coupon.com/track/clicks/8282/c627c2bc9b0527d7fc8aec2bd32e9d44206844cc63bcb0f90362b105671200a8cd3fa3ef566e9f663499abdb4aee7abb970d?t=https%3A%2F%2Fpreply.sjv.io%2Fc%2F1231835%2F2037688%2F24422%3FsubId1%3D-aff_id-%26subId2%3D-transaction_id-%26sharedid%3D-aff_id-_-transaction_referer_domain-%26%3D-t-',
    impressionUrl: 'https://vbtrax.com/track/imp/img/215795/c627c2bc9b0527d7fc8aec2bd32e9d44206844cc63bcb0f90362b105671200a8cd3fa3ef566e9d2634ddffd81d',
    aria: 'Preply 線上英語學習, 首堂優惠',
  },
] as const;

export const AFFILIATE_THROTTLE_MS = 30 * 24 * 60 * 60 * 1000;
