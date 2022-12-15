import { Mesh, MESH_REF } from '@nodescript/mesh';
import { addClassMetadata, getClassMetadata } from '@nodescript/reflect';

export const CONFIG_REF = Symbol('nodescript:CONFIG_REF');

export type ConfigType = string | boolean | number;
export type ConfigParser<T> = (str: string) => T | null;
export type ConfigTypeCtor<T extends ConfigType> =
    T extends string ? typeof String :
    T extends number ? typeof Number :
    T extends boolean ? typeof Boolean : never;

export interface ConfigDecl {
    key: string;
    type: ConfigTypeCtor<any>;
    defaultValue?: string;
    prototype: any;
}

export interface ConfigOptions {
    default?: ConfigType;
}

export function config(options: ConfigOptions = {}) {
    return (prototype: any, key: string) => {
        const type = Reflect.getMetadata('design:type', prototype, key);
        if (![String, Boolean, Number].includes(type)) {
            throw new ConfigError('@config can only be used with string, number or boolean types');
        }
        const defaultValue = options.default == null ? undefined : String(options.default);
        addClassMetadata<ConfigDecl>(CONFIG_REF, prototype, { key, type, defaultValue, prototype });
        Object.defineProperty(prototype, key, {
            get() {
                const mesh = (this as any)[MESH_REF] as Mesh;
                if (!(mesh instanceof Mesh)) {
                    throw new ConfigError(`Could not read @config: ${prototype.constructor.name} not connected to Mesh`);
                }
                const config = mesh.resolve(Config);
                return config.get(key, type, defaultValue);
            }
        });
    };
}

/**
 * Returns all `@config()` declared in class and its ancestors.
 */
export function getClassConfigs(classOrProto: any): ConfigDecl[] {
    const target = classOrProto instanceof Function ? classOrProto.prototype : classOrProto;
    return getClassMetadata(CONFIG_REF, target);
}

/**
 * Returns all `@config()` declarations for all classes bound to the container.
 */
export function getMeshConfigs(mesh: Mesh): ConfigDecl[] {
    const result: ConfigDecl[] = [];
    for (const binding of mesh.bindings.values()) {
        if (binding.type === 'service') {
            const configs = getClassConfigs(binding.class);
            result.push(...configs);
        }
    }
    return result.sort((a, b) => a.key > b.key ? 1 : -1);
}

/**
 * Provides actual configuration values. Implementations must specify `resolve`.
 */
export abstract class Config {

    abstract resolve(key: string): string | null;

    static parsers: { [key: string]: ConfigParser<ConfigType> } = {
        String: parseString,
        Number: parseNumber,
        Boolean: parseBoolean,
    };

    getOrNull<T extends ConfigType>(key: string, type: ConfigTypeCtor<T>, defaultValue?: string | T): T | null {
        const str = this.resolve(key) ?? defaultValue;
        const parser = Config.parsers[type.name] as ConfigParser<T>;
        return str == null ? null : parser(String(str));
    }

    get<T extends ConfigType>(key: string, type: ConfigTypeCtor<T>, defaultValue?: string | T): T {
        const val = this.getOrNull(key, type, defaultValue);
        if (val == null) {
            throw new ConfigError(`Configuration ${key} is missing`);
        }
        return val;
    }

    hasKey(key: string) {
        return this.resolve(key) != null;
    }

    getString(key: string, defaultValue?: string): string {
        return this.get<string>(key, String, defaultValue);
    }

    getNumber(key: string, defaultValue?: string | number): number {
        return this.get<number>(key, Number, defaultValue);
    }

    getBoolean(key: string, defaultValue?: string | boolean): boolean {
        return this.get<boolean>(key, Boolean, defaultValue);
    }

}

export class MapConfig extends Config {
    map = new Map<string, string>();

    constructor(entries: Iterable<readonly [string, string | null | undefined]> = []) {
        super();
        for (const [k, v] of entries) {
            if (v != null) {
                this.map.set(k, v);
            }
        }
    }

    resolve(key: string): string | null {
        return this.map.get(key) ?? null;
    }
}

export class ProcessEnvConfig extends MapConfig {
    constructor() {
        super(Object.entries(process.env));
    }
}

function parseString(str: string): string | null {
    return str;
}

function parseNumber(str: string): number | null {
    const num = Number(str);
    return isNaN(num) ? null : num;
}

function parseBoolean(str: string): boolean | null {
    return str === 'true';
}

export class ConfigError extends Error {
    override name = this.constructor.name;
}
