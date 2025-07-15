import { vi } from "vitest";
import type { IUploadService } from "@/services/interfaces";

/**
 * Utilitários para criar mocks padronizados
 */

/**
 * Cria um mock do UploadService
 */
export function createUploadServiceMock(): IUploadService {
  return {
    execute: vi.fn().mockResolvedValue({
      imageUrl: "https://cloudinary.com/test-image.jpg",
      imagePublicId: "test-public-id",
      metadata: {
        width: 800,
        height: 600,
        format: "jpg",
        bytes: 1024
      }
    }),
    deleteImage: vi.fn().mockResolvedValue(void 0)
  };
}

/**
 * Cria um mock que simula erro de upload
 */
export function createFailingUploadServiceMock(): IUploadService {
  return {
    execute: vi.fn().mockRejectedValue(new Error("Upload failed")),
    deleteImage: vi.fn().mockResolvedValue(void 0)
  };
}

/**
 * Limpa todos os mocks
 */
export function clearAllMocks() {
  vi.clearAllMocks();
}

/**
 * Cria um mock de console para testes de logging
 */
export function createConsoleMock() {
  return {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };
}
