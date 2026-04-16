const ALPHABETS = {
  "a-z": "abcdefghijklmnopqrstuvwxyz",
  "A-Z": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "0-9": "0123456789",
  "-_": "-_",
} as const;

type AlphabetsKey = keyof typeof ALPHABETS;

const DEFAULT_CHARSET = Object.values(ALPHABETS).join("");

export function generateRandomString(
  length: number,
  props?: { alphabet?: AlphabetsKey[]; omit?: string },
) {
  if (length <= 0) {
    throw new Error("Length must be a positive integer.");
  }

  const baseCharset = props?.alphabet
    ? props.alphabet.map((key) => ALPHABETS[key]).join("")
    : DEFAULT_CHARSET;

  if (!baseCharset) {
    throw new Error("At least one alphabet must be specified.");
  }

  const charSet = props?.omit
    ? baseCharset
        .split("")
        .filter((char) => props.omit?.includes(char))
        .join("")
    : baseCharset;

  if (!charSet) {
    throw new Error("No valid characters remaining after omitting.");
  }

  const maxValid = Math.floor(256 / charSet.length) * charSet.length;
  const buf = new Uint8Array(length * 2);
  const bufLength = buf.length;
  let result = "";
  let bufIndex = bufLength;

  while (result.length < length) {
    if (bufIndex >= bufLength) {
      crypto.getRandomValues(buf);
      bufIndex = 0;
    }

    const rand = buf[bufIndex++]!;
    if (rand < maxValid) {
      result += charSet[rand % charSet.length];
    }
  }

  return result;
}
