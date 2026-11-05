import { z } from 'zod';

export const enquirySchema = z.object({
  full_name: z.string().trim().min(2, 'Please enter your full name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  phone: z.string().trim().max(40, 'Please check your phone number.'),
  message: z.string().trim().min(10, 'Please write a message of at least 10 characters.').max(3000),
});