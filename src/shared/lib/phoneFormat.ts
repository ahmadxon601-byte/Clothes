const UZBEKISTAN_CODE = '998';
const UZBEKISTAN_LOCAL_LENGTH = 9;

function splitUzbekLocalNumber(digits: string) {
    const parts: string[] = [];
    const groups = [2, 3, 2, 2];
    let cursor = 0;

    for (const group of groups) {
        if (cursor >= digits.length) break;
        parts.push(digits.slice(cursor, cursor + group));
        cursor += group;
    }

    return parts.filter(Boolean);
}

export function normalizePhoneDigits(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 15);

    if (!digits) {
        return { countryCode: UZBEKISTAN_CODE, local: '' };
    }

    if (digits.startsWith(UZBEKISTAN_CODE)) {
        return {
            countryCode: UZBEKISTAN_CODE,
            local: digits.slice(UZBEKISTAN_CODE.length, UZBEKISTAN_CODE.length + UZBEKISTAN_LOCAL_LENGTH),
        };
    }

    if (digits.length === 12 && digits.startsWith('8')) {
        return {
            countryCode: UZBEKISTAN_CODE,
            local: digits.slice(3, 3 + UZBEKISTAN_LOCAL_LENGTH),
        };
    }

    if (digits.length > UZBEKISTAN_LOCAL_LENGTH) {
        return {
            countryCode: UZBEKISTAN_CODE,
            local: digits.slice(-UZBEKISTAN_LOCAL_LENGTH),
        };
    }

    return { countryCode: UZBEKISTAN_CODE, local: digits.slice(0, UZBEKISTAN_LOCAL_LENGTH) };
}

export function formatPhoneNumber(value: string) {
    const { countryCode, local } = normalizePhoneDigits(value);

    if (!local) {
        return `+${countryCode}`;
    }

    return [`+${countryCode}`, ...splitUzbekLocalNumber(local)].join(' ');
}

export function phoneHref(value: string) {
    const { countryCode, local } = normalizePhoneDigits(value);
    if (!local) return '';
    return `+${countryCode}${local}`;
}
