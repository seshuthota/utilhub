export function getPrompt(type, payload) {
    const { description, code, data, schema, pattern, flags } = payload || {};

    switch (type) {
        case 'regex-generator':
            return {
                systemPrompt: "You are a regex expert. Return ONLY the regex pattern inside a code block. Do not explain.",
                prompt: `Generate a JavaScript-compatible regular expression for: ${description}. Return ONLY the regex pattern inside a code block.`
            };

        case 'regex-create': // For Regex Studio "Match" mode
            return {
                systemPrompt: "You are a regex expert. Return ONLY the valid /pattern/flags. Do not explain.",
                prompt: `Create a JavaScript regex for: "${description}". Return ONLY the regex in /pattern/flags format.`
            };

        case 'regex-edit': // For Regex Studio with existing pattern
            return {
                systemPrompt: "You are a regex expert. Return ONLY the valid /pattern/flags. Do not explain.",
                prompt: `Current regex: /${pattern}/${flags}. Task: "${description}". Return ONLY the fixed or new regex in /pattern/flags format.`
            };

        case 'json-schema':
            return {
                systemPrompt: "You are a JSON Schema expert. Return ONLY the valid JSON Schema object. No text before or after.",
                prompt: `Perform the following task on JSON Schema: "${description}". ${data ? `Data to infer from: ${data}` : ''}. ${schema ? `Current schema: ${schema}` : ''}. Return ONLY the valid JSON Schema result.`
            };

        case 'lorem':
            return {
                systemPrompt: "You are a professional copywriter. Generate high-quality placeholder text based on the user's topic. Do not include titles or metadata. Return ONLY the text content.",
                prompt: `Generate placeholder text for: "${description}". Unit: ${payload.count} ${payload.unit}. Return ONLY the requested text.`
            };

        case 'cron':
            return {
                systemPrompt: "You are a cron expression generator. Return ONLY the 5-field cron expression. No text before or after.",
                prompt: `Generate a standard crontab expression for: "${description}". Return ONLY the expression (5 fields). Example for "daily at 3am": "0 3 * * *"`
            };

        case 'json':
            return {
                systemPrompt: "You are a JSON assistant. Return ONLY the valid JSON data. No text before or after. If repairing JSON, fix syntax errors like missing commas or quotes.",
                prompt: `Perform the following task on JSON/data: "${description}". ${code ? `Current input: ${code}` : ""}. Return ONLY the valid JSON result.`
            };

        case 'sql':
            return {
                systemPrompt: "", // Optional, can be empty or specific
                prompt: `Given tables: users(id, name, email, role), products(id, name, price, stock), orders(id, user_id, product_id, date). Write a standard SQL query for: "${description}". Return ONLY sql.`
            };

        case 'mermaid':
            return {
                systemPrompt: "You are a Mermaid chart expert. Return ONLY the valid Mermaid diagram syntax. No text before or after. IMPORTANT: You MUST encase all edge labels in double quotes (e.g., -->|\"Label (with parens)\"|). Support flowchart, sequence, class, state, entity relationship, and gantt diagrams.",
                prompt: `Generate Mermaid chart syntax for: "${description}". Return ONLY the mermaid code. Example for a graph: "graph TD; A-->|\"Label\"|B;"`
            };

        default:
            throw new Error(`Unknown AI task type: ${type}`);
    }
}
