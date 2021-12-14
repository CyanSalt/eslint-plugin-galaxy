# Enforce unified spacing around binding attributes (`vue-attribute-spacing`)

Vue supports JavaScript expressions in HTML attribute values via directives. Sometimes whitespaces may or may not appear on either side of an expression, and we may expect to maintain maintain a uniform style within a project.

This rule does not affect static (string) attributes and mustache interpolation.

This rule is fixable.

## Options

This rule has a string option:

- `"always"` expects one space between expression and quotes.
- `"never"` (default) expects no spaces between expression and quotes.

## Fail

```vue
<template>
  <p v-foo=" bar "></p>
</template>
```

```vue
<template>
  <p :foo=" bar "></p>
</template>
```

```vue
<template>
  <p @foo=" bar "></p>
</template>
```

```vue
<template>
  <!-- eslint galaxy/vue-attribute-spacing: ["error", "always"] -->
  <p v-foo="bar"></p>
</template>
```

```vue
<template>
  <!-- eslint galaxy/vue-attribute-spacing: ["error", "always"] -->
  <p :foo="bar"></p>
</template>
```

```vue
<template>
  <!-- eslint galaxy/vue-attribute-spacing: ["error", "always"] -->
  <p @foo="bar"></p>
</template>
```

## Pass

```vue
<template>
  <p :foo="bar"></p>
</template>
```

```vue
<template>
  <p foo=" bar "></p>
</template>
```

```vue
<template>
  <p>{{ bar }}</p>
</template>
```

```vue
<template>
  <!-- eslint galaxy/vue-attribute-spacing: ["error", "always"] -->
  <p :foo=" bar "></p>
</template>
```
