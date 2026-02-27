import nodemailer, { type Transporter } from 'nodemailer';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

interface ResolvedEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
}

interface SendMailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
  strict?: boolean;
}

export class EmailService {
  private transportCache: {
    key: string;
    transporter: Transporter;
  } | null = null;

  private async getSiteName(): Promise<string> {
    try {
      const record = await prisma.systemSetting.findUnique({ where: { group: 'site' } });
      const payload =
        record?.payload && typeof record.payload === 'object' && !Array.isArray(record.payload)
          ? (record.payload as Record<string, unknown>)
          : {};
      return String(payload.siteName ?? payload.name ?? '').trim() || '社区';
    } catch {
      return '社区';
    }
  }

  private wrapHtml(title: string, body: string, footer: string): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#1570EF 0%,#175CD3 100%);padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">${title}</h1>
    </div>
    <div style="padding:32px">
      ${body}
    </div>
    <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #f0f0f0;text-align:center">
      <p style="margin:0;color:#9ca3af;font-size:12px">${footer}</p>
    </div>
  </div>
</body></html>`;
  }

  private async resolveConfig(): Promise<ResolvedEmailConfig | null> {
    const record = await prisma.systemSetting.findUnique({ where: { group: 'email' } });
    const payload =
      record?.payload && typeof record.payload === 'object' && !Array.isArray(record.payload)
        ? (record.payload as Record<string, unknown>)
        : {};

    const host = String(payload.host ?? process.env.SMTP_HOST ?? '').trim();
    const portRaw = Number(payload.port ?? process.env.SMTP_PORT ?? 465);
    const port = Number.isFinite(portRaw) && portRaw > 0 ? Math.floor(portRaw) : 465;
    const username = String(payload.username ?? process.env.SMTP_USER ?? '').trim();
    const password = String(payload.password ?? process.env.SMTP_PASS ?? '').trim();
    const from = String(payload.from ?? process.env.SMTP_FROM ?? username).trim();
    const secureRaw = String(payload.secure ?? process.env.SMTP_SECURE ?? '')
      .trim()
      .toLowerCase();
    const secure = secureRaw ? ['1', 'true', 'yes', 'on'].includes(secureRaw) : port === 465;

    if (!host || !username || !password || !from) {
      return null;
    }

    return {
      host,
      port,
      secure,
      username,
      password,
      from
    };
  }

  private async getTransporter(): Promise<{ transporter: Transporter; from: string } | null> {
    const config = await this.resolveConfig();
    if (!config) {
      return null;
    }

    const key = `${config.host}:${config.port}:${config.username}:${config.secure ? '1' : '0'}`;
    if (this.transportCache?.key === key) {
      return {
        transporter: this.transportCache.transporter,
        from: config.from
      };
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password
      }
    });

    this.transportCache = { key, transporter };

    return {
      transporter,
      from: config.from
    };
  }

  private async send(payload: SendMailPayload): Promise<void> {
    const channel = await this.getTransporter();
    if (!channel) {
      logger.warn('Email service unavailable: smtp config missing');
      if (payload.strict) {
        throw new AppError('邮件服务未配置', { statusCode: 503, code: 'EMAIL_SERVICE_UNAVAILABLE' });
      }
      return;
    }

    try {
      await channel.transporter.sendMail({
        from: channel.from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html
      });
    } catch (error) {
      logger.error('Send email failed', {
        to: payload.to,
        subject: payload.subject,
        reason: error instanceof Error ? error.message : 'unknown'
      });

      if (payload.strict) {
        throw new AppError('邮件发送失败，请稍后重试', { statusCode: 500, code: 'EMAIL_SEND_FAILED' });
      }
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const siteName = await this.getSiteName();
    const body = `
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">你好 <strong>${username}</strong>，</p>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">欢迎加入 <strong>${siteName}</strong>！你的账号已创建成功。</p>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">在这里你可以：</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:14px;line-height:1.8">
        <li>发布技术文章，分享你的编程经验</li>
        <li>参与社区讨论，结识志同道合的开发者</li>
        <li>探索 AI 与编程的无限可能</li>
      </ul>
      <p style="margin:0;color:#6b7280;font-size:13px">期待你的第一篇分享！</p>`;
    await this.send({
      to: email,
      subject: `欢迎加入${siteName}`,
      text: `你好 ${username}，欢迎加入${siteName}！你的账号已创建成功。`,
      html: this.wrapHtml(
        `欢迎加入${siteName}`,
        body,
        `© ${new Date().getFullYear()} ${siteName} · 此邮件由系统自动发送，请勿回复`
      ),
      strict: false
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const siteName = await this.getSiteName();
    const body = `
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">你好，</p>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">我们收到了你的密码重置请求，请使用以下令牌重置密码：</p>
      <div style="margin:20px 0;padding:16px;background:#f3f4f6;border-radius:8px;text-align:center">
        <code style="font-size:18px;font-weight:700;color:#1570EF;letter-spacing:2px">${resetToken}</code>
      </div>
      <p style="margin:0 0 8px;color:#6b7280;font-size:13px">此令牌 15 分钟内有效。</p>
      <p style="margin:0;color:#6b7280;font-size:13px">如果你没有请求重置密码，请忽略此邮件。</p>`;
    await this.send({
      to: email,
      subject: `${siteName} - 重置密码`,
      text: `你的重置密码令牌：${resetToken}，15 分钟内有效。`,
      html: this.wrapHtml(
        '重置密码',
        body,
        `© ${new Date().getFullYear()} ${siteName} · 此邮件由系统自动发送，请勿回复`
      ),
      strict: false
    });
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const siteName = await this.getSiteName();
    const body = `
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">你好，</p>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">你正在注册 <strong>${siteName}</strong>，请使用以下验证码完成验证：</p>
      <div style="margin:20px 0;padding:20px;background:#f3f4f6;border-radius:8px;text-align:center">
        <span style="font-size:32px;font-weight:700;color:#1570EF;letter-spacing:8px">${code}</span>
      </div>
      <p style="margin:0 0 8px;color:#6b7280;font-size:13px">验证码 30 分钟内有效，请勿将验证码告知他人。</p>
      <p style="margin:0;color:#6b7280;font-size:13px">如果你没有进行此操作，请忽略此邮件。</p>`;
    await this.send({
      to: email,
      subject: `${siteName} - 邮箱验证码`,
      text: `你的验证码是：${code}，30 分钟内有效。`,
      html: this.wrapHtml(
        '邮箱验证码',
        body,
        `© ${new Date().getFullYear()} ${siteName} · 此邮件由系统自动发送，请勿回复`
      ),
      strict: true
    });
  }

  async sendCustomEmail(payload: { to: string; subject: string; content: string }): Promise<void> {
    await this.send({
      to: payload.to,
      subject: payload.subject,
      text: payload.content,
      html: `<pre style="white-space:pre-wrap">${payload.content}</pre>`,
      strict: true
    });
  }
}

export const emailService = new EmailService();
