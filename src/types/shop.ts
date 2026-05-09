export type ShopItem = {
    itemId: string;
    name: string;
    description: string;
    currency: 'GUILD_COIN' | 'RUNE';
    price: number;
    category: 'EVOLUTION';
    iconEmoji: string;
};

export type ListShopResponse = {
    items: ShopItem[];
    guildCoinBalance: number;
};

export type PurchaseRequest = {
    itemId: string;
};

export type PurchaseResponse = {
    itemId: string;
    itemName: string;
    itemQuantity: number;
    guildCoinBalance: number;
};
