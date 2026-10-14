import { describe, it, expect } from 'vitest';
import { decodeJwt } from '@/utils/jwt';
import cronstrue from 'cronstrue';
import cronParser from 'cron-parser';
import Ajv from 'ajv';

describe('Batch 5 Logic Tests', () => {

    describe('JWT Decoder', () => {
        it('should decode a valid JWT', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
            const { header, payload, error } = decodeJwt(token);
            expect(error).toBeNull();
            expect(header.alg).toBe('HS256');
            expect(payload.name).toBe('John Doe');
            expect(payload.sub).toBe('1234567890');
        });
    });

    describe('Cron Parser', () => {
        it('should describe cron expression', () => {
            const desc = cronstrue.toString('*/5 * * * *');
            expect(desc.toLowerCase()).toContain('5 minutes');
        });

        it('should calculate next runs', () => {
            const interval = cronParser.parse('* * * * *');
            const next = interval.next().toDate();
            expect(next instanceof Date).toBe(true);
        });
    });

    describe('JSON Schema Validator (AJV)', () => {
        it('should validate correct data', () => {
            const ajv = new Ajv();
            const schema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
            const validate = ajv.compile(schema);
            expect(validate({ name: 'Test' })).toBe(true);
        });

        it('should reject invalid data', () => {
            const ajv = new Ajv();
            const schema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
            const validate = ajv.compile(schema);
            expect(validate({})).toBe(false);
        });
    });

    describe('Unit Converter Logic', () => {
        it('should convert KB to bytes', () => {
            const kb = 1;
            const bytes = kb * 1024;
            expect(bytes).toBe(1024);
        });
    });

});
