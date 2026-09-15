import { afterEach, describe, expect, it, vi } from "vitest";

import { sendChatPushNotification } from "../server/_core/push-notifications";

describe("sendChatPushNotification", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns failure after the push request timeout instead of waiting indefinitely", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Push request timed out", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const pending = sendChatPushNotification("ExponentPushToken[test]", "판매자", "테스트", 1);

    await vi.advanceTimersByTimeAsync(4_000);

    await expect(pending).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
