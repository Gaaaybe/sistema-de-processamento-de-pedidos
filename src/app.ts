import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { env } from "@/env";
import { openApiDocument } from "./docs/swagger";
import routes from "./controllers/index";
import { globalErrorHandler, notFoundHandler } from "./middlewares/errorHandler";

const app = express();

// Configuração do CORS
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = env.NODE_ENV === "production" 
      ? env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : [
          "http://localhost:3000",
          "http://localhost:3001", 
          "http://localhost:5173",
          "http://localhost:5174",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:5173",
          ...env.CORS_ORIGINS.split(',').map(origin => origin.trim())
        ];

    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS: Origin não permitida: ${origin}`);
      callback(new Error('Não permitido pelo CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token'
  ]
};

// Middlewares globais
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Documentação Swagger (apenas em desenvolvimento e teste)
if (env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    customSiteTitle: "🚀 Sistema de Pedidos API",
    customfavIcon: "/favicon.ico",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: "none", // Opções: "list", "full", "none"
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestInterceptor: `(req) => {
        req.headers['X-Custom-Header'] = 'Swagger-UI-Request';
        return req;
      }`,
      responseInterceptor: `(res) => {
        console.log('Response intercepted:', res);
        return res;
      }`
    },
    explorer: true
  }));
  
  // Endpoint para baixar o JSON do OpenAPI
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(openApiDocument);
  });
  
  console.log("📖 Docs on: http://localhost:3001/api-docs");
}

// Rotas
routes(app);

// Middleware para rotas não encontradas (deve vir depois das rotas)
app.use(notFoundHandler);

// Middleware global de tratamento de erros (deve ser o último)
app.use(globalErrorHandler);

export default app;
