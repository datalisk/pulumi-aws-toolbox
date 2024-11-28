const pathElementIndex = Number(process.env.PATH_ELEMENT_INDEX);
const replacement = process.env.REPLACEMENT;

function rewritePathElementHandler(request) {
    const path = request.uri;

    const pathElements = path.split('/');
    // console.log(`pathElements: ${pathElements}`)

    if (pathElementIndex + 1 >= pathElements.length) {
        // no match
        return {request};
    }

    pathElements[pathElementIndex + 1] = replacement;
    request.uri = pathElements.join('/');

    return {request};
}
