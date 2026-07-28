/**
 * Разовый скрипт миграции: шифрует accessToken/refreshToken у всех уже
 * существующих SocialConnection, сохранённых ДО того, как появилось шифрование.
 *
 * Идемпотентен — если запустить повторно, уже зашифрованные записи не
 * тронет (проверяет формат через isEncryptedFormat), так что случайно
 * зашифровать дважды не получится.
 *
 * Запуск:
 *   npx tsx scripts/encrypt-existing-tokens.ts
 *
 * Обязательно убедитесь, что в .env уже стоит ENCRYPTION_KEY —
 * без него скрипт сразу упадёт с понятной ошибкой.
 */
import { prisma } from "../src/config/prisma";
import { encrypt, isEncryptedFormat } from "../src/utils/crypto";

async function main() {
    const connections = await prisma.socialConnection.findMany();

    let updated = 0;
    let alreadyEncrypted = 0;

    for (const connection of connections) {
        const data: Record<string, string | null> = {};

        if (!isEncryptedFormat(connection.accessToken)) {
            data.accessToken = encrypt(connection.accessToken);
        }

        if (connection.refreshToken && !isEncryptedFormat(connection.refreshToken)) {
            data.refreshToken = encrypt(connection.refreshToken);
        }

        if (Object.keys(data).length > 0) {
            await prisma.socialConnection.update({ where: { id: connection.id }, data });
            updated++;
            console.log(`[OK] connection #${connection.id} (${connection.platform}/${connection.accountName}) — зашифровано`);
        } else {
            alreadyEncrypted++;
        }
    }

    console.log(`\nГотово. Обновлено: ${updated}. Уже были зашифрованы: ${alreadyEncrypted}. Всего: ${connections.length}.`);
}

main()
    .catch((err) => {
        console.error("Ошибка миграции:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
