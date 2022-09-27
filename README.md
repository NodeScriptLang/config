# Configuration Microframework

Declarative configuration framework for [Mesh IoC](https://github.com/inca/mesh-ioc).

## Highlights

- ✨ Declarative
- 🗜 Small footprint
- 🔬 Introspectable
- 🌳 Ergonomic

## Usage

1. Define and use configs in your classes:

```ts
export class MyDatabase {
    @config() DATABASE_USERNAME!: string;
    @config() DATABASE_PASSWORD!: string;
    @config({ default: 10 }) DATABASE_MAX_CONNECTIONS!: number;

    async connect() {
        await this.db.connect({
            username: this.DATABASE_USERNAME,
            password: this.DATABASE_PASSWORD,
            maxConnections: this.DATABASE_MAX_CONNECTIONS,
        });
    }
}
```

2. Define config provider in Mesh:

```ts
mesh.service(MyDatabase);
mesh.service(ConfigProvider, ProcessEnvConfigProvider);
```

3. Now `DATABASE_*` values will be read from `process.env`.

4. Enjoy!
