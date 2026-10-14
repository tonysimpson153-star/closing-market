import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import type { TrpcContext } from "../server/_core/context";

const state = vi.hoisted(() => ({ user: {} as any }));
const database = vi.hoisted(() => ({
  getUserById: vi.fn(), getUserByNickname: vi.fn(), getUserByKakaoId: vi.fn(),
  createUserByEmail: vi.fn(), updateUserProfile: vi.fn(), deleteAccount: vi.fn(),
}));
vi.mock("../server/db", () => database);
vi.mock("../server/_core/env", () => ({ ENV: { jwtSecret: "regression-test-secret-only" } }));
vi.mock("../server/_core/push-notifications", () => ({ sendChatPushNotification: vi.fn() }));
import { appRouter } from "../server/routers";

function caller() {
  return appRouter.createCaller({ user: state.user, req: { headers: {} }, res: {} } as TrpcContext);
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  state.user = { id: 101, openId: "kakao_42", name: "카카오이름", nickname: null, phone: "01012345678", email: null,
    password: null, loginMethod: "kakao", kakaoId: "42", appleId: null, role: "user", isVerified: false,
    sellerStatus: null, companyStatus: null, profileImageUrl: null, suspendedAt: null };
  database.getUserById.mockImplementation(async () => ({ ...state.user }));
  database.getUserByNickname.mockResolvedValue(null);
  database.getUserByKakaoId.mockImplementation(async () => ({ ...state.user }));
  database.updateUserProfile.mockImplementation(async (_id, values) => {
    Object.assign(state.user, values);
    return { ...state.user };
  });
  database.createUserByEmail.mockImplementation(async (values) => { Object.assign(state.user, values); return { ...state.user }; });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42, kakao_account: { profile: { nickname: "카카오이름" } } }) }));
});

describe("account auth/profile regression (isolated database)", () => {
  it("persists nickname and phone and returns both on a fresh me query", async () => {
    const result = await caller().user.updateProfile({ nickname: "  활동닉네임  ", phone: "01099998888" });
    expect(result).toMatchObject({ nickname: "활동닉네임", phone: "01099998888", loginMethod: "kakao" });
    const token = jwt.sign({ userId: state.user.id }, "regression-test-secret-only");
    expect(await caller().auth.me({ token })).toMatchObject({ nickname: "활동닉네임", phone: "01099998888", loginMethod: "kakao" });
  });
  it("nickname-only update preserves the existing phone", async () => {
    expect(await caller().user.updateProfile({ nickname: "새닉네임" })).toMatchObject({ nickname: "새닉네임", phone: "01012345678" });
  });
  it("photo-only update never clears nickname or phone", async () => {
    state.user.nickname = "내활동명";
    expect(await caller().user.updateProfile({ profileImageUrl: "https://example.com/photo.jpg" })).toMatchObject({ nickname: "내활동명", phone: "01012345678" });
  });
  it("duplicate nickname blocks every field write, including phone", async () => {
    database.getUserByNickname.mockResolvedValue({ id: 202 });
    await expect(caller().user.updateProfile({ nickname: "사용중", phone: "01088887777" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(database.updateUserProfile).not.toHaveBeenCalled();
    expect(state.user.phone).toBe("01012345678");
  });
  it("database duplicate race is reported as nickname conflict", async () => {
    database.updateUserProfile.mockRejectedValue({ code: "ER_DUP_ENTRY", message: "Duplicate entry for users_nickname_unique" });
    await expect(caller().user.updateProfile({ nickname: "동시요청" })).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("a DB response with missing nickname is not falsely accepted", async () => {
    database.updateUserProfile.mockResolvedValue({ ...state.user, nickname: null });
    await expect(caller().user.updateProfile({ nickname: "유지할입력" })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
  it("new Kakao user uses the Kakao profile name", async () => {
    database.getUserByKakaoId.mockResolvedValue(null);
    const result = await caller().auth.kakaoLogin({ accessToken: "isolated-kakao-test-token" });
    expect(result.user).toMatchObject({ nickname: "카카오이름", loginMethod: "kakao" });
    expect(database.createUserByEmail).toHaveBeenCalledWith(expect.objectContaining({ nickname: "카카오이름", password: null }));
  });
  it("Kakao property nickname is used when the account profile is absent", async () => {
    database.getUserByKakaoId.mockResolvedValue(null);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 42, properties: { nickname: "카톡프로필" } }) }));
    expect((await caller().auth.kakaoLogin({ accessToken: "test" })).user.nickname).toBe("카톡프로필");
  });
  it("duplicate Kakao names get a name-based unique suffix", async () => {
    database.getUserByKakaoId.mockResolvedValue(null);
    database.getUserByNickname.mockImplementation(async (value) => value === "카카오이름" ? { id: 202 } : null);
    expect((await caller().auth.kakaoLogin({ accessToken: "test" })).user.nickname).toBe("카카오이름_2");
  });
  it("user-chosen nickname beginning with 클로징 is not overwritten at login", async () => {
    state.user.nickname = "클로징내가고른닉네임";
    expect((await caller().auth.kakaoLogin({ accessToken: "test" })).user.nickname).toBe("클로징내가고른닉네임");
    expect(database.updateUserProfile).not.toHaveBeenCalled();
  });
  it.each(["kakao", "apple"])("%s accounts can delete without password even with legacy password data", async (provider) => {
    Object.assign(state.user, { loginMethod: provider, password: "legacy-unused-password", kakaoId: null });
    expect(await caller().user.deleteAccount({})).toEqual({ success: true });
    expect(database.deleteAccount).toHaveBeenCalledWith(101);
  });
  it("legacy Kakao account is identified by its stored Kakao ID", async () => {
    state.user.loginMethod = null;
    const token = jwt.sign({ userId: 101 }, "regression-test-secret-only");
    expect((await caller().auth.me({ token })).loginMethod).toBe("kakao");
    expect(await caller().user.deleteAccount({})).toEqual({ success: true });
  });
  it("email-password accounts still require password for deletion", async () => {
    Object.assign(state.user, { loginMethod: "email", kakaoId: null, password: "hash" });
    await expect(caller().user.deleteAccount({})).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(database.deleteAccount).not.toHaveBeenCalled();
  });
});
