import { readFileSync } from "fs";
import { resolve } from "path";

export function loadHandler(name: string, envVariables: ({[key: string]: string})) {
    const handlerPath = resolve(__dirname, `${name}.js`);
    const handlerCode = readFileSync(handlerPath, 'utf8');

    const evalScope = {};
    const modifiedHandlerCode = handlerCode + `\nevalScope.${name} = ${name};`;
    // console.log(`handlerCode: ${modifiedHandlerCode}`)

    for (const envKey of Object.keys(envVariables)) {
        process.env[envKey] = envVariables[envKey];
    }
    
    eval(modifiedHandlerCode);

    const handler = (evalScope as any)[name] as ((request: any) => any);
    if (handler === undefined) {
        throw new Error(`Handler function ${name} not found`);
    }

    return handler;
}
