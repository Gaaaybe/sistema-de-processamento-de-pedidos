import { hash } from "bcryptjs";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/winston";

export const AdminService = {

	async ensureAdminExists(): Promise<void> {
		try {
			const adminEmail = env.ADMIN_EMAIL;
			const adminPassword = env.ADMIN_PASSWORD;
			const adminName = env.ADMIN_NAME;

			if (!adminEmail || !adminPassword) {
				logger.warn("Admin credentials not configured - skipping admin creation");
				return;
			}

			const existingAdmin = await prisma.user.findUnique({
				where: { email: adminEmail }
			});

			const hashedPassword = await hash(adminPassword, 10);

			if (existingAdmin) {
				if (existingAdmin.role !== "admin") {
					await prisma.user.update({
						where: { email: adminEmail },
						data: { 
							role: "admin",
							name: adminName,
							password_hash: hashedPassword
						}
					});
					logger.info("Admin user updated successfully", { email: adminEmail });
				}
			} else {
				await prisma.user.create({
					data: {
						email: adminEmail,
						name: adminName,
						password_hash: hashedPassword,
						role: "admin"
					}
				});
				logger.info("Admin user created successfully", { email: adminEmail });
			}
		} catch (error) {
			logger.error("Failed to ensure admin exists", { error });
			throw error;
		}
	},

	async isSystemAdmin(userId: string): Promise<boolean> {
		try {
			const adminEmail = env.ADMIN_EMAIL;
			
			if (!adminEmail) {
				return false;
			}

			const user = await prisma.user.findUnique({
				where: { id: userId }
			});

			return user?.email === adminEmail && user?.role === "admin";
		} catch (error) {
			logger.error("Failed to check if user is system admin", { userId, error });
			return false;
		}
	},

	async getAdminInfo() {
		try {
			const adminEmail = env.ADMIN_EMAIL;
			
			if (!adminEmail) {
				return null;
			}

			const admin = await prisma.user.findUnique({
				where: { email: adminEmail },
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					createdAt: true
				}
			});

			return admin;
		} catch (error) {
			logger.error("Failed to get admin info", { error });
			return null;
		}
	}
};
