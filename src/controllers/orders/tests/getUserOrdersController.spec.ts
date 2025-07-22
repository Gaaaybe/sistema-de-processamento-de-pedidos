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

describe("Get User Orders E2E", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe("Casos de sucesso", () => {
    it("deve retornar lista vazia quando usuário não tem pedidos", async () => {
      const user = await createTestUser("user@test.com");
      const token = generateToken(user.id);

      const response = await request(app)
        .get("/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Orders retrieved successfully");
      expect(response.body.orders).toEqual([]);
    });

    it("deve retornar pedidos do usuário autenticado", async () => {
      const user = await createTestUser("user@test.com");
      const token = generateToken(user.id);

      await prisma.order.createMany({
        data: [
          {
            title: "Pedido 1",
            description: "Descrição do pedido 1",
            imageUrl: "https://example.com/image1.jpg",
            status: "pending",
            userId: user.id,
          },
          {
            title: "Pedido 2", 
            description: "Descrição do pedido 2",
            imageUrl: "https://example.com/image2.jpg",
            status: "approved",
            userId: user.id,
          },
        ],
      });

      const response = await request(app)
        .get("/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Orders retrieved successfully");
      expect(response.body.orders).toHaveLength(2);
      expect(response.body.orders[0]).toMatchObject({
        title: "Pedido 1",
        description: "Descrição do pedido 1",
        status: "pending",
        userId: user.id,
      });
      expect(response.body.orders[1]).toMatchObject({
        title: "Pedido 2",
        description: "Descrição do pedido 2", 
        status: "approved",
        userId: user.id,
      });
    });

    it("deve retornar apenas pedidos do usuário autenticado, não de outros usuários", async () => {
      const user1 = await createTestUser("user1@test.com");
      const user2 = await createTestUser("user2@test.com");
      const token1 = generateToken(user1.id);

      await prisma.order.createMany({
        data: [
          {
            title: "Pedido do User 1",
            description: "Descrição",
            imageUrl: "https://example.com/image1.jpg",
            status: "pending",
            userId: user1.id,
          },
          {
            title: "Pedido do User 2",
            description: "Descrição",
            imageUrl: "https://example.com/image2.jpg",
            status: "pending", 
            userId: user2.id,
          },
        ],
      });

      const response = await request(app)
        .get("/orders")
        .set("Authorization", `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].title).toBe("Pedido do User 1");
      expect(response.body.orders[0].userId).toBe(user1.id);
    });

    it("deve retornar pedidos com todos os campos necessários", async () => {
      const user = await createTestUser("user@test.com");
      const token = generateToken(user.id);

      await prisma.order.create({
        data: {
          title: "Pedido Completo",
          description: "Descrição completa",
          status: "processing",
          imageUrl: "https://example.com/image.jpg",
          userId: user.id,
        },
      });

      const response = await request(app)
        .get("/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.orders[0]).toMatchObject({
        id: expect.any(String),
        title: "Pedido Completo",
        description: "Descrição completa",
        status: "processing",
        imageUrl: "https://example.com/image.jpg",
        userId: user.id,
        createdAt: expect.any(String),
      });
    });
  });

  describe("Casos de autenticação", () => {
    it("não deve permitir acesso sem token", async () => {
      const response = await request(app).get("/orders");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/token/i);
    });

    it("não deve permitir acesso com token inválido", async () => {
      const response = await request(app)
        .get("/orders")
        .set("Authorization", "Bearer token-invalido");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/token/i);
    });

    it("não deve permitir acesso com token expirado", async () => {
      const user = await createTestUser("user@test.com");
      const expiredToken = jwt.sign(
        { sub: user.id, role: "user" },
        env.JWT_SECRET,
        { expiresIn: "-1h" }
      );

      const response = await request(app)
        .get("/orders")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/token/i);
    });

    it("não deve permitir acesso para usuário admin (role específica)", async () => {
      const admin = await createTestUser("admin@test.com", "admin");
      const token = generateToken(admin.id, "admin");

      const response = await request(app)
        .get("/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/access denied/i);
    });

    it("deve permitir acesso para usuário comum", async () => {
      const user = await createTestUser("user@test.com", "user");
      const token = generateToken(user.id, "user");

      const response = await request(app)
        .get("/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Orders retrieved successfully");
    });
  });

  describe("Casos de performance", () => {
    it("deve lidar com usuário que tem muitos pedidos", async () => {
      const user = await createTestUser("user@test.com");
      const token = generateToken(user.id);

      const ordersData = Array.from({ length: 50 }, (_, i) => ({
        title: `Pedido ${i + 1}`,
        description: `Descrição do pedido ${i + 1}`,
        imageUrl: `https://example.com/image${i + 1}.jpg`,
        status: i % 2 === 0 ? "pending" as const : "approved" as const,
        userId: user.id,
      }));

      await prisma.order.createMany({ data: ordersData });

      const response = await request(app)
        .get("/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(50);
      expect(response.body.message).toBe("Orders retrieved successfully");
    });
  });
});

