import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { getAllPosts, getPostById, createPost, updatePost, patchPost,deletePost } from "../controllers/post.controller";
import { validate } from "../middleware/validate.middleware";
import { createPostSchema, updatePostSchema, patchPostSchema } from "../schemas/post.schema";

const router = Router();

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Получить список своих постов
 *     tags: [Posts]
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       200: { description: Список постов }
 *       401: { description: Токен не передан или недействителен }
 */
router.get("/posts", authMiddleware, getAllPosts);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Получить один пост по id
 *     tags: [Posts]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200: { description: Пост найден }
 *       403: { description: Пост принадлежит другому пользователю }
 *       404: { description: Пост не найден }
 */
router.get("/posts/:id", authMiddleware, getPostById);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Создать пост
 *     tags: [Posts]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, socialNetwork]
 *             properties:
 *               title: { type: string }
 *               socialNetwork: { type: string }
 *               scheduledAt: { type: string, format: date-time, nullable: true }
 *               tags: { type: array, items: { type: string } }
 *               images: { type: array, items: { type: string } }
 *     responses:
 *       201: { description: Пост создан }
 *       400: { description: Не переданы обязательные поля }
 */
router.post("/posts", authMiddleware, validate(createPostSchema), createPost);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Обновить пост
 *     tags: [Posts]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Новый заголовок поста
 *               status:
 *                 type: string
 *                 example: draft
 *               socialNetwork:
 *                 type: string
 *                 example: instagram
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-01T10:00:00.000Z"
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["новости", "акция"]
 *               images:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["https://example.com/image1.jpg"]
 *     responses:
 *       200: { description: Пост обновлён }
 *       403: { description: Пост принадлежит другому пользователю }
 *       404: { description: Пост не найден }
 */
router.put("/posts/:id", authMiddleware, validate(updatePostSchema), updatePost);





/**
 * @swagger
 * /api/posts/{id}:
 *   patch:
 *     summary: Частично обновить пост (только переданные поля)
 *     tags: [Posts]
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
 *               title: { type: string }
 *               status: { type: string, example: published }
 *               socialNetwork: { type: string }
 *               scheduledAt: { type: string, format: date-time, nullable: true }
 *               tags: { type: array, items: { type: string } }
 *               images: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Пост обновлён }
 *       400: { description: Не передано ни одного поля }
 *       403: { description: Пост принадлежит другому пользователю }
 *       404: { description: Пост не найден }
 */
router.patch("/posts/:id", authMiddleware, validate(patchPostSchema), patchPost);


/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Удалить пост
 *     tags: [Posts]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200: { description: Пост удалён }
 *       403: { description: Пост принадлежит другому пользователю }
 *       404: { description: Пост не найден }
 */
router.delete("/posts/:id", authMiddleware, deletePost);

export default router;