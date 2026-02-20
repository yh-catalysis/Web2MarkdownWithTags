export function validateUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported URL scheme: ${parsed.protocol}`);
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new Error(
      `Access to private/reserved address is not allowed: ${parsed.hostname}`,
    );
  }
}

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost") return true;

  // IPv6 — new URL() keeps brackets: [::1], [fc00::1], etc.
  if (lower.startsWith("[") && lower.endsWith("]")) {
    return isPrivateIPv6(lower.slice(1, -1));
  }

  // IPv4 — new URL() normalizes hex/octal/decimal IPs to dotted decimal
  const ipv4Parts = parseIPv4(lower);
  if (ipv4Parts) return isPrivateIPv4(ipv4Parts);

  return false;
}

function parseIPv4(host: string): number[] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => isNaN(n) || n < 0 || n > 255)) return null;
  return nums;
}

function isPrivateIPv4(parts: number[]): boolean {
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

function isPrivateIPv6(addr: string): boolean {
  if (addr === "::1" || addr === "::") return true;
  // Unique Local Address (fc00::/7)
  if (addr.startsWith("fc") || addr.startsWith("fd")) return true;
  // Link-local (fe80::/10 = fe80:: ~ febf::)
  if (/^fe[89ab][0-9a-f]:/.test(addr)) return true;
  // IPv4-mapped IPv6 — new URL() normalizes to hex form: ::ffff:XXXX:XXXX
  if (addr.startsWith("::ffff:")) {
    return isPrivateIPv4Mapped(addr.slice(7));
  }
  return false;
}

function isPrivateIPv4Mapped(suffix: string): boolean {
  // Dotted decimal form: ::ffff:127.0.0.1 (may appear in some runtimes)
  const ipv4Parts = parseIPv4(suffix);
  if (ipv4Parts) return isPrivateIPv4(ipv4Parts);

  // Hex form: 7f00:1 (Node.js/V8 normalize to this)
  const hexParts = suffix.split(":");
  if (hexParts.length === 2) {
    const hi = parseInt(hexParts[0], 16);
    const lo = parseInt(hexParts[1], 16);
    if (!isNaN(hi) && !isNaN(lo)) {
      return isPrivateIPv4([
        (hi >> 8) & 0xff,
        hi & 0xff,
        (lo >> 8) & 0xff,
        lo & 0xff,
      ]);
    }
  }

  return false;
}
