import { z } from "zod";

export const createPolicySchema = z.object({
  policy_code: z.string().min(1, "Policy code is required").max(50),
  policy_name: z.string().min(1, "Policy name is required").max(500),
  description: z.string().optional(),
  scope: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  department: z.string().max(255).optional(),
  classification: z.string().max(100).optional(),
  effective_date: z.string().optional(),
  review_date: z.string().optional(),
  review_frequency_months: z.number().int().min(1).max(60).optional(),
});

export const updatePolicySchema = createPolicySchema.partial();

export type CreatePolicyFormData = z.infer<typeof createPolicySchema>;
