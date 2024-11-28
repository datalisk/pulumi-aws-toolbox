function rewriteWebpageToFileHandler(request) {
    if (request.uri != '/') {
        if (request.uri.endsWith('/')) {
            return {
                request: {
                    statusCode: 301,
                    statusDescription: 'Moved Permanently',
                    headers: {
                        location: { value: request.uri.substring(0, request.uri.length - 1 ) }
                    }
                },
                stop: true,
            };
        } else {
            const filename = request.uri.split('/').pop();
            if (!filename.includes('.')) {
                request.uri += '.html';
            }
            return {request};
        }
    } else {
        request.uri = '/index.html';
        return {request};
    }
}
