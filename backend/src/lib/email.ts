import nodemailer from 'nodemailer';
import { supabase } from './supabase';

// SMTP Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.elasticemail.com',
    port: Number(process.env.SMTP_PORT) || 2525,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'info@thefusionfunded.com';

interface EmailData {
    userId: string;
    emailType: 'hard_violation' | 'soft_violation' | 'marketing' | 'notification';
    subject: string;
    templateId?: string;
    templateData?: Record<string, any>;
    htmlContent?: string;
    textContent?: string;
}

class EmailService {
    /**
     * Send email to a single user
     */
    async sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
        try {
            // Get user email
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.userId);

            if (userError || !userData.user.email) {
                throw new Error('User email not found');
            }

            const userEmail = process.env.DEBUG_EMAIL_REDIRECT || userData.user.email;
            let html = data.htmlContent;
            let text = data.textContent;

            // If template ID provided, fetch and render template
            if (data.templateId) {
                const { data: template, error: templateError } = await supabase
                    .from('email_templates')
                    .select('*')
                    .eq('template_id', data.templateId)
                    .single();

                if (!templateError && template) {
                    html = this.renderTemplate(template.html_content, data.templateData || {});
                    text = this.renderTemplate(template.text_content, data.templateData || {});
                }
            }

            // Global Branding Replacement: Sharkfunded -> Fusion Funded
            if (html) html = html.replace(/SharkFunded/gi, 'Fusion Funded');
            if (text) text = text.replace(/SharkFunded/gi, 'Fusion Funded');
            const subject = data.subject.replace(/SharkFunded/gi, 'Fusion Funded');

            // Send email via Nodemailer SMTP
            const info = await transporter.sendMail({
                from: `"Fusion Funded" <${FROM_EMAIL}>`,
                to: userEmail,
                subject: subject,
                html: html || '',
                text: text || '',
            });

            // Log to database
            await supabase.from('email_logs').insert({
                user_id: data.userId,
                email_type: data.emailType,
                subject: data.subject,
                template_id: data.templateId,
                template_data: data.templateData,
                status: 'sent',
                error_message: null,
                sent_at: new Date().toISOString(),
                metadata: { messageId: info.messageId }
            });

            return { success: true };

        } catch (error: any) {
            console.error('Email send error:', error);

            // Log failed attempt
            await supabase.from('email_logs').insert({
                user_id: data.userId,
                email_type: data.emailType,
                subject: data.subject,
                template_id: data.templateId,
                template_data: data.templateData,
                status: 'failed',
                error_message: error.message,
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Send bulk emails (for marketing campaigns)
     */
    async sendBulkEmail(
        userIds: string[],
        emailType: 'marketing' | 'notification',
        subject: string,
        htmlContent: string,
        textContent?: string
    ): Promise<{ sent: number; failed: number }> {
        let sent = 0;
        let failed = 0;

        for (const userId of userIds) {
            const result = await this.sendEmail({
                userId,
                emailType,
                subject,
                htmlContent,
                textContent,
            });

            if (result.success) {
                sent++;
            } else {
                failed++;
            }

            // Rate limiting - wait 100ms between emails
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return { sent, failed };
    }

    /**
     * Send hard violation email
     */
    async sendHardViolationEmail(
        userId: string,
        accountNumber: string,
        violationType: string,
        violationDetails: string
    ): Promise<void> {
        // Get user name
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

        await this.sendEmail({
            userId,
            emailType: 'hard_violation',
            subject: '⚠️ Account Suspended - Trading Rule Violation',
            templateId: 'hard_violation',
            templateData: {
                userName: profile?.full_name || 'Trader',
                accountNumber,
                violationType,
                violationDetails,
                suspendedAt: new Date().toLocaleString(),
            },
        });
    }

    /**
     * Send soft violation email
     */
    async sendSoftViolationEmail(
        userId: string,
        accountNumber: string,
        warningType: string,
        warningDetails: string
    ): Promise<void> {
        // Get user name
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

        await this.sendEmail({
            userId,
            emailType: 'soft_violation',
            subject: '⚡ Trading Alert - Please Review',
            templateId: 'soft_violation',
            templateData: {
                userName: profile?.full_name || 'Trader',
                accountNumber,
                warningType,
                warningDetails,
                timestamp: new Date().toLocaleString(),
            },
        });
    }

    /**
     * Render template by replacing {{variable}} with values
     */
    private renderTemplate(template: string, data: Record<string, any>): string {
        let result = template;

        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, String(value));
        }

        return result;
    }
}

export const emailService = new EmailService();
