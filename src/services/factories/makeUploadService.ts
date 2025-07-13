import { UploadService } from "../uploadService";

export function makeUploadService() {
	const uploadService = new UploadService();
	return uploadService;
}
