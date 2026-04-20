import * as pulumi from "@pulumi/pulumi";
import { ComponentResource } from "@pulumi/pulumi";
/**
 * Creates a CloudFront function that processes the request/response through a chain of handlers.
 *
 * A handler may decide to stop processing following handlers and return it's result immediately.
 */
declare abstract class CloudfrontChainedFunction {
    private name;
    private eventType;
    private parent?;
    protected handlerChain: Handler[];
    constructor(name: string, eventType: EventType, parent?: ComponentResource);
    customHandler(handler: Handler): this;
    createOrUndefined(): import("@pulumi/aws/cloudfront/function").Function | undefined;
    create(): import("@pulumi/aws/cloudfront/function").Function;
}
export declare class ViewerRequestFunction extends CloudfrontChainedFunction {
    constructor(name: string, parent?: ComponentResource);
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
    rewriteWebpagePath(strategy: WebpageRewriteStrategy): this;
    /**
     * Rewrites a path by replacing a single path element with a replacement string.
     */
    rewritePathElement(pathElementIndex: number, replacement: string): this;
    /**
     * Rewrites the requested path to the given path.
     * @param path a path, starting with a slash
     */
    rewritePathTo(path: string): this;
    /**
     * Responds with a redirect (HTTP 301, Moved Permanently) to the specified URL.
     */
    redirectPermanently(redirectUrl: string): this;
    /**
     * Adds a HTTP basic auth check.
     * If the checks fails the processing is stopped.
     */
    withBasicAuth(username: string, password: string): this;
}
export declare class ViewerResponseFunction extends CloudfrontChainedFunction {
    constructor(name: string, parent?: ComponentResource);
    statusCode(statusCode: number): this;
    /**
     * Sets the cache-control header to control browser caching.
     * @param immutable if resources can be treated as immutable (will be cached by up to a year)
     */
    withCacheControl(immutable: boolean): this;
    /**
     * Deprecated.
     * Adds several common security-related HTTP headers to the response, see the handler code for details.
     */
    withSecurityHeaders(): this;
}
export declare function loadHandlerCode(path: string, replacements: {
    [key: string]: string;
}): any;
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
    readonly replacements?: {
        [key: string]: string;
    };
}
export type EventType = `viewer-request` | `viewer-response`;
export type WebpageRewriteStrategy = 'FILE' | 'SUB_DIR';
export {};
