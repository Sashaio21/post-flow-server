import { Router } from "express";
import { authService } from "../services/auth.service";
import { setTokenCookie } from "../utils/cookie";

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
 *       200: { description: Email подтверждён, токен установлен в cookie }
 *       400: { description: Неверный или истёкший код }
 */
router.post("/users/verify", async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ message: "email и code обязательны" });
        }

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
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Вход
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@gmail.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: Токен установлен в cookie
 *       401:
 *         description: Неверный email или пароль
 *       403:
 *         description: Email не подтверждён
 */
router.post("/users/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "email и password обязательны" });
        }

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
});

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Выйти — очистить cookie с токеном
 *     tags: [Users]
 *     responses:
 *       200: { description: Выход выполнен }
 */
router.post("/users/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Выход выполнен" });
});

export default router;