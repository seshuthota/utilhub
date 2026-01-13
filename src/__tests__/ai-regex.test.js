/**
 * Test cases for AI-generated regex patterns
 * Run with: node src/__tests__/ai-regex.test.js
 */

// Test runner
function testRegex(name, pattern, flags, shouldMatch, shouldNotMatch) {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   Pattern: ${pattern.substring(0, 60)}${pattern.length > 60 ? '...' : ''}`);
    console.log(`   Flags: ${flags}`);

    let regex;
    try {
        regex = new RegExp(pattern, flags);
    } catch (e) {
        console.log(`   ❌ INVALID REGEX: ${e.message}`);
        return { name, passed: false, error: e.message };
    }

    let passed = true;
    const results = [];

    // Test strings that SHOULD match
    for (const str of shouldMatch) {
        const matches = regex.test(str);
        if (matches) {
            results.push(`   ✅ Matched: "${str}"`);
        } else {
            results.push(`   ❌ FAILED to match: "${str}"`);
            passed = false;
        }
    }

    // Test strings that should NOT match
    for (const str of shouldNotMatch) {
        const matches = regex.test(str);
        if (!matches) {
            results.push(`   ✅ Correctly rejected: "${str}"`);
        } else {
            results.push(`   ❌ INCORRECTLY matched: "${str}"`);
            passed = false;
        }
    }

    results.forEach(r => console.log(r));
    console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'}`);

    return { name, passed };
}

// =====================
// IPv6 ADDRESS TESTS
// =====================
const ipv6Tests = () => {
    console.log('\n' + '='.repeat(50));
    console.log('IPv6 ADDRESS REGEX TESTS');
    console.log('='.repeat(50));

    // AI-generated pattern (the one from the user)
    const aiGeneratedIPv6 = `^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::1$|^(([a-fA-F0-9]{1,4}:){1,6}:)?([a-fA-F0-9]{1,4}|:)$|^(([a-fA-F0-9]{1,4}:){1,6})(:[a-fA-F0-9]{1,4}){0,2}$|^(([a-fA-F0-9]{1,4}:){1,3})(:[a-fA-F0-9]{1,4}){0,3}$|^(([a-fA-F0-9]{1,4}:){1,4})(:[a-fA-F0-9]{1,4}){0,2}$|^(([a-fA-F0-9]{1,4}:){1,5})(:[a-fA-F0-9]{1,4}){0,1}$|^(([a-fA-F0-9]{1,4}:){1,6})(:[a-fA-F0-9]{1,4}){0,1}$|^`;

    // A simpler, more reliable IPv6 pattern
    const betterIPv6 = `^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^::1$|^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:(:[0-9a-fA-F]{1,4}){1,6}$|^:(:[0-9a-fA-F]{1,4}){1,7}$`;

    const validIPv6 = [
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334', // Full form
        '2001:db8:85a3::8a2e:370:7334',             // Compressed
        '::1',                                       // Loopback
        '::',                                        // All zeros
        'fe80::1',                                   // Link-local
        '2001:db8::1',                               // Short compressed
        '::ffff:192.0.2.1',                          // IPv4-mapped (edge case)
        'fe80::',                                    // Ends with ::
    ];

    const invalidIPv6 = [
        '192.168.1.1',                   // IPv4
        'invalid:address',               // Not hex
        '2001:db8:85a3::8a2e:370:7334:extra', // Too many groups
        'gggg::1',                       // Invalid hex
        '12345::1',                      // 5 digits (too long)
        '',                              // Empty
        ':::1',                          // Triple colon
        '2001:db8:::1',                  // Triple colon in middle
    ];

    console.log('\n--- Testing AI-Generated Pattern ---');
    const aiResult = testRegex(
        'AI-Generated IPv6',
        aiGeneratedIPv6,
        'm',
        validIPv6.slice(0, 4), // Test subset
        invalidIPv6.slice(0, 3)
    );

    console.log('\n--- Testing Improved Pattern ---');
    const betterResult = testRegex(
        'Improved IPv6',
        betterIPv6,
        'm',
        validIPv6.slice(0, 5),
        invalidIPv6.slice(0, 4)
    );

    return [aiResult, betterResult];
};

