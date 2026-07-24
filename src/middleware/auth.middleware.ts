import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization; // ожидаем формат "Bearer <токен>"

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Токен не передан" });
    }

    const token = header.replace("Bearer ", "");

    try {
        const payload = verifyToken(token);
        req.user = { id: payload.id, email: payload.email }; // доступно дальше во всех защищённых роутах
        next(); // токен верный — пропускаем запрос дальше
    } catch (err) {
        return res.status(401).json({ message: "Неверный или истёкший токен" });
    }
}