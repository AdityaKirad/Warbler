export function parseCookies(cookieHeader: string) {
  const cookies = cookieHeader.split("; ");
  const cookieMap = new Map<string, string>();

  cookies.forEach((cookie) => {
    const [name, value] = cookie.split("=");
    cookieMap.set(name!, value!);
  });

  return cookieMap;
}
