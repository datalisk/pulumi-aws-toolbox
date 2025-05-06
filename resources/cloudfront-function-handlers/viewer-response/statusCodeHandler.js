function statusCodeHandler(response) {
    response.statusCode = Number(process.env.STATUS_CODE);
    return {response};
}
