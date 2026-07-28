import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
    getAllConnections,
    getConnectionById,
    createConnection,
    patchConnection,
    deleteConnection
} from "../controllers/social-connection.controller";
import { validate } from "../middleware/validate.middleware";
import { createConnectionSchema, patchConnectionSchema } from "../schemas/social-connection.schema";

const router = Router();

/**
 * @swagger
 * /api/social-connections:
 *   get:
 *     summary: Получить список своих подключённых соцсетей
 *     tags: [SocialConnections]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Список подключений }
 *       401: { description: Токен не передан или недействителен }
 */
router.get("/social-connections", authMiddleware, getAllConnections);

/**
 * @swagger
 * /api/social-connections/{id}:
 *   get:
 *     summary: Получить одно подключение
 *     tags: [SocialConnections]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200: { description: Подключение найдено }
 *       403: { description: Принадлежит другому пользователю }
 *       404: { description: Не найдено }
 */
router.get("/social-connections/:id", authMiddleware, getConnectionById);

/**
 * @swagger
 * /api/social-connections:
 *   post:
 *     summary: Подключить соцсеть
 *     tags: [SocialConnections]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [platform, accessToken, accountName]
 *             properties:
 *               platform: { type: string, example: telegram }
 *               accessToken: { type: string, example: "123456:ABC-DEF..." }
 *               refreshToken: { type: string, nullable: true }
 *               expiresAt: { type: string, format: date-time, nullable: true }
 *               accountName: { type: string, example: "@my_channel" }
 *               metadata:
 *                 type: object
 *                 example: { "chatId": "@my_channel", "botUsername": "postflow_bot" }
 *     responses:
 *       201: { description: Подключение создано }
 *       400: { description: Не переданы обязательные поля }
 */
router.post("/social-connections", authMiddleware, validate(createConnectionSchema), createConnection);

/**
 * @swagger
 * /api/social-connections/{id}:
 *   patch:
 *     summary: Частично обновить подключение
 *     tags: [SocialConnections]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken: { type: string }
 *               refreshToken: { type: string, nullable: true }
 *               expiresAt: { type: string, format: date-time, nullable: true }
 *               accountName: { type: string }
 *               metadata: { type: object }
 *     responses:
 *       200: { description: Подключение обновлено }
 *       400: { description: Не передано ни одного поля }
 *       403: { description: Принадлежит другому пользователю }
 *       404: { description: Не найдено }
 */
router.patch("/social-connections/:id", authMiddleware, validate(patchConnectionSchema), patchConnection);

/**
 * @swagger
 * /api/social-connections/{id}:
 *   delete:
 *     summary: Отключить соцсеть
 *     tags: [SocialConnections]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200: { description: Подключение удалено }
 *       403: { description: Принадлежит другому пользователю }
 *       404: { description: Не найдено }
 */
router.delete("/social-connections/:id", authMiddleware, deleteConnection);

export default router;