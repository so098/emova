import { describe, it, expect } from "vitest";
import { encodeQuestionSlug, decodeQuestionSlug } from "./questionSlug";

describe("questionSlug", () => {
  it("인코딩 → 디코딩 라운드트립", () => {
    for (let i = 0; i < 10; i++) {
      const slug = encodeQuestionSlug(i);
      expect(decodeQuestionSlug(slug)).toBe(i);
    }
  });

  it("인코딩 결과가 URL-safe 문자만 포함한다", () => {
    const slug = encodeQuestionSlug(0);
    expect(slug).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("같은 인덱스는 항상 같은 slug를 반환한다", () => {
    expect(encodeQuestionSlug(3)).toBe(encodeQuestionSlug(3));
  });

  it("다른 인덱스는 다른 slug를 반환한다", () => {
    expect(encodeQuestionSlug(0)).not.toBe(encodeQuestionSlug(1));
  });

  it("잘못된 slug는 null을 반환한다", () => {
    expect(decodeQuestionSlug("invalid")).toBeNull();
  });

  it("빈 문자열은 null을 반환한다", () => {
    expect(decodeQuestionSlug("")).toBeNull();
  });

  it("prefix가 없는 base64는 null을 반환한다", () => {
    const noPrefix = Buffer.from("3").toString("base64").replace(/=/g, "");
    expect(decodeQuestionSlug(noPrefix)).toBeNull();
  });
});
