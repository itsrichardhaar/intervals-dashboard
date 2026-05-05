import { Resend } from "resend";

export interface EmailContent {
  subject: string;
  html: string;
}

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

export const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "digest@intervals-dashboard.com";
