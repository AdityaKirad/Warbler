import { Body, Container, Head, Html, Preview, Section, Tailwind, Img } from "@react-email/components";

export default function MailLayout({ children, preview }: { children: React.ReactNode; preview: string }) {
  const Logo = `${process.env.URL}/logo-small.webp`;
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="m-0 bg-sky-50 font-sans">
          <Container className="h-screen max-w-lg bg-white p-4">
            <Section>
              <Img
                className="ml-auto mr-0 bg-black bg-cover bg-no-repeat italic text-white"
                style={{ shapeMargin: "12px" }}
                src={Logo}
                alt="Warbler"
                width={48}
                height={48}
              />
            </Section>
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
