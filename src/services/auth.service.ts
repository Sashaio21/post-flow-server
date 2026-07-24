import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { generateToken } from "../utils/jwt";

const SALT_ROUNDS = 10; // сложность хеширования — чем больше, тем медленнее и надёжнее

export const authService = {

    // Хеширует пароль перед сохранением — никогда не храним пароль как есть
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    },

    // ======================
    // РЕГИСТРАЦИЯ
    // ======================
    async register(email: string, password: string) {
        // Проверяем, не занят ли email — до хеширования, чтобы не тратить время впустую
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error("EMAIL_TAKEN");
        }

        const passwordHash = await this.hashPassword(password);

        const user = await prisma.user.create({
            data: { email, passwordHash }
        });

        const token = generateToken({ id: user.id, email: user.email });
        return { user, token };
    }

};