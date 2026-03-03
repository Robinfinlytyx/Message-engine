import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { logger } from '../utils/logger';

interface EmailMessage {
    to: string;
    from?: string;
    cc?: string[];
    bcc?: string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        content: string; // Base64 encoded
        contentType: string;
    }>;
    replyTo?: string;
}

interface NodemailerResponse {
    messageId: string;
    accepted: string[];
    rejected: string[];
    response: string;
}

/**
 * Configuration needed to construct a NodemailerProvider instance.
 */
export interface NodemailerProviderConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    defaultFromEmail: string;
    defaultFromName: string;
}

export class NodemailerProvider {
    private transporter: Mail;
    private readonly defaultFrom: string;

    constructor(smtpConfig: NodemailerProviderConfig) {
        this.transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.password,
            },
        });

        this.defaultFrom = `${smtpConfig.defaultFromName} <${smtpConfig.defaultFromEmail || smtpConfig.user}>`;

        logger.info('Nodemailer transporter initialized', {
            host: smtpConfig.host,
            port: smtpConfig.port,
        });
    }

    /**
     * Send email via Nodemailer
     */
    async sendEmail(message: EmailMessage): Promise<NodemailerResponse> {
        try {
            const mailOptions: Mail.Options = {
                from: message.from || this.defaultFrom,
                to: message.to,
                cc: message.cc,
                bcc: message.bcc,
                subject: message.subject,
                text: message.text,
                html: message.html,
                replyTo: message.replyTo,
                attachments: message.attachments?.map(att => ({
                    filename: att.filename,
                    content: Buffer.from(att.content, 'base64'),
                    contentType: att.contentType,
                })),
            };

            logger.debug('Sending email via Nodemailer', {
                to: message.to,
                subject: message.subject,
            });

            const info = await this.transporter.sendMail(mailOptions);

            logger.info('Email sent successfully', {
                messageId: info.messageId,
                to: message.to,
                accepted: info.accepted,
            });

            return {
                messageId: info.messageId,
                accepted: info.accepted as string[],
                rejected: info.rejected as string[],
                response: info.response,
            };
        } catch (error) {
            logger.error('Failed to send email via Nodemailer', {
                to: message.to,
                subject: message.subject,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Verify SMTP connection
     */
    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            logger.info('SMTP connection verified successfully');
            return true;
        } catch (error) {
            logger.error('SMTP connection verification failed', { error });
            return false;
        }
    }

    /**
     * Close the transporter connection (for cleanup on cache eviction).
     */
    close(): void {
        this.transporter.close();
    }
}

/**
 * Default singleton using .env configuration (backward compatibility).
 * Services should migrate to using ProviderFactory instead.
 */
export const nodemailerProvider = new NodemailerProvider({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    defaultFromEmail: process.env.DEFAULT_FROM_EMAIL || process.env.SMTP_USER || '',
    defaultFromName: process.env.DEFAULT_FROM_NAME || 'Communication Engine',
});

export { EmailMessage, NodemailerResponse };

