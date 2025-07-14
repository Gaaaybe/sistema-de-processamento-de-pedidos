import app from "@/app";
import { prisma } from "@/lib/prisma";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { env } from "@/env";
import bcrypt from "bcryptjs";

async function cleanDatabase() {
  try {
    await prisma.$executeRaw`DELETE FROM "orders"`;
    await prisma.$executeRaw`DELETE FROM "users"`;
    await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "orders_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE IF EXISTS "users_id_seq" RESTART WITH 1`;
  } catch (error) {
    console.error("Erro na limpeza do banco:", error);
  }
}

async function createTestUser(email: string, role: "admin" | "user" = "user") {
  const hashedPassword = await bcrypt.hash("senha123aA", 10);
  return await prisma.user.create({
    data: {
      name: "Test User",
      email,
      password_hash: hashedPassword,
      role,
    },
  });
}

function generateToken(userId: string, role: "admin" | "user" = "user") {
  return jwt.sign(
    { sub: userId, role },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

describe("Get Order E2E", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe("Casos de sucesso", () => {
    it("deve retornar um pedido específico por ID (admin)", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const user = await createTestUser("user@test.com");
      const token = generateToken(admin.id, "admin");

      // Criar um pedido
      const order = await prisma.order.create({
        data: {
          title: "Pedido de Teste",
          description: "Descrição do pedido de teste",
          imageUrl: "https://example.com/image.jpg",
          status: "pending",
          userId: user.id,
        },
      });

      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Order retrieved successfully");
      expect(response.body.order).toMatchObject({
        id: order.id,
        title: "Pedido de Teste",
        description: "Descrição do pedido de teste",
        imageUrl: "https://example.com/image.jpg",
        status: "pending",
        userId: user.id,
        createdAt: expect.any(String),
      });
    });

    it("deve retornar pedido com todos os campos necessários (admin)", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const user = await createTestUser("user@test.com");
      const token = generateToken(admin.id, "admin");

      const order = await prisma.order.create({
        data: {
          title: "Pedido Completo",
          description: "Descrição completa do pedido",
          imageUrl: "https://example.com/complete-image.jpg",
          status: "processing",
          userId: user.id,
        },
      });

      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.order).toMatchObject({
        id: expect.any(String),
        title: "Pedido Completo",
        description: "Descrição completa do pedido",
        imageUrl: "https://example.com/complete-image.jpg",
        status: "processing",
        userId: user.id,
        createdAt: expect.any(String),
      });

      // Verificar se processedAt está presente (pode ser null)
      expect(response.body.order).toHaveProperty("processedAt");
    });

    it("deve retornar pedido com status approved (admin)", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const user = await createTestUser("user@test.com");
      const token = generateToken(admin.id, "admin");

      const processedDate = new Date();
      const order = await prisma.order.create({
        data: {
          title: "Pedido Aprovado",
          description: "Pedido que foi aprovado",
          imageUrl: "https://example.com/approved.jpg",
          status: "approved",
          processedAt: processedDate,
          userId: user.id,
        },
      });

      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe("approved");
      expect(response.body.order.processedAt).toBeTruthy();
    });

    it("deve retornar pedido de qualquer usuário (admin)", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const user1 = await createTestUser("user1@test.com");
      const user2 = await createTestUser("user2@test.com");
      const token = generateToken(admin.id, "admin");

      // Criar pedido do user2
      const order = await prisma.order.create({
        data: {
          title: "Pedido do User2",
          description: "Descrição",
          imageUrl: "https://example.com/user2.jpg",
          status: "pending",
          userId: user2.id,
        },
      });

      // Admin acessando pedido do user2
      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.order.userId).toBe(user2.id);
      expect(response.body.order.title).toBe("Pedido do User2");
    });
  });

  describe("Casos de erro", () => {
    it("não deve encontrar pedido com ID inexistente (admin)", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const token = generateToken(admin.id, "admin");

      const nonExistentId = "123e4567-e89b-12d3-a456-426614174000";

      const response = await request(app)
        .get(`/orders/${nonExistentId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/order.*not found/i);
    });

    it("não deve aceitar ID de pedido inválido (admin)", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const token = generateToken(admin.id, "admin");

      const invalidId = "id-invalido";

      const response = await request(app)
        .get(`/orders/${invalidId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
    });

    it("não deve aceitar rota sem ID", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const token = generateToken(admin.id, "admin");

      const response = await request(app)
        .get("/orders/")
        .set("Authorization", `Bearer ${token}`);

      // Vai retornar a rota GET /orders (getUserOrders) que requer role "user"
      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/access denied/i);
    });
  });

  describe("Casos de autenticação", () => {
    it("não deve permitir acesso sem token", async () => {
      const user = await createTestUser("user@test.com");
      const order = await prisma.order.create({
        data: {
          title: "Pedido Teste",
          description: "Descrição",
          imageUrl: "https://example.com/test.jpg",
          status: "pending",
          userId: user.id,
        },
      });

      const response = await request(app).get(`/orders/${order.id}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/token/i);
    });

    it("não deve permitir acesso com token inválido", async () => {
      const user = await createTestUser("user@test.com");
      const order = await prisma.order.create({
        data: {
          title: "Pedido Teste",
          description: "Descrição",
          imageUrl: "https://example.com/test.jpg",
          status: "pending",
          userId: user.id,
        },
      });

      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set("Authorization", "Bearer token-invalido");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/token/i);
    });

    it("não deve permitir acesso com token expirado", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const user = await createTestUser("user@test.com");
      const expiredToken = jwt.sign(
        { sub: admin.id, role: "admin" },
        env.JWT_SECRET,
        { expiresIn: "-1h" }
      );

      const order = await prisma.order.create({
        data: {
          title: "Pedido Teste",
          description: "Descrição",
          imageUrl: "https://example.com/test.jpg",
          status: "pending",
          userId: user.id,
        },
      });

      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/token/i);
    });

    it("não deve permitir acesso para usuário comum (apenas admin)", async () => {
      const user = await createTestUser("user@test.com", "user");
      const token = generateToken(user.id, "user");

      const order = await prisma.order.create({
        data: {
          title: "Pedido User",
          description: "Descrição",
          imageUrl: "https://example.com/user.jpg",
          status: "pending",
          userId: user.id,
        },
      });

      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/access denied/i);
    });

    it("deve permitir acesso para usuário admin", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const user = await createTestUser("user@test.com");
      const token = generateToken(admin.id, "admin");

      const order = await prisma.order.create({
        data: {
          title: "Pedido Admin Test",
          description: "Descrição",
          imageUrl: "https://example.com/admin.jpg",
          status: "pending",
          userId: user.id,
        },
      });

      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Order retrieved successfully");
    });
  });

  describe("Casos de diferentes status", () => {
    it("deve retornar pedido com status pending (admin)", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const user = await createTestUser("user@test.com");
      const token = generateToken(admin.id, "admin");

      const order = await prisma.order.create({
        data: {
          title: "Pedido Pending",
          description: "Descrição",
          imageUrl: "https://example.com/pending.jpg",
          status: "pending",
          userId: user.id,
        },
      });

      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe("pending");
    });

    it("deve retornar pedido com status processing (admin)", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const user = await createTestUser("user@test.com");
      const token = generateToken(admin.id, "admin");

      const order = await prisma.order.create({
        data: {
          title: "Pedido Processing",
          description: "Descrição",
          imageUrl: "https://example.com/processing.jpg",
          status: "processing",
          userId: user.id,
        },
      });

      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe("processing");
    });

    it("deve retornar pedido com status rejected (admin)", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const user = await createTestUser("user@test.com");
      const token = generateToken(admin.id, "admin");

      const order = await prisma.order.create({
        data: {
          title: "Pedido Rejected",
          description: "Descrição",
          imageUrl: "https://example.com/rejected.jpg",
          status: "rejected",
          userId: user.id,
        },
      });

      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe("rejected");
    });
  });

  describe("Casos de validação", () => {
    it("deve validar formato UUID do ID (admin)", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const token = generateToken(admin.id, "admin");

      const invalidIds = [
        "123",
        "abc-def-ghi",
        "not-a-uuid",
        "12345678-1234-1234-1234",
        "12345678-1234-1234-1234-12345678901"
      ];

      for (const invalidId of invalidIds) {
        const response = await request(app)
          .get(`/orders/${invalidId}`)
          .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
      }
    });

    it("deve aceitar UUID válido (admin)", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const token = generateToken(admin.id, "admin");

      const validUuid = "123e4567-e89b-12d3-a456-426614174000";

      const response = await request(app)
        .get(`/orders/${validUuid}`)
        .set("Authorization", `Bearer ${token}`);

      // Deve retornar 404 (não encontrado) ao invés de 400 (inválido)
      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/not found/i);
    });
  });
});
