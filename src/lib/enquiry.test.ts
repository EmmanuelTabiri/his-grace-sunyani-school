import { describe, it, expect } from 'vitest';
import { enquirySchema } from './enquiry';

describe('enquiry validation', () => {
  const valid = { full_name: 'Ama Mensah', email: 'ama@example.com', phone: '', message: 'Please share admission information.' };
  it('accepts a complete enquiry with optional phone empty', () => { expect(enquirySchema.safeParse(valid).success).toBe(true); });
  it('rejects invalid email', () => { expect(enquirySchema.safeParse({ ...valid, email: 'not-email' }).success).toBe(false); });
  it('rejects blank names and messages', () => { expect(enquirySchema.safeParse({ ...valid, full_name: '   ', message: ' ' }).success).toBe(false); });
});