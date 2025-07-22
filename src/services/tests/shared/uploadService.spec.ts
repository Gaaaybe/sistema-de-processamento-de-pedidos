import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadService } from "@/services/shared/uploadService";
import { ValidationError } from "@/services/errors/domainErrors";
import { cloudinary } from "@/lib/cloudinary";

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

vi.mock("../logging/auditService", () => ({
  AuditService: {
    log: vi.fn(),
  },
}));

let sut: UploadService;

describe("UploadService", () => {
  beforeEach(() => {
    sut = new UploadService();
    vi.clearAllMocks();
  });

  describe("Happy Path", () => {
    it("should upload image successfully when data is valid", async () => {
      const mockResult = {
        secure_url: "https://cloudinary.com/test-image.jpg",
        public_id: "test-public-id",
        width: 800,
        height: 600,
        format: "jpg",
        bytes: 123456,
      };

      (cloudinary.uploader.upload_stream as ReturnType<typeof vi.fn>)
        .mockImplementation((options: unknown, callback: (error: Error | null, result: unknown) => void) => {
          callback(null, mockResult);
          return { end: vi.fn() };
        });

      const uploadData = {
        buffer: Buffer.from("fake-image-data"),
        userId: "user-123",
        folder: "orders",
      };

      const result = await sut.execute(uploadData);

      expect(result).toBeDefined();
      expect(result.imageUrl).toBe("https://cloudinary.com/test-image.jpg");
      expect(result.imagePublicId).toBe("test-public-id");
      expect(result.metadata).toEqual({
        width: 800,
        height: 600,
        format: "jpg",
        bytes: 123456,
      });
    });

    it("should delete image successfully when public_id is valid", async () => {
      (cloudinary.uploader.destroy as ReturnType<typeof vi.fn>).mockResolvedValue({ result: "ok" });

      const publicId = "test-public-id";

      await sut.deleteImage(publicId);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(publicId);
    });
  });

  describe("Error Cases", () => {
    it("should handle cloudinary upload errors", async () => {
      const error = new Error("Cloudinary upload failed");
      (cloudinary.uploader.upload_stream as ReturnType<typeof vi.fn>)
        .mockImplementation((options: unknown, callback: (error: Error | null, result: unknown) => void) => {
          callback(error, null);
          return { end: vi.fn() };
        });

      const uploadData = {
        buffer: Buffer.from("fake-image-data"),
        userId: "user-123",
        folder: "orders",
      };

      await expect(sut.execute(uploadData)).rejects.toThrow("Failed to upload image");
    });

    it("should handle cloudinary delete errors", async () => {
      const error = new Error("Cloudinary delete failed");
      (cloudinary.uploader.destroy as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const publicId = "test-public-id";

      await expect(sut.deleteImage(publicId)).rejects.toThrow("Failed to delete image");
    });
  });
});
