import { z } from 'zod';

const registerSchema = z.object({
    username: z.string().min(8, "Username must be atleast 8 characters long"),
    email: z.email("Invalid email address"),
    fullName: z.string().optional().nullable(),
    password: z.string().min(8, "Password must be 8 characters long"),
    balance: z.number().min(0, "Money cannot be negative.").optional().default(0)
});

type register = z.infer<typeof registerSchema>;

const loginSchema = z.object({
    identifier: z.string().min(3, "Username or email is required"),
    password: z.string().min(8, "Password is required")
});

type login = z.infer<typeof loginSchema>;

export type {
    register,
    login
}

export {
    registerSchema,
    loginSchema
}