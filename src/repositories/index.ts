// Repository Interfaces
export type { UsersRepository } from "./usersRepository";
export type { OrdersRepository } from "./ordersRepository";

// Repository Implementations
export { PrismaUsersRepository } from "./prisma/prismaUsersRepository";
export { PrismaOrdersRepository } from "./prisma/prismaOrdersRepository";

// In-Memory Implementations (for testing)
export { InMemoryUsersRepository } from "./in-memory/inMemoryUsersRepository";
export { InMemoryOrdersRepository } from "./in-memory/inMemoryOrdersRepository";
