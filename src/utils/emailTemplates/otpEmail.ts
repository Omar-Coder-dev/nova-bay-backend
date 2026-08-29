const otpEmailTemplate = (otp: string): string => {
  return `
  <div style="background-color: #f4f4f7; padding: 40px 20px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">
    <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
      
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.02em;">
          Password Reset
        </h1>
      </div>

      <div style="padding: 40px;">
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0; text-align: center;">
          We received a request to reset your password. Enter the code below to continue.
        </p>

        <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #6366f1; font-family: 'Courier New', monospace;">
            ${otp}
          </span>
        </div>

        <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0 0 4px 0;">
          This code expires in <strong style="color: #6b7280;">10 minutes</strong>.
        </p>
        <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">
          Didn't request this? You can safely ignore this email.
        </p>
      </div>

      <div style="background-color: #fafafa; padding: 20px 40px; text-align: center; border-top: 1px solid #f0f0f0;">
        <p style="color: #b0b0b0; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} Nova Bay. All rights reserved.
        </p>
      </div>

    </div>
  </div>
  `;
};

export default otpEmailTemplate;