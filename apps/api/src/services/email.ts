// Simple stub for sendEmail used by retargeting
export const sendEmail = async (userId: string, subject: string, body: string) => {
  // In production, integrate with mailer service
  console.log(`Email to ${userId}: ${subject} - ${body}`);
  return true;
};
