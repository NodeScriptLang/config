import { Mesh } from '@nodescript/mesh';
import assert from 'assert';

import { Config, config, MapConfig } from '../main/config.js';

class Foo {
    @config() STRING!: string;
    @config() NUMBER!: number;
    @config() BOOLEAN!: boolean;
    @config({ default: 'foo' }) STRING_WITH_DEFAULT!: string;
    @config({ default: 42 }) NUMBER_WITH_DEFAULT!: number;
    @config({ default: true }) BOOLEAN_WITH_DEFAULT!: boolean;
}

describe('@config', () => {

    context('values provided', () => {
        const mesh = new Mesh();
        const config = new MapConfig(Object.entries({
            STRING: 'hello',
            NUMBER: '111',
            BOOLEAN: 'true',
            STRING_WITH_DEFAULT: 'bye',
            NUMBER_WITH_DEFAULT: '222',
            BOOLEAN_WITH_DEFAULT: 'false',
        }));
        mesh.service(Foo);
        mesh.constant(Config, config);

        it('resolves values provided by Config', () => {
            const foo = mesh.resolve(Foo);
            assert.strictEqual(foo.STRING, 'hello');
            assert.strictEqual(foo.NUMBER, 111);
            assert.strictEqual(foo.BOOLEAN, true);
            assert.strictEqual(foo.STRING_WITH_DEFAULT, 'bye');
            assert.strictEqual(foo.NUMBER_WITH_DEFAULT, 222);
            assert.strictEqual(foo.BOOLEAN_WITH_DEFAULT, false);
        });
    });

    context('values not provided', () => {
        const mesh = new Mesh();
        mesh.service(Foo);
        mesh.constant(Config, new MapConfig());

        it('resolves default values if supported', () => {
            const foo = mesh.resolve(Foo);
            assert.strictEqual(foo.STRING_WITH_DEFAULT, 'foo');
            assert.strictEqual(foo.NUMBER_WITH_DEFAULT, 42);
            assert.strictEqual(foo.BOOLEAN_WITH_DEFAULT, true);
        });

        it('throws if no default provided', () => {
            const foo = mesh.resolve(Foo);
            try {
                assert.strict(foo.STRING, 'impossible');
            } catch (error: any) {
                assert.strictEqual(error.name, 'ConfigError');
            }
        });
    });

});
