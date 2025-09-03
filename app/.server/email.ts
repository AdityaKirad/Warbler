import { Plunk } from "@plunk/node/dist/lib/Plunk";
import { render } from "@react-email/render";

const plunk = new Plunk(process.env.PLUNK_API_KEY);

export async function sendEmail({
  react,
  subject,
  to,
}: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}) {
  const body = await render(react);

  return plunk.emails.send({
    to,
    subject,
    body,
    type: "html",
  });
}
