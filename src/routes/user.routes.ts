import { Router } from "express";
import { prisma } from "../config/prisma";
import { authService } from "../services/auth.service";


// Router — «мини-приложение» Express, которое потом подключается
// в app.ts через app.use("/api", userRoutes)
const router = Router();



/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список пользователей
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Список пользователей
 */
router.get("/users", async (req, res) => {
    const users = await prisma.user.findMany(); // SELECT * FROM "User"
    res.json(users);
});




/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Создать пользователя
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ivan
 *               email:
 *                 type: string
 *                 example: ivan@gmail.com
 *     responses:
 *       201:
 *         description: Пользователь создан
 */
router.post("/users", async (req, res) => {
    // req.body доступен благодаря app.use(express.json()) в app.ts —
    // без него тело запроса пришло бы необработанной строкой
    const user = await prisma.user.create({
        data: {
            name: req.body.name,
            email: req.body.email
        }
    });
    res.status(201).json(user); // 201 = "создано", возвращаем созданную запись с id
});



// ======================
// РЕГИСТРАЦИЯ
// ======================

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Регистрация нового пользователя
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
 *       201:
 *         description: Пользователь создан, токен выдан
 *       409:
 *         description: Email уже используется
 */
router.post("/users/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Минимальная валидация — на будущее стоит заменить на Zod
        if (!email || !password) {
            return res.status(400).json({ message: "email и password обязательны" });
        }

        const { user, token } = await authService.register(email, password);

        // passwordHash никогда не возвращаем клиенту, даже в хешированном виде
        res.status(201).json({
            user: { id: user.id, email: user.email },
            token
        });
    } catch (err: any) {
        if (err.message === "EMAIL_TAKEN") {
            return res.status(409).json({ message: "Email уже используется" });
        }
        res.status(500).json({ message: "Ошибка сервера" });
    }
});






export default router;