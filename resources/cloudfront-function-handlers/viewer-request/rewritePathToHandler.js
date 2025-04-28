function rewritePathToHandler(request) {
    const path = process.env.PATH;
    request.uri = path;
    return { request };
}
