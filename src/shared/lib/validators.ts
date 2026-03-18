export const validators = {
    required: (value: string) => value.trim().length > 0,
    minLength: (min: number) => (value: string) => value.trim().length >= min,
    isCoordinate: (value: string) => !isNaN(parseFloat(value)),
};
