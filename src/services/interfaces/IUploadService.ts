export interface CloudinaryUploadResult {
	public_id: string;
	secure_url: string;
	width: number;
	height: number;
	format: string;
	bytes: number;
}

export interface UploadServiceRequest {
	buffer: Buffer;
	userId: string;
	folder?: string;
	maxWidth?: number;
	maxHeight?: number;
	quality?: string;
}

export interface UploadServiceResponse {
	imageUrl: string;
	imagePublicId: string;
	metadata: {
		width: number;
		height: number;
		format: string;
		bytes: number;
	};
}

export interface IUploadService {
	execute(request: UploadServiceRequest): Promise<UploadServiceResponse>;
	deleteImage(publicId: string): Promise<void>;
}
