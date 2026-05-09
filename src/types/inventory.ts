export type InventoryItem = {
    itemId: string;
    name: string;
    description: string;
    iconEmoji: string;
    category: 'EVOLUTION';
    quantity: number;
};

export type ListInventoryResponse = {
    items: InventoryItem[];
};
