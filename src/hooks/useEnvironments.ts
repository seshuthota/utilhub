import { useState } from "react";

const ENV_KEY = "utilhub_api_envs";
const ACTIVE_ENV_KEY = "utilhub_api_active_env";

export interface EnvVariable {
    key: string;
    value: string;
    enabled: boolean;
}

export interface Environment {
    id: string;
    name: string;
    variables: EnvVariable[];
}

function loadEnvironments(): Environment[] {
    try {
        const saved = localStorage.getItem(ENV_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function loadActiveEnv(): string | null {
    try {
        return localStorage.getItem(ACTIVE_ENV_KEY);
    } catch {
        return null;
    }
}

export function useEnvironments() {
    const [environments, setEnvironments] = useState<Environment[]>(() => loadEnvironments());
    const [activeEnvId, setActiveEnvId] = useState<string | null>(() => loadActiveEnv());

    // Save helpers
    const saveEnvs = (newEnvs: Environment[]) => {
        setEnvironments(newEnvs);
        localStorage.setItem(ENV_KEY, JSON.stringify(newEnvs));
    };

    const saveActive = (id: string | null) => {
        setActiveEnvId(id);
        if (id) {
            localStorage.setItem(ACTIVE_ENV_KEY, id);
        } else {
            localStorage.removeItem(ACTIVE_ENV_KEY);
        }
    };

    // Actions
    const addEnvironment = (name: string) => {
        const newEnv: Environment = {
            id: crypto.randomUUID(),
            name,
            variables: [], // { key: '', value: '', enabled: true }
        };
        const newEnvs = [...environments, newEnv];
        saveEnvs(newEnvs);

        // If it's the first one, make it active
        if (environments.length === 0) {
            saveActive(newEnv.id);
        }

        return newEnv;
    };

    const updateEnvironment = (id: string, updates: Partial<Environment>) => {
        const newEnvs = environments.map((env) =>
            env.id === id ? { ...env, ...updates } : env,
        );
        saveEnvs(newEnvs);
    };

    const deleteEnvironment = (id: string) => {
        const newEnvs = environments.filter((env) => env.id !== id);
        saveEnvs(newEnvs);
        if (activeEnvId === id) {
            saveActive(newEnvs.length > 0 ? newEnvs[0].id : null);
        }
    };

    const duplicateEnvironment = (id: string) => {
        const env = environments.find((e) => e.id === id);
        if (env) {
            const newEnv = {
                ...env,
                id: crypto.randomUUID(),
                name: `${env.name} Copy`,
            };
            saveEnvs([...environments, newEnv]);
        }
    };

    /** Append several environments at once (e.g. from an import), with fresh ids. */
    const importEnvironments = (incoming: Environment[]) => {
        if (incoming.length === 0) return;
        const added = incoming.map((e) => ({ ...e, id: crypto.randomUUID() }));
        saveEnvs([...environments, ...added]);
        if (!activeEnvId) saveActive(added[0].id);
    };

    const getActiveEnvironment = () => {
        return environments.find((e) => e.id === activeEnvId) || null;
    };

    return {
        environments,
        activeEnvId,
        setActiveEnvId: saveActive,
        addEnvironment,
        updateEnvironment,
        deleteEnvironment,
        duplicateEnvironment,
        importEnvironments,
        getActiveEnvironment,
    };
}

/**
 * Replace `{{key}}` with the first enabled variable of that name, in a single pass
 * (a value that itself contains `{{other}}` is not expanded again). Unknown
 * placeholders are left as-is so callers can detect them.
 */
export function substituteVariables(text: string, variables: EnvVariable[]) {
    if (!text || !variables || variables.length === 0) return text;

    const values = new Map<string, string>();
    variables.forEach((v) => {
        const key = v.key?.trim();
        if (v.enabled && key && !values.has(key)) values.set(key, v.value ?? "");
    });
    if (values.size === 0) return text;

    return text.replace(/\{\{([^{}]+)\}\}/g, (match, name: string) => {
        const value = values.get(name.trim());
        return value === undefined ? match : value;
    });
}
