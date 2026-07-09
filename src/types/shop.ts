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
