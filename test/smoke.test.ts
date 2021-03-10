import { createOAuthClientAuth } from "../src";

describe("Smoke test", () => {
  it("is a function", () => {
    expect(createOAuthClientAuth).toBeInstanceOf(Function);
  });

  it("createOAuthClientAuth.VERSION is set", () => {
    expect(createOAuthClientAuth.VERSION).toEqual("0.0.0-development");
  });
});
