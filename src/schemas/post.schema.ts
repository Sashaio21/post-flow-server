import { z } from "zod";

// Держим в одном месте — совпадает с комментарием в schema.prisma
// (socialNetwork String // instagram | telegram | vk | x)
export const SOCIAL_NETWORKS = ["instagram", "telegram", "vk", "x"] as const;
export const POST_STATUSES = ["draft", "scheduled", "published"] as const;

const titleField = z
    .string({ error: "title обязателен и должен быть строкой" })
    .trim()
    .min(1, "title не может быть пустым")
    .max(300, "title слишком длинный (макс. 300 символов)");

const socialNetworkField = z.enum(SOCIAL_NETWORKS, {
    error: `socialNetwork должен быть одним из: ${SOCIAL_NETWORKS.join(", ")}`
});

// status клиент никогда не задаёт напрямую при создании (выставляется
// автоматически контроллером в зависимости от scheduledAt), поэтому в
// createPostSchema его нет вообще — лишнее поле будет просто отброшено.
const statusField = z.enum(POST_STATUSES, {
    error: `status должен быть одним из: ${POST_STATUSES.join(", ")}`
});

// scheduledAt приходит строкой (JSON), приводим к Date и проверяем, что дата валидна
const scheduledAtField = z.iso
    .datetime("scheduledAt должен быть в формате ISO-строки даты")
    .transform((val) => new Date(val))
    .nullable()
    .optional();

const tagsField = z.array(z.string().trim().min(1)).max(20, "Слишком много тегов").optional();

const imagesField = z
    .array(z.url("Каждое изображение должно быть валидным URL"))
    .max(10, "Слишком много изображений")
    .optional();

export const createPostSchema = z.object({
    title: titleField,
    socialNetwork: socialNetworkField,
    scheduledAt: scheduledAtField,
    tags: tagsField,
    images: imagesField
});

// PUT — полная замена, но по факту в контроллере частичная (Prisma игнорирует
// undefined). Оставляем все поля опциональными, как ведёт себя сам эндпоинт.
export const updatePostSchema = z.object({
    title: titleField.optional(),
    status: statusField.optional(),
    socialNetwork: socialNetworkField.optional(),
    scheduledAt: scheduledAtField,
    tags: tagsField,
    images: imagesField
});

// PATCH — то же самое, но контроллер уже сам проверяет "хотя бы одно поле
// передано" (400 при пустом теле) — здесь просто переиспользуем форму полей,
// проверку непустоты добавлять не нужно, дублировать логику контроллера незачем
export const patchPostSchema = updatePostSchema;

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PatchPostInput = z.infer<typeof patchPostSchema>;
