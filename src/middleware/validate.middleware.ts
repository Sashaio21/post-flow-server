import { Request, Response, NextFunction } from "express";
import { ZodType, z } from "zod";

type Source = "body" | "query" | "params";

/**
 * Универсальный middleware для валидации входных данных через Zod.
 *
 * Использование:
 *   router.post("/posts", authMiddleware, validate(createPostSchema), createPost);
 *
 * По умолчанию проверяет req.body (это покрывает 95% случаев в этом проекте).
 * При необходимости можно передать source: "query" | "params".
 *
 * Важно: middleware НЕ бросает исключение и не завершает процесс при
 * невалидных данных — это ожидаемая ситуация (клиент прислал что-то не то),
 * а не баг сервера, поэтому обрабатывается как обычный 400-ответ.
 */
export function validate(schema: ZodType, source: Source = "body") {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            // z.treeifyError / z.flattenError доступны в zod v4;
            // формируем плоский и понятный список ошибок для клиента
            const issues = result.error.issues.map((issue) => ({
                field: issue.path.join(".") || source,
                message: issue.message
            }));

            return res.status(400).json({
                message: "Некорректные данные запроса",
                errors: issues
            });
        }

        // Кладём провалидированные (и приведённые к нужным типам, например
        // Date вместо строки) данные обратно — контроллер получает уже чистые данные
        req[source] = result.data;
        next();
    };
}
