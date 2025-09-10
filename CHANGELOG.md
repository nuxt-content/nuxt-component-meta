# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.3.7](https://github.com/farnabaz/nuxt-component-meta/compare/v0.3.6...v0.3.7) (2022-12-06)


### Features

* **content:** remove rest in content transformer ([4a3d063](https://github.com/farnabaz/nuxt-component-meta/commit/4a3d0630d9d65d06a583a7c2b0a88dcd99a05560))

### [0.3.6](https://github.com/farnabaz/nuxt-component-meta/compare/v0.3.5...v0.3.6) (2022-12-06)


### Bug Fixes

* **module:** update transformers ([2f57524](https://github.com/farnabaz/nuxt-component-meta/commit/2f57524ec13eb6d19190558cde22227837a6457a))

### [0.3.5](https://github.com/farnabaz/nuxt-component-meta/compare/v0.3.4...v0.3.5) (2022-11-27)


### Features

* **transformers:** improve transformers feature ; add @nuxt/content support by default ([93d176c](https://github.com/farnabaz/nuxt-component-meta/commit/93d176c9132bc1ab2c29e22d479c83e8bb594605))

### [0.3.4](https://github.com/farnabaz/nuxt-component-meta/compare/v0.3.3...v0.3.4) (2022-11-16)

### [0.3.3](https://github.com/farnabaz/nuxt-component-meta/compare/v0.2.3...v0.3.3) (2022-11-01)


### Features

* **unplugin:** move parsing steps to unplugin ([#43](https://github.com/farnabaz/nuxt-component-meta/issues/43)) ([ae5ae18](https://github.com/farnabaz/nuxt-component-meta/commit/ae5ae18ce28c547aec4ce23eb4acb538b83b004d))


### Bug Fixes

* **hmr:** fix hmr; avoid relying on transformers ([75e192b](https://github.com/farnabaz/nuxt-component-meta/commit/75e192b92c7536b786d873a4d91ee6a5207f376d))

### [0.2.3](https://github.com/farnabaz/nuxt-component-meta/compare/v0.2.2...v0.2.3) (2022-09-20)

### [0.2.2](https://github.com/nuxt-content/nuxt-component-meta/compare/v0.2.1...v0.2.2) (2022-08-31)


### Bug Fixes

* add tsconfig path to `vue-component-meta` ([#40](https://github.com/nuxt-content/nuxt-component-meta/issues/40)) ([a32212b](https://github.com/nuxt-content/nuxt-component-meta/commit/a32212b141c265070e95a660312222f369c128de))

### [0.2.1](https://github.com/nuxt-content/nuxt-component-meta/compare/v0.2.0...v0.2.1) (2022-08-29)


### Bug Fixes

* node modules components ([#38](https://github.com/nuxt-content/nuxt-component-meta/issues/38)) ([d984090](https://github.com/nuxt-content/nuxt-component-meta/commit/d9840902781be0697657c4b752697b5b45605a08))

## [0.2.0](https://github.com/nuxt-content/nuxt-component-meta/compare/v0.1.9...v0.2.0) (2022-08-29)


### ⚠ BREAKING CHANGES

* use vue-component-meta (#34)

### Features

* use vue-component-meta ([#34](https://github.com/nuxt-content/nuxt-component-meta/issues/34)) ([f17413d](https://github.com/nuxt-content/nuxt-component-meta/commit/f17413db27dd008524e57c201bb0cefba129a96e))


### Bug Fixes

* skip parsing non-sfcs ([#36](https://github.com/nuxt-content/nuxt-component-meta/issues/36)) ([6f4f4cd](https://github.com/nuxt-content/nuxt-component-meta/commit/6f4f4cd9c9a11d040fd47247bc6f36a2b0987c27))

### [0.1.9](https://github.com/nuxt-content/nuxt-component-meta/compare/v0.1.8...v0.1.9) (2022-07-21)


### Features

* add parsed hook ([#29](https://github.com/nuxt-content/nuxt-component-meta/issues/29)) ([8ce51dd](https://github.com/nuxt-content/nuxt-component-meta/commit/8ce51dd46bb147491dbc13f2bddcdadfcb582aa8))
* detect `$slots.*` usage in script ([#31](https://github.com/nuxt-content/nuxt-component-meta/issues/31)) ([83ae454](https://github.com/nuxt-content/nuxt-component-meta/commit/83ae454c64b48c158762829a1c45fe886e905da5))
* parse normal scripts with `defineComponent` ([#28](https://github.com/nuxt-content/nuxt-component-meta/issues/28)) ([8fca9e4](https://github.com/nuxt-content/nuxt-component-meta/commit/8fca9e4b78551bbcd56fd5e1f8703d823c6b4f8c))


### Bug Fixes

* handle complex slot ([8a41b01](https://github.com/nuxt-content/nuxt-component-meta/commit/8a41b01f48393d4a414c0bbe8a2e8698b63504e7))

### [0.1.8](https://github.com/nuxt-content/nuxt-component-meta/compare/v0.1.7...v0.1.8) (2022-07-20)


### Features

* detect ts as expression and Vue's PropType ([4d2388d](https://github.com/nuxt-content/nuxt-component-meta/commit/4d2388d680b43c378f4d7f40d37fd5e29455d06d))


### Bug Fixes

* check for object properties ([0f20817](https://github.com/nuxt-content/nuxt-component-meta/commit/0f208173a665b1de758d3486c9791a3c811e350e))

### [0.1.7](https://github.com/nuxt-content/nuxt-component-meta/compare/v0.1.6...v0.1.7) (2022-07-19)


### Bug Fixes

* prevent `undefined` error ([5a403f4](https://github.com/nuxt-content/nuxt-component-meta/commit/5a403f415f24c450a276e34b98f32040cf54719d))

### [0.1.6](https://github.com/nuxt-content/nuxt-component-meta/compare/v0.1.5...v0.1.6) (2022-07-19)


### Features

* add flag for global components ([#27](https://github.com/nuxt-content/nuxt-component-meta/issues/27)) ([6e70ad3](https://github.com/nuxt-content/nuxt-component-meta/commit/6e70ad3bde35d5d04cbe8eaaf5cdff39b0186cf7))
* basic support for typescript defineProps ([#25](https://github.com/nuxt-content/nuxt-component-meta/issues/25)) ([60cfbaf](https://github.com/nuxt-content/nuxt-component-meta/commit/60cfbaf86f339e00fda6e7474b75a99fe44c1943))
* detect `$slots` usages in template ([#26](https://github.com/nuxt-content/nuxt-component-meta/issues/26)) ([ec35351](https://github.com/nuxt-content/nuxt-component-meta/commit/ec3535156e2297c92d45c9b31b8315f76734f5a1))
* extract props info from `defineProps` ([#21](https://github.com/nuxt-content/nuxt-component-meta/issues/21)) ([8f89275](https://github.com/nuxt-content/nuxt-component-meta/commit/8f8927581e9067e8ac49782931065012634668bb))

### [0.1.5](https://github.com/nuxt-content/nuxt-component-meta/compare/v0.1.2...v0.1.5) (2022-05-11)


### Bug Fixes

* **api:** fix single component query ([5f967c5](https://github.com/nuxt-content/nuxt-component-meta/commit/5f967c5a4fc0a36b14b72ed37158e57ddc262770))
* **lint:** fix linting ([237b16f](https://github.com/nuxt-content/nuxt-component-meta/commit/237b16fd181528276818e7b1654ad6b3d7f57656))
* use addServerHandler and correct method ([3d247cc](https://github.com/nuxt-content/nuxt-component-meta/commit/3d247cc7983b951c463ceae15fa5819225241ef1))

### [0.1.2](https://github.com/farnabaz/nuxt-component-meta/compare/v0.1.0...v0.1.2) (2022-04-19)

## [0.1.0](https://github.com/nuxt-content/nuxt-component-meta/compare/v0.0.7...v0.1.0) (2022-04-15)


### Features

* support Vue3 ([#17](https://github.com/nuxt-content/nuxt-component-meta/issues/17)) ([f52cf6d](https://github.com/nuxt-content/nuxt-component-meta/commit/f52cf6de9afd5d6916b7d1803ebd5c438d0084e9))

### [0.0.7](https://github.com/farnabaz/nuxt-component-meta/compare/v0.0.6...v0.0.7) (2021-11-22)


### Bug Fixes

* build ([eb8f884](https://github.com/farnabaz/nuxt-component-meta/commit/eb8f88488889a153dbeb46e1145ac773a6afc511))
* ESM distDir detection ([d444cf5](https://github.com/farnabaz/nuxt-component-meta/commit/d444cf52106abf5862f051d9744a6e05dd4b9a51))

### [0.0.6](https://github.com/farnabaz/nuxt-component-meta/compare/v0.0.5...v0.0.6) (2021-11-22)


### Bug Fixes

* resolve components path ([9b071d3](https://github.com/farnabaz/nuxt-component-meta/commit/9b071d3b9fe8bf0a73c7b065a9a75a1d704d49d2))

### [0.0.5](https://github.com/farnabaz/nuxt-component-meta/compare/v0.0.4...v0.0.5) (2021-11-16)


### Features

* add module parser options ([#14](https://github.com/farnabaz/nuxt-component-meta/issues/14)) ([e8cd5d3](https://github.com/farnabaz/nuxt-component-meta/commit/e8cd5d36f04576a18ec725b7461b4f3e03944050))

### [0.0.4](https://github.com/farnabaz/nuxt-component-meta/compare/v0.0.3...v0.0.4) (2021-11-09)


### Bug Fixes

* handle parse error ([b942424](https://github.com/farnabaz/nuxt-component-meta/commit/b942424f78e31d89a8b509a28d8aa8145049c35d))

### [0.0.3](https://github.com/farnabaz/nuxt-component-meta/compare/v0.0.2...v0.0.3) (2021-10-13)


### Bug Fixes

* add template extension ([f1f3873](https://github.com/farnabaz/nuxt-component-meta/commit/f1f38738b5e3a87533772b394c8b5fff1f51a706))

### [0.0.2](https://github.com/farnabaz/nuxt-component-meta/compare/v0.0.1...v0.0.2) (2021-10-13)


### Bug Fixes

* rename props key to name ([8781217](https://github.com/farnabaz/nuxt-component-meta/commit/87812174971d190f78ae7e3a0bb1fc8055189f55))

### 0.0.1 (2021-10-13)


### Features

* provide slots, required, value and description meta ([81b2a5c](https://github.com/farnabaz/nuxt-component-meta/commit/81b2a5cb32ee3382e9b3409b62646463e4e5ee55))
