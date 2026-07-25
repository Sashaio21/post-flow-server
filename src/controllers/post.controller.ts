import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function getAllPosts(req: Request, res: Response) {
    const posts = await prisma.post.findMany({
        where: { authorId: req.user!.id },
        orderBy: { createdAt: "desc" }
    });
    res.json(posts);
}

export async function getPostById(req: Request, res: Response) {
    const id = Number(req.params.id);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
        return res.status(404).json({ message: "Пост не найден" });
    }
    if (post.authorId !== req.user!.id) {
        return res.status(403).json({ message: "Это не ваш пост" });
    }

    res.json(post);
}

export async function createPost(req: Request, res: Response) {
    const { title, socialNetwork, scheduledAt, tags, images } = req.body;

    if (!title || !socialNetwork) {
        return res.status(400).json({ message: "title и socialNetwork обязательны" });
    }

    const post = await prisma.post.create({
        data: {
            title,
            socialNetwork,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            status: scheduledAt ? "scheduled" : "draft",
            tags: tags || [],
            images: images || [],
            authorId: req.user!.id
        }
    });

    res.status(201).json(post);
}

export async function updatePost(req: Request, res: Response) {
    const id = Number(req.params.id);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
        return res.status(404).json({ message: "Пост не найден" });
    }
    if (post.authorId !== req.user!.id) {
        return res.status(403).json({ message: "Это не ваш пост" });
    }

    const { title, status, socialNetwork, scheduledAt, tags, images } = req.body;

    const updatedPost = await prisma.post.update({
        where: { id },
        data: {
            title,
            status,
            socialNetwork,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
            tags,
            images
        }
    });

    res.json(updatedPost);
}


// Частичное обновление — можно передать любой поднабор полей
export async function patchPost(req: Request, res: Response) {
    const id = Number(req.params.id);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
        return res.status(404).json({ message: "Пост не найден" });
    }
    if (post.authorId !== req.user!.id) {
        return res.status(403).json({ message: "Это не ваш пост" });
    }

    // Собираем data только из реально переданных полей —
    // явно, а не полагаясь на то, что Prisma сама пропустит undefined
    const data: Record<string, any> = {};
    if (req.body.title !== undefined) data.title = req.body.title;
    if (req.body.status !== undefined) data.status = req.body.status;
    if (req.body.socialNetwork !== undefined) data.socialNetwork = req.body.socialNetwork;
    if (req.body.scheduledAt !== undefined) data.scheduledAt = req.body.scheduledAt ? new Date(req.body.scheduledAt) : null;
    if (req.body.tags !== undefined) data.tags = req.body.tags;
    if (req.body.images !== undefined) data.images = req.body.images;

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: "Нужно передать хотя бы одно поле для изменения" });
    }

    const updatedPost = await prisma.post.update({ where: { id }, data });
    res.json(updatedPost);
}



export async function deletePost(req: Request, res: Response) {
    const id = Number(req.params.id);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
        return res.status(404).json({ message: "Пост не найден" });
    }
    if (post.authorId !== req.user!.id) {
        return res.status(403).json({ message: "Это не ваш пост" });
    }

    await prisma.post.delete({ where: { id } });
    res.json({ message: "Пост удалён" });
}