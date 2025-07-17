import app from "@/app";
import { prisma } from "@/lib/prisma";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { env } from "@/env";

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

vi.mock("@/lib/cloudinary", () => ({
  cloudinary: {
    uploader: {
      upload_stream: vi.fn((options, callback) => {
        callback(null, {
          secure_url: "https://test-cloudinary.com/test-image.jpg",
          public_id: "test-public-id",
          width: 800,
          height: 600,
          format: "jpg",
          bytes: 123456,
        });
      }),
      destroy: vi.fn(),
    },
  },
}));

describe("Emit Order Controller E2E", () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await cleanDatabase();

    const user = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        password_hash: "hashed_password",
        role: "user",
      },
    });

    userId = user.id;
    authToken = jwt.sign(
      { sub: userId, role: "user" },
      env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  afterEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  it("deve criar um pedido com sucesso", async () => {
    const testImageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64"
    );

    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Pedido de Teste")
      .field("description", "Descrição do pedido de teste")
      .attach("image", testImageBuffer, "test-image.png");

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Order submitted successfully and is being processed");
    expect(response.body.order).toMatchObject({
      id: expect.any(String),
      title: "Pedido de Teste",
      userId: userId,
      status: "pending",
    });
    const orderInDb = await prisma.order.findFirst({
      where: { userId },
    });

    expect(orderInDb).toBeTruthy();
    expect(orderInDb?.title).toBe("Pedido de Teste");
    expect(orderInDb?.description).toBe("Descrição do pedido de teste");
    expect(orderInDb?.status).toBe("pending");
  });

  it("não deve permitir criar pedido sem autenticação", async () => {
    const testImageBuffer = Buffer.from("fake-image-data");

    const response = await request(app)
      .post("/orders")
      .field("title", "Pedido sem Auth")
      .field("description", "Descrição")
      .attach("image", testImageBuffer, "test-image.png");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/token/i);
  });

  it("não deve permitir criar pedido sem imagem", async () => {
    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Pedido sem Imagem")
      .field("description", "Descrição");

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/image.*required/i);
  });

  it("não deve permitir criar pedido sem título", async () => {
    const testImageBuffer = Buffer.from("fake-image-data");

    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .field("description", "Descrição")
      .attach("image", testImageBuffer, "test-image.png");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "title",
          message: expect.stringMatching(/obrigatório/i),
        }),
      ])
    );
  });

  it("não deve permitir criar pedido sem descrição", async () => {
    const testImageBuffer = Buffer.from("fake-image-data");

    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Pedido sem Descrição")
      .attach("image", testImageBuffer, "test-image.png");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "description",
          message: expect.stringMatching(/obrigatória/i),
        }),
      ])
    );
  });

  it("não deve permitir criar pedido quando usuário já tem um pendente", async () => {
    await prisma.order.create({
      data: {
        userId,
        title: "Pedido Existente",
        description: "Descrição existente",
        imageUrl: "https://example.com/existing.jpg",
        status: "pending",
      },
    });

    const testImageBuffer = Buffer.from("fake-image-data");

    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Novo Pedido")
      .field("description", "Nova descrição")
      .attach("image", testImageBuffer, "test-image.png");

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already.*pending/i);
  });

  it("deve permitir criar pedido quando o anterior foi processado", async () => {
    await prisma.order.create({
      data: {
        userId,
        title: "Pedido Aprovado",
        description: "Descrição aprovada",
        imageUrl: "https://example.com/approved.jpg",
        status: "approved",
      },
    });

    const testImageBuffer = Buffer.from("fake-image-data");

    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Novo Pedido")
      .field("description", "Nova descrição")
      .attach("image", testImageBuffer, "test-image.png");

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Order submitted successfully and is being processed");
    const ordersCount = await prisma.order.count({
      where: { userId },
    });
    expect(ordersCount).toBe(2);
  });

  it("deve rejeitar imagem muito grande", async () => {
    const largeImageBuffer = Buffer.alloc(6 * 1024 * 1024, 0);

    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Pedido com Imagem Grande")
      .field("description", "Descrição")
      .attach("image", largeImageBuffer, "large-image.png");

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/file size.*large/i);
  });

  it("deve rejeitar formato de arquivo inválido", async () => {
    const textBuffer = Buffer.from("Este é um arquivo de texto, não uma imagem");

    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .field("title", "Pedido com Arquivo Inválido")
      .field("description", "Descrição")
      .attach("image", textBuffer, "document.txt");

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/only.*image.*allowed/i);
  });
});
