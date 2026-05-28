declare module 'prismjs/components/*';
declare module 'prismjs';
declare module 'curlconverter';
declare module 'xml-formatter';
declare module '*?raw' {
    const content: string;
    export default content;
}

declare module 'js-yaml' {
    const yaml: {
        load(input: string): any;
        dump(obj: any, options?: any): string;
    };
    export default yaml;
}

declare module '@iarna/toml' {
    const toml: {
        parse(input: string): any;
        stringify(obj: any): string;
    };
    export default toml;
}

declare module 'html5-qrcode' {
    export class Html5QrcodeScanner {
        constructor(elementId: string, config: any, verbose?: boolean);
        render(onScanSuccess: (text: string, result?: any) => void, onScanFailure?: (error: string) => void): void;
        clear(): void;
    }
}

declare module 'zxcvbn' {
    interface ZxcvbnResult {
        score: number;
        guesses: number;
        guesses_log10: number;
        crack_times_display: { [key: string]: string };
        feedback: { warning: string | null; suggestions: string[] };
    }
    function zxcvbn(password: string): ZxcvbnResult;
    export default zxcvbn;
}

declare module 'composerize' {
    function composerize(dockerRun: string): string;
    export default composerize;
}

declare module 'svgo/browser' {
    export function optimize(input: string, config?: any): { data: string; error?: string };
}

declare module 'marked' {
    function marked(src: string): string | Promise<string>;
    export default marked;
}

declare module 'papaparse' {
    interface ParseResult {
        data: any[];
        errors: { message: string }[];
        meta: { fields?: string[] };
    }
    function parse(input: string, config?: any): ParseResult;
    function parse(input: string, config: { complete: (results: ParseResult) => void; error?: (err: Error) => void; header?: boolean; skipEmptyLines?: boolean }): void;
    export default { parse };
}
