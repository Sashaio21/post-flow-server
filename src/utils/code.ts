// Генерирует случайный 6-значный код, например "042817"
export function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}