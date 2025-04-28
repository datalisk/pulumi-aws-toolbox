import { loadHandler } from "./test-utils";

test('redirect /bla', () => {
    const handler = loadHandler("rewritePathToHandler", {
        PATH: "/target"
    });
    const resp = handler({ uri: '/bla' });
    expect(resp.request.uri).toBe('/target');
});
