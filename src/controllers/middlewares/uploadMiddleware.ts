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

export const uploadSingle = upload.single("image");


export const validateImageFile = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (!req.file) {
		return next(
			new ValidationError('Image file is required. Use field name "image".'),
		);
	}
	next();
};
