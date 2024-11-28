import { getVersion } from "./version";

test('getVersion wrong dir', async () => {
    await expect(() => getVersion('doesnotexist')).rejects.toThrow();
});

test('getVersion for single path', async () => {
    expect(await getVersion('src/build/index.ts')).toBe(`dfe3d758`);
});

test('getVersion for multiple paths', async () => {
    expect(await getVersion('src/build/index.ts', 'resources/ses-proxy-mailer')).toBe(`dfe3d758`);
});
