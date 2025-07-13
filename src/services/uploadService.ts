import { cloudinary } from "@/lib/cloudinary";
import { logger } from "@/lib/winston";
import { ValidationError } from "./errors/domainErrors";

export interface CloudinaryUploadResult {
	public_id: string;
	secure_url: string;
	width: number;
	height: number;
	format: string;
	bytes: number;
}

interface UploadServiceRequest {
	buffer: Buffer;
	userId: string;
	folder?: string;
	maxWidth?: number;
	maxHeight?: number;
	quality?: string;
}

interface UploadServiceResponse {
	imageUrl: string;
	imagePublicId: string;
	metadata: {
		width: number;
		height: number;
		format: string;
		bytes: number;
	};
}

export class UploadService {
	async execute({
		buffer,
		userId,
		folder = "orders",
		maxWidth = 800,
		maxHeight = 600,
		quality = "auto",
	}: UploadServiceRequest): Promise<UploadServiceResponse> {
		try {
			logger.info("Starting image upload", { userId, folder });

			const timestamp = Date.now();
			const publicId = `${folder}_${userId}_${timestamp}`;

			const uploadOptions = {
				folder,
				public_id: publicId,
				transformation: [
					{ width: maxWidth, height: maxHeight, crop: "limit" },
					{ quality },
					{ fetch_format: "auto" },
				],
			};

			const result = await this.uploadToCloudinary(buffer, uploadOptions);

			logger.info("Image uploaded successfully", {
				userId,
				publicId: result.public_id,
				url: result.secure_url,
				size: result.bytes,
			});

			return {
				imageUrl: result.secure_url,
				imagePublicId: result.public_id,
				metadata: {
					width: result.width,
					height: result.height,
					format: result.format,
					bytes: result.bytes,
				},
			};
		} catch (error) {
			logger.error("Upload service error", { error, userId });
			throw new ValidationError("Failed to upload image");
		}
	}

	private async uploadToCloudinary(
		buffer: Buffer,
		options: {
			folder: string;
			public_id: string;
			transformation: Array<{
				width?: number;
				height?: number;
				crop?: string;
				quality?: string;
				fetch_format?: string;
			}>;
		},
	): Promise<CloudinaryUploadResult> {
		return new Promise((resolve, reject) => {
			cloudinary.uploader
				.upload_stream(options, (error, result) => {
					if (error) {
						logger.error("Cloudinary upload error:", error);
						reject(error);
					} else if (result) {
						resolve(result as CloudinaryUploadResult);
					} else {
						reject(new Error("Unknown upload error"));
					}
				})
				.end(buffer);
		});
	}

	async deleteImage(publicId: string): Promise<void> {
		try {
			logger.info("Deleting image from Cloudinary", { publicId });
			await cloudinary.uploader.destroy(publicId);
			logger.info("Image deleted successfully", { publicId });
		} catch (error) {
			logger.error("Error deleting image", { error, publicId });
			throw new ValidationError("Failed to delete image");
		}
	}
}
