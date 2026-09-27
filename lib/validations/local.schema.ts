import { z } from "zod";

/** Validasi input form pendaftaran subscriber radio. */
export const SubscriberInputSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Nomor telepon tidak valid")
    .optional()
    .or(z.literal("")),
});

export type SubscriberInput = z.infer<typeof SubscriberInputSchema>;

/** Validasi pencatatan kunjungan (VisitorStat). */
export const VisitorInputSchema = z.object({
  path: z.string().trim().min(1).max(512),
  referrer: z.string().trim().max(1024).optional().or(z.literal("")),
});

export type VisitorInput = z.infer<typeof VisitorInputSchema>;
