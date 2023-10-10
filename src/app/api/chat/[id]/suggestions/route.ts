// ./app/api/chat/route.ts
import { RECIPE_SUGGESTIONS_SYSTEM_PROMPT } from "@/app/prompts";
import { assert } from "@/lib/utils";
import { MessageContentSchema, MessageSchema, RoleSchema } from "@/schema";
import {
  AssistantMessage,
  LLMMessageSet,
  Message,
  SystemMessage,
  UserMessage,
} from "@/types";
import { kv } from "@vercel/kv";
import { OpenAIStream, StreamingTextResponse, nanoid } from "ai";
import OpenAI from "openai";
import { z } from "zod";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // todo add rate limit check to make sure we dont already have a query in flight...

  const json = await req.json();
  const { messages: userMessages } = z
    .object({
      messages: z.array(
        z.object({
          role: z.literal("user"),
          content: z.string().nonempty(),
        })
      ),
    })
    .parse(json);
  assert(userMessages.length === 1, "only single messages currently supported");

  const chatId = params.id; // Extracting chatId from the dynamic route parameter

  const systemMessage = {
    id: nanoid(),
    role: "system",
    type: "query",
    chatId,
    content: RECIPE_SUGGESTIONS_SYSTEM_PROMPT,
  } satisfies SystemMessage;

  const assistantMessage = {
    id: nanoid(),
    chatId,
    role: "assistant" as const,
    type: "query",
    state: "running",
  } satisfies AssistantMessage;

  const userMessage = {
    id: nanoid(),
    chatId,
    type: "query",
    ...userMessages[0],
  } satisfies UserMessage;

  // Store the messages from the user
  const newMessages: LLMMessageSet = [
    systemMessage,
    userMessage,
    assistantMessage,
  ];
  const assistantMessageId = assistantMessage.id;

  const multi = kv.multi();
  newMessages.map(async (message, index) => {
    const time = Date.now() + index / 1000;
    multi.hset(`message:${message.id}`, message);
    return multi.zadd(`chat:${message.chatId}:messages`, {
      score: time,
      member: message.id,
    });
  });
  await multi.exec();

  const messages = [systemMessage, ...userMessages].map(
    ({ role, content }) => ({ role, content })
  );

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages,
  });

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await kv.hset(`message:${assistantMessageId}`, {
        content: completion,
        state: "done",
      });
    },
  });

  return new StreamingTextResponse(stream);
}
