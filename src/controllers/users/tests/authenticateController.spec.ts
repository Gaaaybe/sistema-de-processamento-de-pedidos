import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "@/env/index";

interface JWTPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

async function cleanDatabase() {
  try {
        await prisma.user.deleteMany();
  } catch (error) {
    console.error("Erro na limpeza do banco:", error);
  }
}

describe("Authenticate User E2E", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it("deve autenticar usuário com credenciais válidas", async () => {

    const hashedPassword = await hash("senha123aA", 6);
    await prisma.user.create({
      data: {
        name: "Gabriel Test",
        email: "gabriel.test@email.com",
        password_hash: hashedPassword,
        role: "user",
      },
    });

    const response = await request(app)
      .post("/users/authenticate")
      .send({
        email: "gabriel.test@email.com",
        password: "senha123aA",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User authenticated successfully");
    expect(response.body.token).toBeTruthy();
    expect(typeof response.body.token).toBe("string");

    const decodedToken = jwt.verify(response.body.token, env.JWT_SECRET) as JWTPayload;
    expect(decodedToken.sub).toBeTruthy();
    expect(decodedToken.role).toBe("user");
    expect(decodedToken.exp).toBeTruthy();
  });

  it("deve autenticar usuário admin com credenciais válidas", async () => {
    const hashedPassword = await hash("admin123aA", 6);
    await prisma.user.create({
      data: {
        name: "Admin Test",
        email: "admin.test@email.com",
        password_hash: hashedPassword,
        role: "admin",
      },
    });

    const response = await request(app)
      .post("/users/authenticate")
      .send({
        email: "admin.test@email.com",
        password: "admin123aA",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User authenticated successfully");
    expect(response.body.token).toBeTruthy();

    const decodedToken = jwt.verify(response.body.token, env.JWT_SECRET) as JWTPayload;
    expect(decodedToken.role).toBe("admin");
  });

  it("deve gerar token com expiração de 1 hora", async () => {

    const hashedPassword = await hash("token123aA", 6);
    await prisma.user.create({
      data: {
        name: "Token Test User",
        email: "token.test.user@email.com",
        password_hash: hashedPassword,
        role: "user",
      },
    });

    const response = await request(app)
      .post("/users/authenticate")
      .send({
        email: "token.test.user@email.com",
        password: "token123aA",
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    
    const decodedToken = jwt.verify(response.body.token, env.JWT_SECRET) as JWTPayload;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenDuration = decodedToken.exp - currentTime;
    
    expect(tokenDuration).toBeGreaterThan(3540); // 59 minutos
    expect(tokenDuration).toBeLessThanOrEqual(3600); // 1 hora
  });

  it("deve incluir sub e role no payload do token", async () => {
    const hashedPassword = await hash("payload123aA", 6);
    const user = await prisma.user.create({
      data: {
        name: "Payload Test User",
        email: "payload.test.user@email.com",
        password_hash: hashedPassword,
        role: "user",
      },
    });

    const response = await request(app)
      .post("/users/authenticate")
      .send({
        email: "payload.test.user@email.com",
        password: "payload123aA",
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    
    const decodedToken = jwt.verify(response.body.token, env.JWT_SECRET) as JWTPayload;
    
    expect(decodedToken.sub).toBe(user.id);
    expect(decodedToken.role).toBe("user");
    expect(decodedToken.iat).toBeTruthy();
    expect(decodedToken.exp).toBeTruthy();
  });

  it("não deve autenticar com email inexistente", async () => {
    const response = await request(app)
      .post("/users/authenticate")
      .send({
        email: "inexistente@email.com",
        password: "qualquersenha",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
    expect(response.body.token).toBeUndefined();
  });

  it("não deve autenticar com senha incorreta", async () => {
    const hashedPassword = await hash("senhaCorreta123aA", 6);
    await prisma.user.create({
      data: {
        name: "Gabriel Test",
        email: "gabriel.test@email.com",
        password_hash: hashedPassword,
        role: "user",
      },
    });

    const response = await request(app)
      .post("/users/authenticate")
      .send({
        email: "gabriel.test@email.com",
        password: "senhaErrada123aA",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
    expect(response.body.token).toBeUndefined();
  });

  it("não deve autenticar com dados inválidos - email em branco", async () => {
    const response = await request(app)
      .post("/users/authenticate")
      .send({
        email: "",
        password: "senha123aA",
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it("não deve autenticar com dados inválidos - password em branco", async () => {
    const response = await request(app)
      .post("/users/authenticate")
      .send({
        email: "gabriel.test@email.com",
        password: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it("não deve autenticar com formato de email inválido", async () => {
    const response = await request(app)
      .post("/users/authenticate")
      .send({
        email: "email-invalido",
        password: "senha123aA",
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it("deve retornar erro 500 em caso de erro interno", async () => {
    vi.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .post("/users/authenticate")
      .send({
        email: "gabriel.test@email.com",
        password: "senha123aA",
      });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Internal server error");

    vi.mocked(prisma.user.findUnique).mockRestore();
  });
});
