import tls from "tls";
import net from "net";

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Lightweight, zero-dependency SMTP email sender using Node.js built-in TLS/NET.
 * Supports standard SMTP (Gmail, Hostinger, cPanel, SendGrid, Mailgun, Amazon SES, etc.)
 */
export async function sendEmail(options: SendMailOptions): Promise<{ success: boolean; error?: string }> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const fromName = process.env.SMTP_FROM_NAME || "Luggage & Baggage";
  const fromEmail = process.env.SMTP_FROM_EMAIL || user || "noreply@lumina.com";

  if (!user || !pass) {
    // SMTP credentials not configured
    return { success: false, error: "SMTP credentials not configured" };
  }

  return new Promise((resolve) => {
    let socket: any;
    let step = 0;
    const cleanTo = options.to.trim();

    const send = (str: string) => {
      socket.write(str + "\r\n");
    };

    const cleanup = (success: boolean, error?: string) => {
      try {
        socket?.end();
      } catch {}
      resolve({ success, error });
    };

    const onData = (data: Buffer) => {
      const msg = data.toString();
      const code = parseInt(msg.slice(0, 3), 10);

      if (code >= 400 && code < 600) {
        cleanup(false, `SMTP Error (${code}): ${msg.trim()}`);
        return;
      }

      switch (step) {
        case 0: // Server greeting
          send(`EHLO ${host}`);
          step++;
          break;
        case 1: // EHLO response
          send("AUTH LOGIN");
          step++;
          break;
        case 2: // Enter Username
          send(Buffer.from(user).toString("base64"));
          step++;
          break;
        case 3: // Enter Password
          send(Buffer.from(pass).toString("base64"));
          step++;
          break;
        case 4: // Auth success
          send(`MAIL FROM:<${fromEmail}>`);
          step++;
          break;
        case 5: // Sender OK
          send(`RCPT TO:<${cleanTo}>`);
          step++;
          break;
        case 6: // Recipient OK
          send("DATA");
          step++;
          break;
        case 7: // Send Message Body
          const emailData = [
            `From: "${fromName}" <${fromEmail}>`,
            `To: <${cleanTo}>`,
            `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString("base64")}?=`,
            "MIME-Version: 1.0",
            "Content-Type: text/html; charset=UTF-8",
            "",
            options.html,
            "",
            ".",
          ].join("\r\n");
          send(emailData);
          step++;
          break;
        case 8: // Sent OK
          send("QUIT");
          cleanup(true);
          break;
      }
    };

    if (port === 465) {
      socket = tls.connect(port, host, { rejectUnauthorized: false }, () => {
        // Connected TLS
      });
    } else {
      socket = net.connect(port, host, () => {
        // Connected Plain/STARTTLS
      });
    }

    socket.on("data", onData);
    socket.on("error", (err: any) => cleanup(false, err.message));
    socket.setTimeout(10000, () => cleanup(false, "SMTP connection timed out"));
  });
}

