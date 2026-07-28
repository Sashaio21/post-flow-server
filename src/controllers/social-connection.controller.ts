import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { encrypt } from "../utils/crypto";

// Убираем чувствительные поля из ответа — та же логика, что и с passwordHash у User.
// Токены не должны улетать обратно клиенту после того, как один раз сохранены.
function toSafeConnection(connection: any) {
    const { accessToken, refreshToken, ...safe } = connection;
    return {
        ...safe,
        hasAccessToken: Boolean(accessToken),
        hasRefreshToken: Boolean(refreshToken)
    };
}

// ======================
// GET ALL
// ======================
export async function getAllConnections(req: Request, res: Response) {
    const connections = await prisma.socialConnection.findMany({
        where: { ownerId: req.user!.id },
        orderBy: { createdAt: "desc" }
    });

    res.json(connections.map(toSafeConnection));
}

// ======================
// GET ONE
// ======================
export async function getConnectionById(req: Request, res: Response) {
    const id = Number(req.params.id);

    const connection = await prisma.socialConnection.findUnique({ where: { id } });
    if (!connection) {
        return res.status(404).json({ message: "Подключение не найдено" });
    }
    if (connection.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Это не ваше подключение" });
    }

    res.json(toSafeConnection(connection));
}

// ======================
// CREATE
// ======================
export async function createConnection(req: Request, res: Response) {
    const { platform, accessToken, refreshToken, expiresAt, accountName, metadata } = req.body;

    const connection = await prisma.socialConnection.create({
        data: {
            platform,
            accessToken: encrypt(accessToken),
            refreshToken: refreshToken ? encrypt(refreshToken) : null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            accountName,
            metadata: metadata || undefined,
            ownerId: req.user!.id // не из тела запроса — из токена
        }
    });

    res.status(201).json(toSafeConnection(connection));
}

// ======================
// PATCH (частичное обновление)
// ======================
export async function patchConnection(req: Request, res: Response) {
    const id = Number(req.params.id);

    const connection = await prisma.socialConnection.findUnique({ where: { id } });
    if (!connection) {
        return res.status(404).json({ message: "Подключение не найдено" });
    }
    if (connection.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Это не ваше подключение" });
    }

    const data: Record<string, any> = {};
    if (req.body.accessToken !== undefined) data.accessToken = encrypt(req.body.accessToken);
    if (req.body.refreshToken !== undefined) {
        data.refreshToken = req.body.refreshToken ? encrypt(req.body.refreshToken) : null;
    }
    if (req.body.expiresAt !== undefined) data.expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    if (req.body.accountName !== undefined) data.accountName = req.body.accountName;
    if (req.body.metadata !== undefined) data.metadata = req.body.metadata;

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: "Нужно передать хотя бы одно поле для изменения" });
    }

    const updated = await prisma.socialConnection.update({ where: { id }, data });
    res.json(toSafeConnection(updated));
}

// ======================
// DELETE
// ======================
export async function deleteConnection(req: Request, res: Response) {
    const id = Number(req.params.id);

    const connection = await prisma.socialConnection.findUnique({ where: { id } });
    if (!connection) {
        return res.status(404).json({ message: "Подключение не найдено" });
    }
    if (connection.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Это не ваше подключение" });
    }

    await prisma.socialConnection.delete({ where: { id } });
    res.json({ message: "Подключение удалено" });
}