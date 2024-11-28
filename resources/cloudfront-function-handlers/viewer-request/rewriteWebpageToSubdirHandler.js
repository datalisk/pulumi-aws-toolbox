function rewriteWebpageToSubdirHandler(request) {
    if (request.uri.endsWith('/')) {
        // the URI is missing a file name
        request.uri += 'index.html';
    } else if (!request.uri.includes('.')) {
        // the URI is missing a file extension
        request.uri += '/index.html';
    }

    return {request};
}
