import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {

    definition: {
        openapi: "3.0.0",

        info: {
            title: "Tracker API",
            version: "1.0.0",
            description: "Simple Express API"
        },

        
        servers: [
            {
                url: "http://localhost:3000"
            }
        ]
    },


    apis: [
        "./src/routes/*.ts"
    ]

};


export const swaggerSpec = swaggerJsdoc(options);