import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

export const emailService = {

    async sendVerificationCode(to: string, code: string) {
        console.log(code);

        await transporter.sendMail({
            from: `"PostFlow" <${process.env.EMAIL_USER}>`,
            to,
            subject: "Код подтверждения регистрации",
            html: `
                <p>Ваш код подтверждения:</p>
                <h2>${code}</h2>
                <p>Код действителен 10 минут.</p>
            `,
        });
    },
};