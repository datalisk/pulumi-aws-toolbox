import { loadHandler } from "./test-utils";

test('redirect /about/', () => {
    const handler = loadHandler("rewriteWebpageToFileHandler", {});
    const resp = handler({uri: '/about/'});
    expect(resp.request.statusCode).toBe(301);
    expect(resp.request.headers.location.value).toBe('/about');
});

test('rewrite /', () => {
    const handler = loadHandler("rewriteWebpageToFileHandler", {});
    const resp = handler({uri: '/'});
    expect(resp.request.uri).toBe('/index.html');
});

test('rewrite /about', () => {
    const handler = loadHandler("rewriteWebpageToFileHandler", {});
    const resp = handler({uri: '/about'});
    expect(resp.request.uri).toBe('/about.html');
});

test('do not touch /about.js', () => {
    const handler = loadHandler("rewriteWebpageToFileHandler", {});
    const resp = handler({uri: '/about.js'});
    expect(resp.request.uri).toBe('/about.js');
});

test('do not touch /about.js/test', () => {
    const handler = loadHandler("rewriteWebpageToFileHandler", {});
    const resp = handler({uri: '/about.js/test'});
    expect(resp.request.uri).toBe('/about.js/test.html');
});
