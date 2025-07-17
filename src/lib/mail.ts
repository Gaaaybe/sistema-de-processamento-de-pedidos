import { env } from "@/env"
import nodemailer from "nodemailer";

const mailConfig = {
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASSWORD
    }
}

export const mailTransporter = nodemailer.createTransport(mailConfig);