import { describe, expect, it } from 'vitest';
import { feeBalance, attendanceSummary, canPublishResult } from './school-operations';
describe('school operations', () => {
 it('deducts partial payments from a charge', () => expect(feeBalance(500, 125)).toBe(375));
 it('counts absences and separates unmarked attendance', () => { expect(attendanceSummary([{status:'absent'},{status:'present'},{status:'late'}])).toEqual({present:1,absent:1,late:1,excused:0,total:3,rate:67}); expect(attendanceSummary([]).rate).toBeNull(); });
 it('requires leadership and approval before publishing', () => { expect(canPublishResult(true,'submitted')).toBe(false); expect(canPublishResult(false,'approved')).toBe(false); expect(canPublishResult(true,'approved')).toBe(true); });
});
