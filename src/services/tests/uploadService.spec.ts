import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadService } from "../uploadService";
import { ValidationError } from "../errors/domainErrors";

vi.mock("@/lib/cloudinary", () => ({
  cloudinary: {
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

vi.mock("@/lib/winston", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

let sut: UploadService;

describe("Upload Service", () => {
  beforeEach(() => {
    sut = new UploadService();
    vi.clearAllMocks();
  });

  it("should create an upload service instance", () => {
    expect(sut).toBeInstanceOf(UploadService);
  });

  it("should have execute method", () => {
    expect(sut.execute).toBeDefined();
    expect(typeof sut.execute).toBe("function");
  });

  it("should have deleteImage method", () => {
    expect(sut.deleteImage).toBeDefined();
    expect(typeof sut.deleteImage).toBe("function");
  });
});
