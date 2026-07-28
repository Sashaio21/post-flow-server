import { Router } from "express";
import { register, verify, login, logout, getMe } from "../controllers/user.controller";
import { authLimiter, registerLimiter } from "../middleware/rate-limit.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { registerSchema, verifySchema, loginSchema } from "../schemas/user.schema";

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
router.post("/users/register", registerLimiter, validate(registerSchema), register);

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
router.post("/users/verify", authLimiter, validate(verifySchema), verify);

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
router.post("/users/login", authLimiter, validate(loginSchema), login);

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Выйти — очистить cookie с токеном
 *     tags: [Users]
 *     responses:
 *       200: { description: Выход выполнен }
 */
router.post("/users/logout", logout);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Данные текущего авторизованного пользователя
 *     tags: [Users]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200:
 *         description: Пользователь
 *       401:
 *         description: Токен не передан/невалиден
 */
router.get("/users/me", authMiddleware, getMe);

export default router;
