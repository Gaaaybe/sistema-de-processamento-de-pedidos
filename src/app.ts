import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { env } from "@/env";
import { openApiDocument } from "./docs/swagger";
import routes from "./controllers/index";
import { globalErrorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { smartAuditMiddleware } from "./middlewares/auditMiddleware";

const app = express();

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

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(smartAuditMiddleware);

if (env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    customSiteTitle: "🚀 Sistema de Pedidos API",
    customfavIcon: "/favicon.ico",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: "none",
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
  
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(openApiDocument);
  });
  
  console.log("📖 Docs on: http://localhost:3001/api-docs");
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: process.uptime()
  });
});

routes(app);

app.use(notFoundHandler);

app.use(globalErrorHandler);

export default app;