// =====================
// EMAIL ADDRESS TESTS
// =====================
const emailTests = () => {
    console.log('\n' + '='.repeat(50));
    console.log('EMAIL ADDRESS REGEX TESTS');
    console.log('='.repeat(50));

    const emailPattern = `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}`;

    const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@example.co.uk',
        'first.last@subdomain.example.com',
    ];

    const invalidEmails = [
        'not-an-email',
        '@missing-local.com',
        'missing-at-sign.com',
        'spaces in@email.com',
    ];

    return testRegex('Email Addresses', emailPattern, 'gi', validEmails, invalidEmails);
};

// =====================
// PHONE NUMBER TESTS
// =====================
const phoneTests = () => {
    console.log('\n' + '='.repeat(50));
    console.log('PHONE NUMBER REGEX TESTS');
    console.log('='.repeat(50));

    const phonePattern = `\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}`;

    const validPhones = [
        '(123) 456-7890',
        '123-456-7890',
        '123.456.7890',
        '1234567890',
        '(123)456-7890',
    ];

    const invalidPhones = [
        '12-456-7890',        // Too few digits in area code
        '12345678901234',     // Too many digits
        'abc-def-ghij',       // Letters
        '12-34-5678',         // Wrong digit groups
    ];

    return testRegex('Phone Numbers (US)', phonePattern, 'gi', validPhones, invalidPhones);
};

// =====================
// IP ADDRESS (v4) TESTS
// =====================
const ipv4Tests = () => {
    console.log('\n' + '='.repeat(50));
    console.log('IPv4 ADDRESS REGEX TESTS');
    console.log('='.repeat(50));

    const ipv4Pattern = `(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}`;

    const validIPv4 = [
        '192.168.1.1',
        '10.0.0.1',
        '255.255.255.255',
        '0.0.0.0',
        '127.0.0.1',
    ];

    const invalidIPv4 = [
        '256.1.1.1',          // Out of range
        '192.168.1',          // Missing octet
        '192.168.1.1.1',      // Too many octets
        'abc.def.ghi.jkl',    // Letters
    ];

    return testRegex('IPv4 Addresses', ipv4Pattern, 'g', validIPv4, invalidIPv4);
};

// =====================
// URL TESTS
// =====================
const urlTests = () => {
    console.log('\n' + '='.repeat(50));
    console.log('URL REGEX TESTS');
    console.log('='.repeat(50));

    const urlPattern = `https?:\\/\\/[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]*`;

    const validUrls = [
        'https://example.com',
        'http://www.example.org/path',
        'https://sub.domain.com/path?query=1',
        'http://localhost:3000',
    ];

    const invalidUrls = [
        'not-a-url',
        'ftp://example.com',   // Wrong protocol
        'example.com',         // Missing protocol
    ];

    return testRegex('URLs (HTTP/HTTPS)', urlPattern, 'gi', validUrls, invalidUrls);
};

// =====================
// RUN ALL TESTS
// =====================
console.log('🔬 AI REGEX PATTERN TEST SUITE');
console.log('================================');
console.log('Testing common patterns generated by AI Assist\n');

const results = [
    ...ipv6Tests(),
    emailTests(),
    phoneTests(),
    ipv4Tests(),
    urlTests(),
];

console.log('\n' + '='.repeat(50));
console.log('TEST SUMMARY');
console.log('='.repeat(50));

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total:  ${results.length}`);

if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
        console.log(`   - ${r.name}${r.error ? `: ${r.error}` : ''}`);
    });
}

process.exit(failed > 0 ? 1 : 0);
