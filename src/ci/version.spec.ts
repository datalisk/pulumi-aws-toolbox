import { getVersion } from "./version";

test('getVersion wrong dir', async () => {
    await expect(() => getVersion('doesnotexist')).rejects.toThrow();
});

test('getVersion for single path', async () => {
    expect(await getVersion('src/ci/index.ts')).toBe(`70f000d0`);
});

test('getVersion for multiple paths', async () => {
    expect(await getVersion('src/ci/index.ts', 'resources/ses-proxy-mailer')).toBe(`70f000d0`);
});
