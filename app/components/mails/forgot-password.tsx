import { Heading, Text } from "@react-email/components";
import MailLayout from "./layout";

export function ForgotPasswordMail({ username, otp }: { username: string; otp: string }) {
  return (
    <MailLayout preview="Password reset request">
      <Heading>Reset your password?</Heading>
      <Text className="text-lg">
        If you requested a password reset for @{username}, use the confirmation code below to complete the process. If
        you didnt make this request, ignore this mail
      </Text>
      <strong className="text-3xl">{otp}</strong>
    </MailLayout>
  );
}
