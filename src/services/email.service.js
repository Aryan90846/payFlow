import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function createTransporter() {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) return null;
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
}

const transporter = createTransporter();

export function isEmailConfigured() {
  return Boolean(transporter);
}

// Email is best-effort: a failed send must never fail the API request
// that triggered it. Without SMTP config we log instead of crashing.
export async function sendEmail({ to, subject, text }) {
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.log(`[email: not configured] To: ${to} | Subject: ${subject}\n${text}`);
    return { sent: false, reason: 'email-not-configured' };
  }
  try {
    await transporter.sendMail({ from: env.smtp.from, to, subject, text });
    return { sent: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[email: send failed]', error.message);
    return { sent: false, reason: 'send-failed' };
  }
}

export const sendRegistrationEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: 'Welcome to PayFlow',
    text: `Hi ${user.name},\n\nWelcome to PayFlow! Your account has been created successfully.\n\nThanks,\nThe PayFlow Team`,
  });

export const sendSubscriptionEmail = (user, subscription, plan) =>
  sendEmail({
    to: user.email,
    subject: 'Your PayFlow subscription is confirmed',
    text: `Hi ${user.name},\n\nYour subscription to ${plan.name} is now active.\nBilling interval: ${subscription.billingInterval}\nAmount: ${subscription.currency} ${subscription.price}\nValid until: ${subscription.endDate.toISOString().slice(0, 10)}\n\nThanks,\nThe PayFlow Team`,
  });

export const sendPaymentEmail = (user, payment, succeeded) =>
  sendEmail({
    to: user.email,
    subject: succeeded ? 'Payment successful - PayFlow' : 'Payment failed - PayFlow',
    text: succeeded
      ? `Hi ${user.name},\n\nYour payment of ${payment.currency} ${payment.amount} was successful.\nTransaction reference: ${payment.transactionRef}\n\nThanks,\nThe PayFlow Team`
      : `Hi ${user.name},\n\nYour payment of ${payment.currency} ${payment.amount} failed.\nTransaction reference: ${payment.transactionRef}\nPlease try again.\n\nThanks,\nThe PayFlow Team`,
  });

export const sendCancellationEmail = (user, subscription) =>
  sendEmail({
    to: user.email,
    subject: 'Your PayFlow subscription was cancelled',
    text: `Hi ${user.name},\n\nYour subscription (id: ${subscription._id}) has been cancelled.\n\nThanks,\nThe PayFlow Team`,
  });

export const sendPasswordResetEmail = (user, resetToken) =>
  sendEmail({
    to: user.email,
    subject: 'Reset your PayFlow password',
    text: `Hi ${user.name},\n\nUse this token to reset your password (valid for 1 hour):\n${resetToken}\n\nIf you did not request this, ignore this email.\n\nThanks,\nThe PayFlow Team`,
  });
