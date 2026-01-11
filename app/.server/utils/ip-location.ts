import { getClientIPAddress } from "remix-utils/get-client-ip-address";

export async function getIpLocation(
  request: Request,
): Promise<{ city: string; region: string } | null> {
  const ip = getClientIPAddress(request.headers);

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json`);

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
