import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "Tracker API", // или как у вас называется
            version: "1.0.0",
            description: "Simple Express API"
        },

        servers: [
            { url: "http://localhost:3000" }
        ],

        // ← добавить весь этот блок, если его ещё нет
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "token",
                    description:
                        "JWT в httpOnly cookie 'token', выставляется /api/users/login и /api/users/verify через Set-Cookie. Не Bearer-заголовок."
                }
            }
        }
    },

    apis: [
        "./src/routes/*.ts"
    ]
};

export const swaggerSpec = swaggerJsdoc(options);