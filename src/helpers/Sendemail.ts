
import nodemailer from "nodemailer"; // Correct import
import VerificationEmail from "../../emails/VerificationEmail";
import { render } from "@react-email/render"; // Convert React email to HTML
import { generateApprovalToken } from "./token";
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
      subject: "Welcome to Billing Counter ",
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
export async function SendEmailToAdmin(newUserEmail: string, username: string, userId: string) {
  try {
   const token = generateApprovalToken(userId);
    const approvalUrl = `https://kukreja-saree-center-git-main-vibhanshuvermas-projects.vercel.app/api/admin?token=${token}`;

    const html = `
      <h2>New Subscription Request</h2>
      <p>A new user has signed up and is requesting subscription access:</p>
      <ul>
        <li><strong>Username:</strong> ${username}</li>
        <li><strong>Email:</strong> ${newUserEmail}</li>
       
      </ul>
      <p>
        👉 <a href="${approvalUrl}" style="display:inline-block; padding:10px 15px; background:#4CAF50; color:white; text-decoration:none; border-radius:4px;">
        Approve This User</a>
      </p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_ADMIN,
      subject: "New Subscription Request from Billing Counter",
      html: html,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Admin notified of subscription request.' };
  } catch (error) {
    console.error('Error sending email to admin:', error);
    return { success: false, message: 'Failed to notify admin.' };
  }
}

export async function SendWelcomeEmail(email: string, username: string, password: string) {
  try {
    const html = `
      <h2>Welcome to Billing Counter, ${username}!</h2>
      <p>Your subscription has been approved. You can now log in with the following credentials:</p>
      <ul>
        <li><strong>Username:</strong> ${username}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p><a href="https://kukreja-saree-center-git-main-vibhanshuvermas-projects.vercel.app/sign-in">Click here to login</a></p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🎉 Subscription Approved - Welcome!",
      html,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    console.error('Error sending welcome email:', err);
    return { success: false };
  }
}
