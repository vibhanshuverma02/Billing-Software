
import nodemailer from "nodemailer"; // Correct import
import VerificationEmail from "../../emails/VerificationEmail";
import { render } from "@react-email/render"; // Convert React email to HTML

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Use an App Password for Gmail
  },
});

export async function Sendemail(email: string, username: string, verifyCode: string) {
  try {
    const emailHtml = await render(VerificationEmail({ username, otp: verifyCode }));


    const mailOptions = {
      from: process.env.EMAIL_USER, // Your personal email
      to: email,
      subject: "Mystery Message Verification Code",
      html:  emailHtml, // Use the rendered HTML instead of `react`
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Verification email sent successfully.' };
  } catch (emailError) {
    console.error('Error sending verification email:', emailError);
    return { success: false, message: 'Failed to send verification email.' };
  }

// Example usage (commented out)
// sendEmail("recipient@example.com", "JohnDoe", "123456");
}