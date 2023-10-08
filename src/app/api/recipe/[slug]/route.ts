// ./app/api/chat/route.ts
import { getLLMMessageSet, getRecipe } from "@/lib/db";
import { assert } from "@/lib/utils";
import { RecipePromptResultSchema, RecipeViewerDataSchema } from "@/schema";
import { AssistantMessage, Message, UserMessage } from "@/types";
import * as yaml from "js-yaml";
import { kv } from "@vercel/kv";
import { OpenAIStream, StreamingTextResponse, nanoid } from "ai";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function GET(
  _: Request,
  { params }: { params: { slug: string } }
) {
  const recipe = await kv.hgetall(`recipe:${params.slug}`);
  return NextResponse.json(recipe);
}

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

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
  console.log({ userMessages });
  console.log(params.slug);
  const recipe = await getRecipe(kv, params.slug);
  console.log({ recipe });

  const [_, queryUserMessage, queryAssistantMessage] = await getLLMMessageSet(
    kv,
    recipe.queryMessageSet
  );

  const SYSTEM_CONTENT = `
The original query to generate recipes was: ${queryUserMessage.content}
Based on this query, a list of recipe options was generated: ${queryAssistantMessage.content}

The user will provide the name and description they selected. Please generate a full recipe for this selection following the specified format.

Format: Provide the recipe information in YAML format. Below is an example order of the keys you should return in the object.

prepTime: "ISO 8601 duration format (e.g., PT15M for 15 minutes)"
cookTime: "ISO 8601 duration format (e.g., PT1H for 1 hour)"
totalTime: "ISO 8601 duration format (e.g., PT1H15M for 1 hour 15 minutes)"
keywords: "Keywords related to the recipe, comma separated"
recipeYield: "Yield of the recipe (e.g., '1 loaf', '4 servings')"
recipeCategory: "The type of meal or course (e.g., dinner, dessert)"
recipeCuisine: "The cuisine of the recipe (e.g., Italian, Mexican)"
recipeIngredient: 
  - "Quantity and ingredient (e.g., '3 or 4 ripe bananas, smashed')"
  - "Another ingredient"
  - "And another ingredient"
recipeInstructions:
  - "@type": "HowToStep"
    text: "A step for making the item"
  - "@type": "HowToStep"
    text: "Another step for making the item"
`;

  const systemMessage = {
    id: nanoid(),
    role: "system",
    type: "recipe",
    chatId: recipe.chatId,
    content: SYSTEM_CONTENT,
  } satisfies Message;
  const assistantMessage = {
    id: nanoid(),
    chatId: recipe.chatId,
    role: "assistant" as const,
    type: "recipe",
    state: "running",
  } satisfies Omit<AssistantMessage, "content">;

  const userMessage = {
    id: nanoid(),
    chatId: recipe.chatId,
    type: "recipe",
    ...userMessages[0],
  } satisfies UserMessage;

  const newMessages = [systemMessage, userMessage, assistantMessage] as const;
  const messageSet = newMessages.map(({ id }) => id);
  const assistantMessageId = assistantMessage.id;

  const multi = kv.multi();
  const promises = newMessages.map(async (message, index) => {
    const time = Date.now();
    await multi.hset(`message:${message.id}`, message);
    return await multi.zadd(`chat:${message.chatId}:messages`, {
      score: time + index / 100,
      member: message.id,
    });
  });
  await multi.hset(`recipe:${slug}`, {
    messageSet,
  });
  await Promise.all(promises);
  await multi.exec();

  const messages = [systemMessage, ...userMessages].map(
    ({ role, content }) => ({ role, content })
  );

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages,
  });

  let content = "";
  try {
    const stream = OpenAIStream(response, {
      async onToken(token) {
        content = content + token;
      },
      async onCompletion(completion) {
        await kv.hset(`message:${assistantMessageId}`, {
          content: JSON.stringify(completion),
          state: "done",
        });

        try {
          const json = yaml.load(completion);
          const data = RecipeViewerDataSchema.parse(json);
          await kv.hset(`recipe:${slug}`, data);
          await kv.zadd(`recipes:new`, {
            score: Date.now(),
            member: slug,
          });
        } catch (ex) {
          console.error("Error parsing yaml completion", ex);
        }
        // await kv.hset(`recipe:${slug}`, data);
      },
      async onFinal(completion) {
        console.log("FINAL!");
        // await kv.hset(`message:${assistantMessageId}`, {
        //   state: "done",
        // });
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    // todo likely a cancellation from chatgpt... try cleaning up...
    console.error(error, content);
    // todo how do i handle this stream
    // if (error instanceof OpenAI.APIError) {
    //   const { name, status, headers, message } = error;
    //   return NextResponse.json({ name, status, headers, message }, { status });
    // } else {
    //   throw error;
    // }
  }
}