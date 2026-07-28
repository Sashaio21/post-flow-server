import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { setTokenCookie } from "../utils/cookie";

// ======================
// РЕГИСТРАЦИЯ
// ======================
export async function register(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        const { user } = await authService.register(email, password);

        res.status(201).json({
            message: "Код подтверждения отправлен на почту",
            email: user.email
        });
    } catch (err: any) {
        if (err.message === "EMAIL_TAKEN") {
            return res.status(409).json({ message: "Email уже используется" });
        }
        res.status(500).json({ message: "Ошибка сервера" });
    }
}

// ======================
// ПОДТВЕРЖДЕНИЕ EMAIL
// ======================
export async function verify(req: Request, res: Response) {
    try {
        const { email, code } = req.body;

        const { user, token } = await authService.verifyEmail(email, code);

        setTokenCookie(res, token);
        res.json({ user: { id: user.id, email: user.email } });
    } catch (err: any) {
        const messages: Record<string, string> = {
            USER_NOT_FOUND: "Пользователь не найден",
            ALREADY_VERIFIED: "Email уже подтверждён",
            INVALID_CODE: "Неверный код",
            CODE_EXPIRED: "Код истёк, запросите новый",
        };
        if (messages[err.message]) {
            return res.status(400).json({ message: messages[err.message] });
        }
        res.status(500).json({ message: "Ошибка сервера" });
    }
}

// ======================
// АВТОРИЗАЦИЯ
// ======================
export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        const { user, token } = await authService.login(email, password);

        setTokenCookie(res, token);
        res.json({ user: { id: user.id, email: user.email } });
    } catch (err: any) {
        if (err.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({ message: "Неверный email или пароль" });
        }
        if (err.message === "EMAIL_NOT_VERIFIED") {
            return res.status(403).json({ message: "Email не подтверждён. Проверьте почту." });
        }
        res.status(500).json({ message: "Ошибка сервера" });
    }
}

// ======================
// ВЫХОД
// ======================
export async function logout(req: Request, res: Response) {
    res.clearCookie("token");
    res.json({ message: "Выход выполнен" });
}

// ======================
// ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
// ======================
export async function getMe(req: Request, res: Response) {
    const { id, email } = req.user!;
    res.status(200).json({ user: { id, email } });
}
