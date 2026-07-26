import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.token; // вместо req.headers.authorization

    if (!token) {
        return res.status(401).json({ message: "Токен не передан" });
    }

    try {
        const payload = verifyToken(token);
        req.user = { id: payload.id, email: payload.email };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Неверный или истёкший токен" });
    }
}