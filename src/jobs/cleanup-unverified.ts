import { prisma } from "../config/prisma";

// Удаляет пользователей, которые не подтвердили email
// и у которых код подтверждения уже истёк
export async function cleanupUnverifiedUsers() {
    const result = await prisma.user.deleteMany({
        where: {
            isVerified: false,
            verificationCodeExpires: { lt: new Date() } // код истёк раньше текущего момента
        }
    });

    if (result.count > 0) {
        console.log(`Удалено неподтверждённых аккаунтов: ${result.count}`);
    }
}