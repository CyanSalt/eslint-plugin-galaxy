# Disallow using deprecated Vue `::v-deep` combinators (`no-deprecated-vue-deep-combinator`)

**This rule depends on [`eslint-plugin-vue-scoped-css`](https://npmjs.com/package/eslint-plugin-vue-scoped-css).**

This rule is similar to [`vue-scoped-css/require-v-deep-argument`](https://future-architect.github.io/eslint-plugin-vue-scoped-css/rules/require-v-deep-argument.html) with the following differences:

- This rule will replace the deprecated `::v-deep` directly with `:deep`, so it only applies to `vue@>=2.7`.
- This rule will also handle nested CSS rules (`eslint-plugin-vue-scoped-css` intentionally ignores them).

This rule will not handle earlier combinators such as `>>>` or `/deep/`. You can replace them with the [`vue-scoped-css/no-deprecated-deep-combinator`](https://future-architect.github.io/eslint-plugin-vue-scoped-css/rules/no-deprecated-deep-combinator.html) rule.

This rule is fixable.

## Fail

```html
<style scoped>
.foo ::v-deep .bar {
  display: block;
}
</style>
```

```html
<style scoped>
.foo ::v-deep(.bar) {
  display: block;
}
</style>
```

```html
<!-- Won't be fixed -->
<style lang="scss" scoped>
.foo ::v-deep {
  .bar {
    display: block;
  }
}
</style>
```

```html
<style scoped>
::v-deep .foo .bar {
  display: block;
}
</style>
```

## Pass

```html
<style scoped>
.foo {
  display: block;
}
</style>
```

```html
<style scoped>
.foo :deep(.bar) {
  display: block;
}
</style>
```

```html
<style>
/*   ↑↑↑ */
.foo ::v-deep .bar {
  display: block;
}
</style>
```
