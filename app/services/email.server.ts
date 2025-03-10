import { Plunk } from "@plunk/node/dist/lib/Plunk";
import { render } from "@react-email/components";

const plunk = new Plunk(process.env.PLUNK_API_KEY);

export async function sendEmail({
  react,
  subject,
  to,
}: {
  to: string | Array<string>;
  subject: string;
  react: React.ReactElement;
}) {
  const body = await render(react);

  return await plunk.emails.send({
    to,
    subject,
    body,
    type: "html",
  });
}
