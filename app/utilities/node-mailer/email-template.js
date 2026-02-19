const getEmailTemplate = (title, content) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7fa; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background: #4f46e5; padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .content { padding: 40px 30px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        .otp-box { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PickParking</h1>
        </div>
        <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">${title}</h2>
            ${content}
            <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
                Thank you,<br>The PickParking Team
            </p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PickParking. All rights reserved.</p>
            <p>This is an automated message, please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
};

module.exports = getEmailTemplate;
