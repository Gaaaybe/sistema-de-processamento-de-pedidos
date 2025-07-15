import { UploadService } from "@/services/shared/uploadService";
import type { IUploadService } from "@/services/interfaces";

export function makeUploadService(): IUploadService {
	const uploadService = new UploadService();
	return uploadService;
}
