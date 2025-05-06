import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResource } from "@pulumi/pulumi";
const fs = require("fs");

/**
 * Creates a CloudFront function that processes the request/response through a chain of handlers.
 * 
 * A handler may decide to stop processing following handlers and return it's result immediately.
 */
abstract class CloudfrontChainedFunction {
    private name: string;
    private eventType: EventType;
    private parent?: ComponentResource;
    protected handlerChain: Handler[];

    constructor(name: string, eventType: EventType, parent?: ComponentResource) {
        this.name = name;
        this.eventType = eventType;
        this.parent = parent;
        this.handlerChain = [];
    }

    customHandler(handler: Handler) {
        this.handlerChain.push(handler);
        return this;
    }

    createOrUndefined() {
        if (this.handlerChain.length > 0) {
            return this.create();
        } else {
            return undefined;
        }
    }

    create() {
        const handlersDir = `${__dirname}/../../resources/cloudfront-function-handlers/${this.eventType}`;

        const handlerNames = this.handlerChain.map(handler => handler.name).join();
        let code = `const handlerChain = [${handlerNames}];

async function handler(event) {
    let input = ${this.eventType == "viewer-request" ? "event.request" : "event.response"};
    for (let i = 0; i < handlerChain.length; i++) {
        const handler = handlerChain[i];
        const processed = await handler(input);
        const outputEvent = ${this.eventType == "viewer-request" ? "processed.request" : "processed.response"};
        if (processed.stop) {
            return outputEvent;
        } else {
            input = outputEvent;
        }
    }
    return input;
}`;

        for (const handler of this.handlerChain) {
            const handlerCode = handler.code ?? loadHandlerCode(`${handlersDir}/${handler.name}.js`, handler.replacements ?? {});
            code += `\n\n// ----------- Handler: ${handler.name} -----------\n`;
            code += handlerCode;
        }

        return new aws.cloudfront.Function(this.name, {
            runtime: "cloudfront-js-2.0",
            comment: `${this.eventType}: ${handlerNames}`,
            publish: true,
            code,
        }, {
            parent: this.parent,
        });
    }
}

export class ViewerRequestFunction extends CloudfrontChainedFunction {
    constructor(name: string, parent?: ComponentResource) {
        super(name, "viewer-request", parent);
    }

    /**
     * @deprecated replace with rewriteWebpagePath('SUB_DIR')
     */
    withIndexRewrite() {
        return this.rewriteWebpagePath('SUB_DIR');
    }

    /**
     * Rewrites the requested path to serve an actual HTML file.
     * 
     * Strategy 'FILE':
     * If the last element in the path does not contain a dot, it appends '.html'.
     * If the requested path ends with a slash, the user is redirected to a URL without slash (with status 301 Moved Permanently).
     * Example: '/about' is rewritten to '/about.html'
     * 
     * Stragtegy 'SUB_DIR':
     * - appending 'index.html' if path ends with a slash or
     * - appending '/index.html' if paths ends without a slash and doesn't contain a file extension.
     * Example: '/about' or '/about/' are rewritten to '/about/index.html'
     */
    rewriteWebpagePath(strategy: WebpageRewriteStrategy) {
        if (strategy == 'FILE') {
            this.handlerChain.push({
                name: "rewriteWebpageToFileHandler",
            });
        } else {
            this.handlerChain.push({
                name: "rewriteWebpageToSubdirHandler",
            });
        }
        return this;
    }

    /**
     * Rewrites a path by replacing a single path element with a replacement string.
     */
    rewritePathElement(pathElementIndex: number, replacement: string) {
        this.handlerChain.push(
            {
                name: "rewritePathElementHandler",
                replacements: {
                    "process.env.PATH_ELEMENT_INDEX": JSON.stringify(pathElementIndex),
                    "process.env.REPLACEMENT": JSON.stringify(replacement),
                }
            }
        );
        return this;
    }

    /**
     * Rewrites the requested path to the given path.
     * @param path a path, starting with a slash
     */
    rewritePathTo(path: string) {
        this.handlerChain.push(
            {
                name: "rewritePathToHandler",
                replacements: {
                    "process.env.PATH": JSON.stringify(path),
                }
            }
        );
        return this;
    }

    /**
     * Responds with a redirect (HTTP 301, Moved Permanently) to the specified URL.
     */
    redirectPermanently(redirectUrl: string) {
        this.handlerChain.push(
            {
                name: "redirectHandler",
                replacements: {
                    "process.env.REDIRECT_URL": JSON.stringify(redirectUrl),
                }
            }
        );
        return this;
    }

    // TODO enable once regex flags are supported by CloudFront functions
    // /**
    //  * Rewrites a path based on a regex pattern. The content of each group is replace with a corresponding replacement.
    //  */
    // rewritePath(pattern: RegExp, replacements: string[]) {
    //     this.handlerChain.push(
    //         {
    //             name: "rewritePathRegexHandler",
    //             replacements: {
    //                 "process.env.PATTERN": JSON.stringify(pattern.source),
    //                 "JSON.parse(process.env.REPLACEMENTS)": JSON.stringify(replacements),
    //             }
    //         }
    //     );
    //     return this;
    // }

    /**
     * Adds a HTTP basic auth check.
     * If the checks fails the processing is stopped.
     */
    withBasicAuth(username: string, password: string) {
        this.handlerChain.push(
            {
                name: "basicAuthHandler",
                replacements: {
                    "__BASIC_AUTH__": Buffer.from(`${username}:${password}`).toString('base64'),
                }
            }
        );
        return this;
    }
}

export class ViewerResponseFunction extends CloudfrontChainedFunction {
    constructor(name: string, parent?: ComponentResource) {
        super(name, "viewer-response", parent);
    }

    statusCode(statusCode: number) {
        this.handlerChain.push({
            name: "statusCodeHandler",
            replacements: { "process.env.STATUS_CODE": `${statusCode}` },
        });
        return this;
    }

    /**
     * Sets the cache-control header to control browser caching.
     * @param immutable if resources can be treated as immutable (will be cached by up to a year)
     */
    withCacheControl(immutable: boolean) {
        this.handlerChain.push({
            name: "cacheControlHandler",
            replacements: { "__IMMUTABLE__": `${immutable}` },
        });
        return this;
    }

    /**
     * Deprecated.
     * Adds several common security-related HTTP headers to the response, see the handler code for details.
     */
    withSecurityHeaders() {
        this.handlerChain.push({
            name: "securityHeadersHandler",
        });
        return this;
    }
}

export function loadHandlerCode(path: string, replacements: { [key: string]: string }) {
    let handlerCode = fs.readFileSync(path, "utf-8");
    Object.keys(replacements).forEach(key => {
        const value = replacements![key];
        handlerCode = handlerCode.replace(key, value);
    });
    return handlerCode;
}

export interface Handler {
    /**
     * The handler code. If omitted, will try to load a internal handler with the same 'name'.
     */
    readonly code?: pulumi.Input<string>;

    /**
     * Name of the handler function within the code.
     */
    readonly name: string;

    /**
     * String replacements to be performed on the handler code.
     */
    readonly replacements?: { [key: string]: string };
}

export type EventType = `viewer-request` | `viewer-response`;

export type WebpageRewriteStrategy = 'FILE' | 'SUB_DIR';
