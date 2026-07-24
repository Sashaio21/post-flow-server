// Правильный способ расширить Request — через глобальный namespace Express,
// именно так типизирован сам Request внутри @types/express
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
            };
        }
    }
}

export {}; // обязательно — превращает файл в модуль, без этого declare global не сработает