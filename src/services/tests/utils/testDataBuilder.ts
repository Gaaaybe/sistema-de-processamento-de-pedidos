import { hash } from "bcryptjs";
import type { User, Role } from "@prisma/client";
import { randomUUID } from "node:crypto";

/**
 * Utilitários para criar dados de teste padronizados
 */

/**
 * Cria um usuário de teste com dados padrão
 */
export async function createUser(overrides: Partial<User> = {}): Promise<User> {
  const defaultUser: User = {
    id: randomUUID(),
    name: "Test User",
    email: "test@example.com",
    password_hash: await hash("123456", 8),
    role: "user" as Role,
    createdAt: new Date(),
    ...overrides
  };

  return defaultUser;
}

/**
 * Cria múltiplos usuários de teste
 */
export async function createUsers(count: number): Promise<User[]> {
  const users: User[] = [];
  
  for (let i = 0; i < count; i++) {
    users.push(await createUser({
      name: `Test User ${i + 1}`,
      email: `test${i + 1}@example.com`
    }));
  }
  
  return users;
}

/**
 * Cria um usuário admin de teste
 */
export async function createAdminUser(overrides: Partial<User> = {}): Promise<User> {
  return createUser({
    name: "Admin User",
    email: "admin@example.com",
    role: "admin" as Role,
    ...overrides
  });
}

/**
 * Cria dados de autenticação válidos
 */
export function createAuthRequest(overrides: Partial<{
  email: string;
  password: string;
  ip?: string;
}> = {}) {
  return {
    email: "test@example.com",
    password: "123456",
    ...overrides
  };
}

/**
 * Cria dados de registro válidos
 */
export function createRegisterRequest(overrides: Partial<{
  name: string;
  email: string;
  password: string;
  role: Role;
}> = {}) {
  return {
    name: "John Doe",
    email: "johndoe@example.com",
    password: "123456",
    role: "user" as Role,
    ...overrides
  };
}

/**
 * Cria dados de ordem válidos
 */
export function createOrderRequest(overrides: Partial<{
  userId: string;
  title: string;
  description: string;
  imageBuffer: Buffer;
}> = {}) {
  return {
    userId: randomUUID(),
    title: "Test Order",
    description: "Test order description",
    imageBuffer: Buffer.from("fake-image-data"),
    ...overrides
  };
}
