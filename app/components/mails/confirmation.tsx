import { Heading, Text } from "@react-email/components";
import MailLayout from "./layout";

type Props = Readonly<{ otp: string }>;

export default function ConfirmationMail({ otp }: Props) {
  return (
    <MailLayout preview="Confirm your email address">
      <Heading>Confirm your email address</Heading>
      <Text className="text-lg">
        There’s one quick step you need to complete before creating your Warbler account. Let’s make sure this is the
        right email address for you — please confirm this is the right address to use for your new account.
      </Text>
      <Text className="mb-0 text-lg">Please enter this verification code to get started on Warbler:</Text>
      <strong className="text-3xl">{otp}</strong>
      <Text className="mt-0 text-lg">Verification codes expires after ten minutes.</Text>
      <Text className="text-lg">Thanks,</Text>
      <Text className="mt-0 text-lg">Warbler</Text>
    </MailLayout>
  );
}
