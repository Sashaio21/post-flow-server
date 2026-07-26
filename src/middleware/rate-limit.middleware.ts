import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

const isEnabled = process.env.RATE_LIMIT_ENABLED !== "false";

// Если лимиты выключены — middleware просто пропускает запрос дальше,
// ничего не считая и не ограничивая
function passthroughMiddleware(req: Request, res: Response, next: NextFunction) {
    next();
}

const realAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Слишком много попыток, попробуйте позже" }
});

const realRegisterLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Слишком много попыток регистрации, попробуйте позже" }
});

// Экспортируем либо реальный лимитер, либо "пустышку" — в зависимости от .env
export const authLimiter = isEnabled ? realAuthLimiter : passthroughMiddleware;
export const registerLimiter = isEnabled ? realRegisterLimiter : passthroughMiddleware;