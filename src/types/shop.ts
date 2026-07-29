export type ShopItemCurrency = 'GUILD_COIN' | 'RUNE';

export type ShopItem = {
    itemId: string;
    name: string;
    description: string;
    currency: ShopItemCurrency;
    price: number;
    category: 'EVOLUTION' | 'SOUL_PACK';
    iconEmoji: string;
    assetUrl?: string | null;
    /** 同じ商品の別バリエーションをまとめるキー（属性魂パックのみ）。 */
    variantGroup?: string | null;
    /** 属性（fire / water / ...）。属性魂パックのみ。 */
    attribute?: string | null;
    /** 属性の表示名（炎 / 水 / ...）。 */
    attributeLabel?: string | null;
    /** サイズ（s / m / l）。 */
    sizeSuffix?: string | null;
    /** サイズの表示名（小 / 中 / 大）。 */
    sizeLabel?: string | null;
};

export type ListShopResponse = {
    items: ShopItem[];
    guildCoinBalance: number;
    runeBalance: number;
};

export type PurchaseRequest = {
    itemId: string;
};

export type PurchaseResponse = {
    itemId: string;
    itemName: string;
    itemQuantity: number;
    guildCoinBalance: number;
    runeBalance: number;
    acquiredSkinId?: string | null;
};
