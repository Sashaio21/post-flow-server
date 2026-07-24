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