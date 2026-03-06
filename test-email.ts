import "dotenv/config";
import { sendEmail } from "./src/lib/email";

async function testEmail() {
    console.log("Sending test email...");
    const result = await sendEmail({
        to: "mrefaie@milaknights.com",
        subject: "Test Email from MilaKnight OS",
        html: "<h1>It Works!</h1><p>Your environment variables are correctly configured locally.</p>"
    });
    console.log("Email Result: ", result);
}

testEmail();
