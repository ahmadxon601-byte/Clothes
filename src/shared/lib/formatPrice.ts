export function formatPrice(price: number, currency: string = 'UZS', language: 'uz' | 'ru' | 'en' = 'uz'): string {
    if (currency === 'UZS') {
        const locale =
            language === 'ru' ? 'ru-RU'
                : language === 'en' ? 'en-US'
                    : 'uz-UZ';
        const amount = new Intl.NumberFormat(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
        const unit = language === 'ru' ? 'сум' : language === 'en' ? 'UZS' : "so'm";
        return `${amount} ${unit}`;
    }

    const locale =
        language === 'ru' ? 'ru-RU'
            : language === 'en' ? 'en-US'
                : 'uz-UZ';

    const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return formatter.format(price);
}
