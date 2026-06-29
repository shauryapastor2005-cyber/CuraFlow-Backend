import { escapeHtml } from "../utils/escapeHtml.js";

const welcomeEmailTemplate = ({ fullname }) => {
  const safeFullname = escapeHtml(fullname || "there");

  return `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f4f7fb; padding:30px;">

    <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:8px; text-align:center;">

      <img
        src="https://res.cloudinary.com/dna6rpwb6/image/upload/v1782670990/Designer_orgak6.png"
        alt="CuraFlow AI"
        width="140"
      />

      <h2>Welcome to CuraFlow AI</h2>

      <p>Hello <strong>${safeFullname}</strong>,</p>

      <p>
        Welcome to CuraFlow AI.
        Your account has been created successfully.
      </p>

      <p>
        You can now manage patients, monitor vitals,
        track daily care logs and generate AI summaries.
      </p>

      <p>
        Thank you for choosing CuraFlow AI.
      </p>

      <hr>

      <small>
        This is an automated email from CuraFlow AI.
        Please do not reply.
      </small>

    </div>

  </body>
</html>
`;
};

export { welcomeEmailTemplate };
