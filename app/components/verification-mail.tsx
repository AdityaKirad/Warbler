import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { VerificationType } from "~/.server/authenticator";

type MailProps =
  | { type: "signup"; code: string }
  | { type: "forget-password"; code: string; username: string }
  | { type: "verify-email"; code: string; username: string };

const preview: Record<VerificationType, string> = {
  signup: "Confirm your email address",
  "forget-password": "Reset your password",
  "verify-email": "Verify your email address",
};

export function VerificationMail(props: Readonly<MailProps>) {
  return (
    <Html>
      <Head />
      <Preview>{preview[props.type]}</Preview>
      <Tailwind>
        <Body className="m-0 bg-sky-50 font-sans">
          <Container className="h-screen max-w-lg bg-white p-4">
            <Section>
              <Img
                alt="Warbler"
                className="mr-0 ml-auto bg-black bg-cover bg-no-repeat text-white italic"
                height={48}
                src={`${process.env.URL}/logo-small.webp`}
                style={{ shapeMargin: "12px" }}
                width={48}
              />
            </Section>
            {props.type === "signup" ? (
              <SignupMail code={props.code} />
            ) : props.type === "forget-password" ? (
              <ResetPasswordMail code={props.code} username={props.username} />
            ) : props.type === "verify-email" ? (
              <VerifyEmailMail code={props.code} username={props.username} />
            ) : null}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

function SignupMail({ code }: { code: string }) {
  return (
    <>
      <Heading>Confirm your email address</Heading>
      <Text className="text-lg">
        There&apos;s one quick step you need to complete before creating your
        Warbler account. Let&apos;s make sure this is the right email address
        for you — please confirm this is the right address to use for your new
        account.
      </Text>
      <Text className="mb-0 text-lg">
        Please enter this verification code to get started on Warbler:
      </Text>
      <strong className="text-3xl">{code}</strong>
      <Text className="mt-0 text-lg">
        Verification code expires after 10 minutes.
      </Text>
      <Text className="text-lg">Thanks,</Text>
      <Text className="mt-0 text-lg">Warbler</Text>
    </>
  );
}

function ResetPasswordMail({
  code,
  username,
}: {
  code: string;
  username: string;
}) {
  return (
    <>
      <Heading>Reset your password?</Heading>
      <Text className="text-lg">
        If you requested a password reset for @{username}, use the confirmation
        code below to complete the process. If you didnt make this request,
        ignore this mail
      </Text>
      <strong className="text-3xl">{code}</strong>
    </>
  );
}

function VerifyEmailMail({
  code,
  username,
}: {
  code: string;
  username: string;
}) {
  return (
    <>
      <Heading>Verify your email address</Heading>
      <Text className="text-lg">
        Please verify your email for account associated with this username @
        {username}, use the confirmationn code below to complete the process. If
        you didnt made this request you can safely ignore this mail
      </Text>
      <strong className="text-3xl">{code}</strong>
    </>
  );
}
