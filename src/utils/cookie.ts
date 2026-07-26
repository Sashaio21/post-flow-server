import { Response } from "express";

// Единое место для установки cookie — чтобы не дублировать настройки в нескольких роутах
export function setTokenCookie(res: Response, token: string) {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}