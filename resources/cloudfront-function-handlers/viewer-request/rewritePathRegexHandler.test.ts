import { loadHandler } from "./test-utils";

test('rewrite path with regex', () => {
    const handler = loadHandler("rewritePathRegexHandler", {
        PATTERN: "^/user/(\\d*)/(\\w*)",
        REPLACEMENTS: JSON.stringify(["0", "-"]),
    });

    const resp = handler({ uri: '/user/123/bob/' });
    expect(resp.request.uri).toBe('/user/0/-/');
});
