import crypto from "crypto";

// AES-256-GCM: authenticated encryption — при подмене шифротекста (например,
// прямое редактирование записи в БД в обход API) decrypt() бросит ошибку,
// а не молча вернёт мусор
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // рекомендованная длина IV для GCM (12 байт)

// Формат хранимой строки: "iv:authTag:ciphertext", всё в hex, через двоеточие.
// Так одной строкой можно положить прямо в существующее поле String в БД —
// менять схему Prisma не нужно.
const ENCRYPTED_FORMAT = /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i;

function getKey(): Buffer {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) {
        throw new Error(
            "ENCRYPTION_KEY не задан в .env — без него нельзя шифровать/расшифровывать токены соцсетей"
        );
    }

    const key = Buffer.from(keyHex, "hex");
    if (key.length !== 32) {
        throw new Error(
            "ENCRYPTION_KEY должен быть 32 байтами в hex (64 символа). Сгенерировать: openssl rand -hex 32"
        );
    }

    return key;
}

/**
 * Шифрует строку (access/refresh токен соцсети) перед записью в БД.
 * Каждый вызов использует новый случайный IV, поэтому одинаковый токен
 * даёт разный шифротекст при каждом сохранении — это ожидаемо и нормально.
 */
export function encrypt(plainText: string): string {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Расшифровывает строку, сохранённую через encrypt(). Бросает исключение,
 * если формат не похож на зашифрованный (isEncryptedFormat === false) или
 * если authTag не совпал — то есть данные были повреждены/подменены.
 */
export function decrypt(payload: string): string {
    if (!isEncryptedFormat(payload)) {
        throw new Error("Переданное значение не похоже на зашифрованные данные");
    }

    const key = getKey();
    const [ivHex, authTagHex, dataHex] = payload.split(":");

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(dataHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
}

/**
 * Проверяет, похожа ли строка на формат encrypt() — используется миграционным
 * скриптом, чтобы не зашифровать уже зашифрованное значение повторно.
 */
export function isEncryptedFormat(value: string): boolean {
    return typeof value === "string" && ENCRYPTED_FORMAT.test(value);
}
