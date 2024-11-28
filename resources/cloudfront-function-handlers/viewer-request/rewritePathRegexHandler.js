const patternStr = process.env.PATTERN;
const pattern = new RegExp(patternStr, "dg");
const replacements = JSON.parse(process.env.REPLACEMENTS);

// regex flags not yet supported by CloudFront functions
// -> SyntaxError: Invalid RegExp flags "dg"

function rewritePathRegexHandler(request) {
    const path = request.uri;
    const match = pattern.exec(path);

    if (match == null) {
        return {request};
    }

    // console.log(`matches: ${match} ;; ${match.indices[1]}`, pattern)
    let result = '';
    let lastIndex = 0;

    replacements.forEach((replacement, replacement_i) => {
        const group = match.indices[replacement_i + 1];
        const groupStart = group[0];
        const groupEnd = group[1];
        // console.log(`group: ${groupStart}-${groupEnd}`);
        result += path.substring(lastIndex, groupStart);
        result += replacement;
        lastIndex = groupEnd;
    });

    result += path.substring(lastIndex);

    request.uri = result;

    return {request};
}
