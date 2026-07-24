import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { generateToken } from "../utils/jwt";
import { generateVerificationCode } from "../utils/code";
import { emailService } from "./email.service";

const SALT_ROUNDS = 10;
const CODE_LIFETIME_MS = 60 * 1000; // 1 минута

export const authService = {

    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    },

    // ======================
    // РЕГИСТРАЦИЯ
    // ======================
    // Теперь НЕ выдаёт токен сразу — только отправляет код на почту.
    // Токен появится только после verifyEmail()
    async register(email: string, password: string) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error("EMAIL_TAKEN");
        }

        const passwordHash = await this.hashPassword(password);
        const code = generateVerificationCode();

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                verificationCode: code,
                verificationCodeExpires: new Date(Date.now() + CODE_LIFETIME_MS),
            }
        });

        await emailService.sendVerificationCode(email, code);

        return { user }; // токена тут больше нет — только "мы создали аккаунт, проверьте почту"
    },

    // ======================
    // ПОДТВЕРЖДЕНИЕ EMAIL
    // ======================
    async verifyEmail(email: string, code: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        if (user.isVerified) {
            throw new Error("ALREADY_VERIFIED");
        }
        if (!user.verificationCode || user.verificationCode !== code) {
            throw new Error("INVALID_CODE");
        }
        if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
            throw new Error("CODE_EXPIRED");
        }

        const verifiedUser = await prisma.user.update({
            where: { email },
            data: {
                isVerified: true,
                verificationCode: null,          // код одноразовый — очищаем после использования
                verificationCodeExpires: null,
            }
        });

        // Только теперь выдаём настоящий токен доступа
        const token = generateToken({ id: verifiedUser.id, email: verifiedUser.email });
        return { user: verifiedUser, token };
    }

};