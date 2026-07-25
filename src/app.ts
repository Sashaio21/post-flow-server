import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import userRoutes from "./routes/user.routes";
import testRoutes from "./routes/test.routes"; 
import postRoutes from "./routes/post.routes"
import socialConnectionRoutes from "./routes/social-connection.routes";

const app = express();

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
    res.json({ message: "API works" });
});

app.use("/api", userRoutes);
app.use("/api", postRoutes);
app.use("/api", socialConnectionRoutes);

app.use("/api", testRoutes);


export default app;