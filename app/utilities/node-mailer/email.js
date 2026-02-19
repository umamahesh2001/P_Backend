const nodeMailer = require('nodemailer')
const sendEmail = async (data) => {
    // create transporter
    const transport = nodeMailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.email,
            pass: process.env.password
        }
    });

    const mailOptions = {
        from: `"PickParking Support" <${process.env.email}>`,
        to: data.email,
        subject: data.subject || "Notification from PickParking",
        text: data.text, // Fallback plain text
        html: data.html  // HTML content
    };

    try {
        await transport.sendMail(mailOptions);
        console.log(`Email sent successfully to ${data.email}`);
    } catch (err) {
        console.error("Error sending email:", err);
        throw err; // Re-throw so controllers know if it failed
    }
};
module.exports = sendEmail