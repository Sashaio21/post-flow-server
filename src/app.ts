import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import userRoutes from "./routes/user.routes";
import postRoutes from "./routes/post.routes";
import socialConnectionRoutes from "./routes/social-connection.routes";
import testRoutes from "./routes/test.routes";

const app = express();

const allowedOrigins = (process.env.CLIENT_URLS || "").split(",");

app.use(cors({
    origin: (origin, callback) => {
        // origin бывает undefined для запросов без браузера (curl, Postman) — разрешаем
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser()); // разбирает cookie из запроса в req.cookies

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
        tagsSorter: "alpha",
        operationsSorter: "alpha",
        requestInterceptor: (req: any) => {
            req.credentials = "include"; // чтобы Swagger UI тоже слал cookie при тестировании
            return req;
        }
    }
}));

app.get("/", (req, res) => {
    res.json({ message: "API works" });
});

app.use("/api", userRoutes);
app.use("/api", postRoutes);
app.use("/api", socialConnectionRoutes);
app.use("/api", testRoutes);

export default app;