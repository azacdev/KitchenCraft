import { pageSessionMachine } from "@/app/page-session-machine";
import { createActorHTTPClient } from "@/lib/actor-kit";
import { getCurrentUserId } from "@/lib/auth/session";
import { verifyToken } from "@/lib/jwt-tokens";
import assert from "assert";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const callbackUrl = searchParams.get("callbackUrl");
  const connectionToken = searchParams.get("connectionToken");
  assert(connectionToken, "expected connectionToken");
  const result = await verifyToken(connectionToken);
  const pageSessionId = result.sub;
  const connectionId = result.jti;

  const userId = await getCurrentUserId();
  assert(userId, "expected userId");

  const client = createActorHTTPClient<typeof pageSessionMachine, "system">({
    type: "page_session",
    caller: {
      id: randomUUID(),
      type: "system",
    },
  });
  await client.send(pageSessionId, {
    type: "AUTHENTICATE",
    connectionId,
    userId,
  });

  if (callbackUrl) {
    redirect(callbackUrl);
  }

  redirect("/");
}
