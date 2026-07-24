import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/test-auth:
 *   get:
 *     summary: Проверить валидность токена
 *     description: Тестовый эндпоинт — просто возвращает данные из токена, если он верный. Существует только для проверки authMiddleware, не относится к бизнес-логике.
 *     tags:
 *       - Test
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Токен верный
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Токен верный
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 1 }
 *                     email: { type: string, example: ivan@gmail.com }
 *       401:
 *         description: Токен не передан или недействителен
 */
router.get("/test-auth", authMiddleware, (req, res) => {
    res.json({ message: "Токен верный", user: req.user });
});

export default router;