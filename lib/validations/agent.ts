import { z } from "zod";

export const agentFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  phone: z.string().max(30).optional().or(z.literal("")),
});

export type AgentFormInput = z.infer<typeof agentFormSchema>;
