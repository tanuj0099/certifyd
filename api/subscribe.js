import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // 1. Send confirmation email to the user
        await resend.emails.send({
            from: 'Certifyd Waitlist <hello@certifyd.co>',
            to: email,
            subject: 'Welcome to the Certifyd Priority Waitlist!',
            html: `
        <div style="font-family: sans-serif; padding: 20px; color: #111;">
          <h2>Welcome aboard, ${name || 'there'}!</h2>
          <p>Thank you for joining the priority waitlist for Certifyd.</p>
          <p>We will keep you updated as soon as early access slots open up.</p>
        </div>
      `,
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}