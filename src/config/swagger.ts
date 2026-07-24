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
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },

    apis: [
        "./src/routes/*.ts"
    ]
};

export const swaggerSpec = swaggerJsdoc(options);