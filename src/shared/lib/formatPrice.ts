export function formatPrice(price: number, currency: string = 'UZS', language: 'uz' | 'ru' | 'en' = 'uz'): string {
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
