import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const brandInput = z.object({
  name: z.string().min(1),
  website: z.string().default(""),
  industry: z.string().default(""),
  audience: z.string().default(""),
  offer: z.string().default(""),
  tone: z.string().default(""),
});

const contentInput = z.object({
  brief: z.string().min(1),
  pattern: z.string().min(1),
  brand: z.object({
    name: z.string().default("the brand"),
    vibe: z.array(z.string()).default([]),
    positioning: z.string().default(""),
    tone: z.string().default(""),
    audience: z.string().default(""),
  }),
});

const leadInput = z.object({
  channel: z.string().default("instagram"),
  handle: z.string().min(1),
  message: z.string().min(1),
  brand: z.object({
    name: z.string().default("the brand"),
    offer: z.string().default(""),
    replyTone: z.string().default("fast, friendly, direct"),
    template: z.string().default(""),
  }),
});

export const analyzeBrand = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => brandInput.parse(data))
  .handler(async ({ data }) => {
    const { analyzeBrandWithAI } = await import("./orbit-ai.server");
    return analyzeBrandWithAI(data);
  });

export const generateContent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contentInput.parse(data))
  .handler(async ({ data }) => {
    const { generateContentWithAI } = await import("./orbit-ai.server");
    return generateContentWithAI(data);
  });

export const qualifyLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => leadInput.parse(data))
  .handler(async ({ data }) => {
    const { qualifyLeadWithAI } = await import("./orbit-ai.server");
    return qualifyLeadWithAI(data);
  });
