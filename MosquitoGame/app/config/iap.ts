// ═══════════════════════════════════════════════════════════════
// IN-APP PURCHASE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const IAP_PRODUCTS = {
    STARTER_PACK: 'mosquito.pack.starter',
    PRO_PACK: 'mosquito.pack.pro',
    MEGA_PACK: 'mosquito.pack.mega',
};

export const PACK_DETAILS = {
    [IAP_PRODUCTS.STARTER_PACK]: {
        id: IAP_PRODUCTS.STARTER_PACK,
        price: '$1.99',
        rewards: {
            noAds: true,
            items: {
                'item-racket': 5,
                'item-coil': 5,
            },
            skins: [],
        },
    },
    [IAP_PRODUCTS.PRO_PACK]: {
        id: IAP_PRODUCTS.PRO_PACK,
        price: '$3.99',
        rewards: {
            noAds: true,
            items: {
                'item-racket': 15,
                'item-coil': 15,
                'item-spray': 10,
            },
            skins: ['rednails'],
        },
    },
    [IAP_PRODUCTS.MEGA_PACK]: {
        id: IAP_PRODUCTS.MEGA_PACK,
        price: '$5.99',
        rewards: {
            noAds: true,
            items: {
                'item-racket': 30,
                'item-coil': 30,
                'item-spray': 20,
            },
            skins: ['rednails', 'tattoo'],
        },
    },
};
