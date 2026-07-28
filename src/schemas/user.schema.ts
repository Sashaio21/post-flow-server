import { z } from "zod";

// Приводим к нижнему регистру и обрезаем пробелы ДО проверки формата email —
// иначе "Ivan@Mail.ru " и "ivan@mail.ru" будут считаться разными пользователями
const normalizeEmail = (val: unknown) => (typeof val === "string" ? val.trim().toLowerCase() : val);

const emailField = z.preprocess(normalizeEmail, z.email("Некорректный email"));

const passwordField = z
    .string({ error: "password обязателен и должен быть строкой" })
    .min(8, "Пароль должен быть не короче 8 символов")
    .max(72, "Пароль слишком длинный"); // bcrypt всё равно обрежет/ошибётся после 72 байт

export const registerSchema = z.object({
    email: emailField,
    password: passwordField
});

export const verifySchema = z.object({
    email: emailField,
    code: z
        .string({ error: "code обязателен" })
        .length(6, "Код должен состоять из 6 цифр")
        .regex(/^\d{6}$/, "Код должен состоять только из цифр")
});

export const loginSchema = z.object({
    email: emailField,
    // При логине не проверяем сложность пароля (min(8) и т.п.) —
    // это уже существующий пользователь, регистрационные правила к нему не применимы.
    // Проверяем только то, что это вообще непустая строка.
    password: z.string({ error: "password обязателен" }).min(1, "password обязателен")
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
