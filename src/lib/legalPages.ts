export type LegalPageRow = {
  label: string;
  value: string;
};

export type LegalPageSection = {
  title: string;
  rows: LegalPageRow[];
};

export type LegalPage = {
  description: string;
  href: string;
  reviewStatus: "弁護士レビュー中";
  sections: LegalPageSection[];
  title: string;
};

export const LEGAL_PLACEHOLDER_VALUE = "弁護士レビュー後に掲載予定";

export const legalFooterLinks = [
  { href: "/legal/tokushoho", label: "特定商取引法に基づく表記" },
  { href: "/legal/prepaid", label: "資金決済法に基づく表示" },
  { href: "/legal/terms", label: "利用規約" },
] as const;

export const legalPages: LegalPage[] = [
  {
    description:
      "購入前に確認できるよう、通販表示に必要な項目構造だけを先行配置しています。",
    href: "/legal/tokushoho",
    reviewStatus: "弁護士レビュー中",
    title: "特定商取引法に基づく表記",
    sections: [
      {
        title: "事業者情報",
        rows: [
          { label: "販売事業者", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "運営責任者", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "所在地", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "連絡先", value: LEGAL_PLACEHOLDER_VALUE },
        ],
      },
      {
        title: "販売条件",
        rows: [
          { label: "販売価格", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "商品代金以外の必要料金", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "支払方法", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "商品の提供時期", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "返品・キャンセル", value: LEGAL_PLACEHOLDER_VALUE },
        ],
      },
    ],
  },
  {
    description:
      "ルーン残高と利用条件を購入前に確認できるよう、表示項目だけを先行配置しています。",
    href: "/legal/prepaid",
    reviewStatus: "弁護士レビュー中",
    title: "資金決済法に基づく表示",
    sections: [
      {
        title: "発行者と利用範囲",
        rows: [
          { label: "発行者", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "支払可能金額等", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "使用範囲", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "有効期限", value: LEGAL_PLACEHOLDER_VALUE },
        ],
      },
      {
        title: "残高と払戻し",
        rows: [
          { label: "未使用残高の確認方法", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "利用規約", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "払戻し", value: LEGAL_PLACEHOLDER_VALUE },
        ],
      },
    ],
  },
  {
    description:
      "課金関連条項を確認できるよう、利用規約の項目構造だけを先行配置しています。",
    href: "/legal/terms",
    reviewStatus: "弁護士レビュー中",
    title: "利用規約",
    sections: [
      {
        title: "課金関連条項",
        rows: [
          { label: "ルーンの利用条件", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "払戻し", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "退会時の扱い", value: LEGAL_PLACEHOLDER_VALUE },
          { label: "未成年の利用", value: LEGAL_PLACEHOLDER_VALUE },
        ],
      },
    ],
  },
];

export function getLegalPage(href: string): LegalPage {
  const page = legalPages.find((item) => item.href === href);
  if (!page) throw new Error(`Unknown legal page: ${href}`);
  return page;
}
