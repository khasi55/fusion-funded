export const pricingConfig = {
    HFT2: {
        '2.5K': { price: '$29' },
        '5K': { price: '$49' },
        '10K': { price: '$99' },
        '25K': { price: '$159' },
        '50K': { price: '$299' },
        '100K': { price: '$559' },
    }
} as const;

export const getSizeKey = (size: number): string => {
    if (size >= 1000) {
        return `${size / 1000}K`;
    }
    return `${size}`;
};

export const getConfigKey = (type: string, model: string): keyof typeof pricingConfig | null => {
    return 'HFT2';
};
