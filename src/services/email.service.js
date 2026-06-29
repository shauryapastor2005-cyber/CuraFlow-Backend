import { transporter } from "../config/mailer.js";
import { ApiError } from "../utils/ApiError.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //email regex to check whether it is correct format or not

const sendEmail = async ({ to, subject, html }) => {
  const smtpPort = Number(process.env.SMTP_PORT);

  if (
    !process.env.MAIL_FROM_NAME ||
    !process.env.MAIL_FROM_EMAIL ||
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !Number.isInteger(smtpPort) ||
    smtpPort <= 0
  ) {
    throw new ApiError(503, "Email service is not configured");
  }

  if (!to || !EMAIL_PATTERN.test(to)) {
    throw new ApiError(400, "A valid recipient email is required");
  }

  if (!subject?.trim()) {
    throw new ApiError(400, "Email subject is required");
  }

  if (!html?.trim()) {
    throw new ApiError(400, "Email HTML content is required");
  }

  try {
    const fromName = process.env.MAIL_FROM_NAME;

    return await transporter.sendMail({
      from: `"${fromName}" <${process.env.MAIL_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    if (error?.code === "EAUTH" || error?.responseCode === 535) {
      throw new ApiError(503, "Email service authentication failed");
    }

    if (error?.code === "EENVELOPE" || error?.rejected?.length) {
      throw new ApiError(400, "Invalid email recipient");
    }

    throw new ApiError(500, "Failed to send email");
  }
};

export { sendEmail };
