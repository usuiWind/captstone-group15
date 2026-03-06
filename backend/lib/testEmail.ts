import { emailService } from "./email";

async function test() {
  await emailService.sendPaymentSuccessEmail(
    "fitpofuh@gmail.com",
    99.99,
    "Annual Plan",
    new Date("2027-03-06")
  );
  console.log("✅ Email sent successfully!");
}

test();