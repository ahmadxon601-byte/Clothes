export function formatPrice(price: number, currency: string = 'UZS'): string {
    const formatter = new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return formatter.format(price);
}
