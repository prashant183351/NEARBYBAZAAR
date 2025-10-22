import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const router = Router();

// Basic OpenAPI config; extend as the API grows
const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'NearbyBazaar API',
    version: '0.1.0',
    description: 'OpenAPI documentation for NearbyBazaar API',
  },
  servers: [{ url: '/v1', description: 'API v1 base' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    // Scan route files and controllers for JSDoc annotations as we add them
    `${__dirname}/**/*.ts`,
    `${__dirname}/../controllers/**/*.ts`,
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Serve raw JSON
router.get('/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve Swagger UI
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;
