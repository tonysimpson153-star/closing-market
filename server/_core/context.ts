import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import jwt from "jsonwebtoken";
import { getUserById } from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "closing-market-secret-2024";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const authHeader = opts.req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      if (decoded?.userId) {
        user = await getUserById(decoded.userId);
      }
    }
  } catch {
    // 토큰이 없거나 유효하지 않은 경우 - 공개 API는 user=null로 처리
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
