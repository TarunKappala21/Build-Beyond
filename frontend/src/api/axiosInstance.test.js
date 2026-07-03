import { describe, expect, it } from "vitest";
import axiosInstance from "./axiosInstance";

describe("axiosInstance", () => {
  it("enables credentials by default", () => {
    expect(axiosInstance.defaults.withCredentials).toBe(true);
  });

  it("has a string baseURL value", () => {
    expect(typeof axiosInstance.defaults.baseURL).toBe("string");
  });
});
