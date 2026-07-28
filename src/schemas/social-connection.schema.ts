import { z } from "zod";

// Совпадает с комментарием в schema.prisma (platform String // telegram | instagram | threads)
export const PLATFORMS = ["telegram", "instagram", "threads"] as const;

const platformField = z.enum(PLATFORMS, {
    error: `platform должен быть одним из: ${PLATFORMS.join(", ")}`
});

// Токены — просто непустые строки. Не проверяем конкретный формат
// (у Telegram/Meta он разный и может меняться), важно только что это
// не пустая строка и не что-то откровенно не то (объект, число и т.д.)
const tokenField = z.string().trim().min(1, "Токен не может быть пустым");

const accountNameField = z
    .string({ error: "accountName обязателен и должен быть строкой" })
    .trim()
    .min(1, "accountName не может быть пустым")
    .max(200, "accountName слишком длинный");

const expiresAtField = z.iso
    .datetime("expiresAt должен быть в формате ISO-строки даты")
    .transform((val) => new Date(val))
    .nullable()
    .optional();

// metadata — свободная структура (специфична для платформы), проверяем
// только что это объект, а не строка/массив/число
const metadataField = z.record(z.string(), z.unknown()).optional();

export const createConnectionSchema = z.object({
    platform: platformField,
    accessToken: tokenField,
    refreshToken: tokenField.nullable().optional(),
    expiresAt: expiresAtField,
    accountName: accountNameField,
    metadata: metadataField
});

export const patchConnectionSchema = z
    .object({
        accessToken: tokenField.optional(),
        refreshToken: tokenField.nullable().optional(),
        expiresAt: expiresAtField,
        accountName: accountNameField.optional(),
        metadata: metadataField
    })
    // platform сознательно нельзя менять через PATCH — смена платформы
    // у существующего подключения не имеет смысла, для этого нужно
    // создавать новое подключение через POST.
    // .strict() заставит Zod вернуть ошибку "unrecognized key: platform",
    // если его всё же передадут в теле запроса
    .strict();

export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type PatchConnectionInput = z.infer<typeof patchConnectionSchema>;
