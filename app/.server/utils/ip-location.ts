import { getClientIPAddress } from "remix-utils/get-client-ip-address";

export async function getIpLocation(request: Request) {
  const ip = getClientIPAddress(request.headers);

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json`, {
      signal: AbortSignal.timeout(1000),
    });

    if (!res.ok) {
      return null;
    }

    const { city, region } = await res.json();
    return `${city}, ${region}`;
  } catch (error) {
    console.error(error);
    return null;
  }
}
