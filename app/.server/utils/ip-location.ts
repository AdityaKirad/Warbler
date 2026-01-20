import { getClientIPAddress } from "remix-utils/get-client-ip-address";

export async function getIpLocation(request: Request) {
  const ip = getClientIPAddress(request.headers);

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json`);

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
