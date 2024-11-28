const fs = require('fs');
const path = require('path');
const handlerCode = fs.readFileSync(path.resolve(__dirname, 'rewriteWebpageToFileHandler.js'), 'utf8');
eval(handlerCode);

function assertEquals(expected, actual) {
    if (expected != actual) throw new Error(`Expected '${expected}' but got '${actual}'`);
}

let resp;

// redirect for /about/
resp = rewriteWebpageToFileHandler({uri: '/about/'});
assertEquals('301', resp.request.statusCode);
assertEquals('/about', resp.request.headers.location.value);

// rewrite /
resp = rewriteWebpageToFileHandler({uri: '/'});
assertEquals('/index.html', resp.request.uri);

// rewrite /about
resp = rewriteWebpageToFileHandler({uri: '/about'});
assertEquals('/about.html', resp.request.uri);

// don't touch /about.js
resp = rewriteWebpageToFileHandler({uri: '/about.js'});
assertEquals('/about.js', resp.request.uri);

// don't touch /about.js/test
resp = rewriteWebpageToFileHandler({uri: '/about.js/test.html'});
assertEquals('/about.js/test.html', resp.request.uri);

console.log("Done");
