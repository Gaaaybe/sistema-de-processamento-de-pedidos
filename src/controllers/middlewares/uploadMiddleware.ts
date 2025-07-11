import { cloudinary } from "@/lib/cloudinary";
import { logger } from "@/lib/winston";
import { ValidationError } from "@/services/errors/domainErrors";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
) => {
	const allowedMimeTypes = [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
	];

	if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new ValidationError(
				"Only image files (JPEG, PNG, WebP, GIF) are allowed",
			),
		);
	}
};

const limits = {
	fileSize: 5 * 1024 * 1024, // 5MB
	files: 1,
};

export const upload = multer({
	storage,
	fileFilter,
	limits,
});

export interface CloudinaryUploadResult {
	public_id: string;
	secure_url: string;
	width: number;
	height: number;
	format: string;
	bytes: number;
}

export const uploadToCloudinary = async (
	buffer: Buffer,
	options: {
		folder?: string;
		public_id?: string;
		transformation?: any;
	} = {},
): Promise<CloudinaryUploadResult> => {
	return new Promise((resolve, reject) => {
		const uploadOptions = {
			folder: options.folder || "orders",
			public_id: options.public_id,
			transformation: options.transformation || [
				{ width: 800, height: 600, crop: "limit" },
				{ quality: "auto" },
				{ fetch_format: "auto" },
			],
			...options,
		};

		cloudinary.uploader
			.upload_stream(uploadOptions, (error, result) => {
				if (error) {
					logger.error("Cloudinary upload error:", error);
					reject(new ValidationError("Failed to upload image"));
				} else if (result) {
					logger.info("Image uploaded to Cloudinary:", {
						public_id: result.public_id,
						url: result.secure_url,
					});
					resolve(result as CloudinaryUploadResult);
				} else {
					reject(new ValidationError("Unknown upload error"));
				}
			})
			.end(buffer);
	});
};

export const handleImageUpload = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		if (!req.file) {
			return next(new ValidationError("Image file is required"));
		}

		const userId = req.user?.id;

		const timestamp = Date.now();
		const publicId = `order_${userId}_${timestamp}`;

		const result = await uploadToCloudinary(req.file.buffer, {
			folder: "orders",
			public_id: publicId,
		});

		// Adiciona a URL da imagem ao req.body
		req.body.imageUrl = result.secure_url;
		req.body.imagePublicId = result.public_id;

		next();
	} catch (error) {
		logger.error("Image upload middleware error:", error);
		next(error);
	}
};
