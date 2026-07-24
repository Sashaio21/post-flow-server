import { Router } from "express";
import { authService } from "../services/auth.service";

const router = Router();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Регистрация — отправляет код подтверждения на почту
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: ivan@gmail.com }
 *               password: { type: string, example: mypassword123 }
 *     responses:
 *       201: { description: Код отправлен на почту }
 *       409: { description: Email уже используется }
 */
router.post("/users/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "email и password обязательны" });
        }

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
});

/**
 * @swagger
 * /api/users/verify:
 *   post:
 *     summary: Подтвердить email кодом из письма
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: ivan@gmail.com }
 *               code: { type: string, example: "042817" }
 *     responses:
 *       200: { description: Email подтверждён, выдан токен }
 *       400: { description: Неверный или истёкший код }
 */
router.post("/users/verify", async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: "email и code обязательны" });
        }

        const { user, token } = await authService.verifyEmail(email, code);

        res.json({
            user: { id: user.id, email: user.email },
            token
        });
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
});

export default router;