import { loadHandler } from "./test-utils";

test('rewrite path /user/123', () => {
    const handler = loadHandler("rewritePathElementHandler", {
        PATH_ELEMENT_INDEX: "1",
        REPLACEMENT: "0",
    });    
    const resp = handler({uri: '/user/123'});
    expect(resp.request.uri).toBe('/user/0');
});

test('rewrite path with trailing slash', () => {
    const handler = loadHandler("rewritePathElementHandler", {
        PATH_ELEMENT_INDEX: "1",
        REPLACEMENT: "0.html",
    });    
    const resp = handler({uri: '/n/8pNIotQA'});
    expect(resp.request.uri).toBe('/n/0.html');
});

test('rewrite path /user/123/bob/', () => {
    const handler = loadHandler("rewritePathElementHandler", {
        PATH_ELEMENT_INDEX: "1",
        REPLACEMENT: "xxx",
    });    
    const resp = handler({uri: '/user/123/bob/'});
    expect(resp.request.uri).toBe('/user/xxx/bob/');
});

test('rewrite path /nothing', () => {
    const handler = loadHandler("rewritePathElementHandler", {
        PATH_ELEMENT_INDEX: "1",
        REPLACEMENT: "0",
    });    
    const resp = handler({uri: '/nothing'});
    expect(resp.request.uri).toBe('/nothing');
});
