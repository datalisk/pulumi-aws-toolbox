const redirectUrl = process.env.REDIRECT_URL;

function redirectHandler(request) {
    return {
        request: {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                location: { value: redirectUrl }
            }
        },
        stop: true,
    };
}
