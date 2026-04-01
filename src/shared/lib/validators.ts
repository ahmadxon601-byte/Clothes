export const validators = {
    required: (value: string) => value.trim().length > 0,
    minLength: (min: number) => (value: string) => value.trim().length >= min,
    isCoordinate: (value: string) => !isNaN(parseFloat(value)),
};

export type PasswordValidationIssue = 'min_length' | 'lowercase' | 'uppercase' | 'number';

export function getPasswordValidationIssue(password: string): PasswordValidationIssue | null {
    if (password.length < 8) return 'min_length';
    if (!/[a-z]/.test(password)) return 'lowercase';
    if (!/[A-Z]/.test(password)) return 'uppercase';
    if (!/[0-9]/.test(password)) return 'number';
    return null;
}

export function isStrongPassword(password: string): boolean {
    return getPasswordValidationIssue(password) === null;
}
