export type InventoryItem = {
    itemId: string;
    name: string;
    description: string;
    iconEmoji: string;
    assetUrl?: string | null;
    category: 'EVOLUTION' | 'SOUL_PACK';
    quantity: number;
};

export type ListInventoryResponse = {
    items: InventoryItem[];
};

export type UseItemResponse = {
    attribute: string;
    soulsAdded: number;
    soulsAfter: number;
};
