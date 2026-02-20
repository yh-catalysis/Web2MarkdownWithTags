import { describe, it, expect } from "vitest";
import { validateUrl } from "../validate-url.js";

describe("validateUrl", () => {
  // --- Valid URLs ---
  it("allows public HTTP URLs", () => {
    expect(() => validateUrl("https://example.com")).not.toThrow();
    expect(() => validateUrl("http://example.com/path?q=1")).not.toThrow();
    expect(() => validateUrl("http://example.com:8080")).not.toThrow();
    expect(() => validateUrl("https://8.8.8.8")).not.toThrow();
    expect(() => validateUrl("https://1.1.1.1")).not.toThrow();
  });

  it("allows public IPv6 addresses", () => {
    expect(() => validateUrl("http://[2001:4860:4860::8888]")).not.toThrow();
  });

  // --- Invalid / unsupported ---
  it("rejects invalid URLs", () => {
    expect(() => validateUrl("not-a-url")).toThrow("Invalid URL");
    expect(() => validateUrl("")).toThrow("Invalid URL");
  });

  it("rejects non-http(s) schemes", () => {
    expect(() => validateUrl("ftp://example.com")).toThrow("Unsupported URL scheme");
    expect(() => validateUrl("file:///etc/passwd")).toThrow("Unsupported URL scheme");
    expect(() => validateUrl("javascript:alert(1)")).toThrow("Unsupported URL scheme");
  });

  // --- IPv4 private addresses ---
  it("blocks localhost", () => {
    expect(() => validateUrl("http://localhost")).toThrow("Access to private/reserved address");
    expect(() => validateUrl("http://localhost:3000")).toThrow();
    expect(() => validateUrl("http://LOCALHOST")).toThrow();
  });

  it("blocks private address with credentials in URL", () => {
    expect(() => validateUrl("http://user:pass@127.0.0.1")).toThrow();
  });

  it("blocks loopback (127.x.x.x)", () => {
    expect(() => validateUrl("http://127.0.0.1")).toThrow();
    expect(() => validateUrl("http://127.255.255.255")).toThrow();
  });

  it("blocks loopback with port", () => {
    expect(() => validateUrl("http://127.0.0.1:8080")).toThrow();
  });

  it("blocks 10.0.0.0/8", () => {
    expect(() => validateUrl("http://10.0.0.1")).toThrow();
    expect(() => validateUrl("http://10.255.255.255")).toThrow();
  });

  it("blocks 172.16.0.0/12", () => {
    expect(() => validateUrl("http://172.16.0.0")).toThrow();
    expect(() => validateUrl("http://172.16.0.1")).toThrow();
    expect(() => validateUrl("http://172.31.255.255")).toThrow();
  });

  it("allows non-private 172.x", () => {
    expect(() => validateUrl("http://172.15.255.255")).not.toThrow();
    expect(() => validateUrl("http://172.32.0.0")).not.toThrow();
  });

  it("blocks 192.168.0.0/16", () => {
    expect(() => validateUrl("http://192.168.0.0")).toThrow();
    expect(() => validateUrl("http://192.168.255.255")).toThrow();
  });

  it("blocks link-local (169.254.x.x)", () => {
    expect(() => validateUrl("http://169.254.0.0")).toThrow();
    expect(() => validateUrl("http://169.254.255.255")).toThrow();
  });

  it("blocks 0.x.x.x (current network)", () => {
    expect(() => validateUrl("http://0.0.0.0")).toThrow();
  });

  // --- SSRF bypass via alternative IP notations ---
  // new URL() normalizes these to dotted decimal before our check
  it("blocks decimal IP notation (2130706433 = 127.0.0.1)", () => {
    expect(() => validateUrl("http://2130706433")).toThrow();
  });

  it("blocks hex IP notation (0x7f000001 = 127.0.0.1)", () => {
    expect(() => validateUrl("http://0x7f000001")).toThrow();
  });

  it("blocks octal IP notation (0177.0.0.1 = 127.0.0.1)", () => {
    expect(() => validateUrl("http://0177.0.0.1")).toThrow();
  });

  // --- IPv6 ---
  it("blocks IPv6 unspecified address (:: = 0.0.0.0)", () => {
    expect(() => validateUrl("http://[::]")).toThrow();
  });

  it("blocks IPv6 loopback (::1)", () => {
    expect(() => validateUrl("http://[::1]")).toThrow();
  });

  it("blocks IPv6 ULA (fc00::/7)", () => {
    expect(() => validateUrl("http://[fc00::1]")).toThrow();
    expect(() => validateUrl("http://[fd12::1]")).toThrow();
  });

  it("blocks IPv6 link-local (fe80::/10)", () => {
    expect(() => validateUrl("http://[fe80::1]")).toThrow();
    expect(() => validateUrl("http://[fe9a::1]")).toThrow();
    expect(() => validateUrl("http://[febf::1]")).toThrow();
  });

  // --- IPv4-mapped IPv6 ---
  it("blocks IPv4-mapped IPv6 loopback", () => {
    expect(() => validateUrl("http://[::ffff:127.0.0.1]")).toThrow();
  });

  it("blocks IPv4-mapped IPv6 private addresses", () => {
    expect(() => validateUrl("http://[::ffff:10.0.0.1]")).toThrow();
    expect(() => validateUrl("http://[::ffff:192.168.1.1]")).toThrow();
    expect(() => validateUrl("http://[::ffff:172.16.0.1]")).toThrow();
    expect(() => validateUrl("http://[::ffff:169.254.1.1]")).toThrow();
  });

  it("allows IPv4-mapped IPv6 public addresses", () => {
    expect(() => validateUrl("http://[::ffff:8.8.8.8]")).not.toThrow();
  });
});
