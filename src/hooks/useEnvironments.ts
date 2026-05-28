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
        getActiveEnvironment,
    };
}

export function substituteVariables(text: string, variables: EnvVariable[]) {
    if (!text || !variables || variables.length === 0) return text;

    let result = text;
    // Sort by key length descending to prevent partial replacements (optional optimization)
    const sortedVars = [...variables]
        .filter((v) => v.enabled && v.key)
        .sort((a, b) => b.key.length - a.key.length);

    sortedVars.forEach((v) => {
        // Replace {{key}} case-insensitively? Usually exact match is preferred.
        // We'll use global replace for plain {{key}}
        // Escaping key for regex is safer
        const escapedKey = v.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, "g");
        result = result.replace(regex, v.value);
    });

    return result;
}
