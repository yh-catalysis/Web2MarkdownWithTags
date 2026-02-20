import { describe, it, expect } from "vitest";
import { isPaidConversion, isImageConversionAllowed } from "../image-gate.js";
import type { Env } from "../env.js";

describe("isPaidConversion", () => {
  it("returns true for image MIME types", () => {
    expect(isPaidConversion("file.bin", "image/jpeg")).toBe(true);
    expect(isPaidConversion("file.bin", "image/png")).toBe(true);
    expect(isPaidConversion("file.bin", "image/webp")).toBe(true);
    expect(isPaidConversion("file.bin", "image/svg+xml")).toBe(true);
    expect(isPaidConversion("file.bin", "image/gif")).toBe(true);
  });

  it("returns true for image file extensions", () => {
    expect(isPaidConversion("photo.jpg", "application/octet-stream")).toBe(true);
    expect(isPaidConversion("photo.jpeg", "application/octet-stream")).toBe(true);
    expect(isPaidConversion("photo.png", "application/octet-stream")).toBe(true);
    expect(isPaidConversion("photo.webp", "application/octet-stream")).toBe(true);
    expect(isPaidConversion("photo.svg", "application/octet-stream")).toBe(true);
  });

  it("is case-insensitive for extensions", () => {
    expect(isPaidConversion("PHOTO.JPG", "application/octet-stream")).toBe(true);
    expect(isPaidConversion("Photo.PNG", "application/octet-stream")).toBe(true);
  });

  it("returns false for free formats", () => {
    expect(isPaidConversion("doc.pdf", "application/pdf")).toBe(false);
    expect(isPaidConversion("doc.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(false);
    expect(isPaidConversion("data.csv", "text/csv")).toBe(false);
    expect(isPaidConversion("page.html", "text/html")).toBe(false);
    expect(isPaidConversion("data.xml", "application/xml")).toBe(false);
  });

  // MIME type takes priority — image MIME with non-image extension is still paid
  it("detects paid conversion when MIME is image but extension is not", () => {
    expect(isPaidConversion("doc.pdf", "image/jpeg")).toBe(true);
    expect(isPaidConversion("data.csv", "image/png")).toBe(true);
  });

  // Extension detection — image extension with non-image MIME is still paid
  it("detects paid conversion when extension is image but MIME is not", () => {
    expect(isPaidConversion("photo.jpg", "application/pdf")).toBe(true);
    expect(isPaidConversion("image.png", "text/plain")).toBe(true);
  });

  // .gif is not in IMAGE_EXTENSIONS — only caught by MIME prefix
  it("does not catch .gif by extension alone", () => {
    expect(isPaidConversion("animation.gif", "application/octet-stream")).toBe(false);
  });

  it("returns false for files without extension", () => {
    expect(isPaidConversion("document", "application/pdf")).toBe(false);
    expect(isPaidConversion("document", "text/csv")).toBe(false);
  });

  it("returns true for files without extension if MIME is image", () => {
    expect(isPaidConversion("document", "image/png")).toBe(true);
  });
});

describe("isImageConversionAllowed", () => {
  it("returns true when ALLOW_IMAGE_CONVERSION is 'true'", () => {
    expect(isImageConversionAllowed({ ALLOW_IMAGE_CONVERSION: "true" } as Env)).toBe(true);
  });

  it("returns false when ALLOW_IMAGE_CONVERSION is 'false'", () => {
    expect(isImageConversionAllowed({ ALLOW_IMAGE_CONVERSION: "false" } as Env)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isImageConversionAllowed({ ALLOW_IMAGE_CONVERSION: "" } as Env)).toBe(false);
  });

  it("returns false for 'TRUE' (case-sensitive)", () => {
    expect(isImageConversionAllowed({ ALLOW_IMAGE_CONVERSION: "TRUE" } as Env)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isImageConversionAllowed({} as Env)).toBe(false);
  });
});
