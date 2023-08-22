# 🤓 Versioned Parser

*A TypeScript-first utility for managing multiple versions of parse functions.*

Let's say your app writes some data somewhere in the form of stringified JSON (whether it's `localstorage`, IPFS or any other storage). Because you're a good citizen, you use a parser like `zod` to ensure that this data matches your expected schema at runtime whenever you read it, and you even parse any data you *write* through your parser to ensure you never end up writing anything invalid. You probably have a bunch of functions in your app that accept or return data shaped like your schema.

All is well until you add a new feature, and you now need to add additional keys and values to your schema. Because this external data may have been written by a previous version of your app, you need to be able to *read any version* of your schema, but you only want to *write the latest version*. And you want to make sure that all your functions that accept or return either only the latest version or any version are tightly typed accordingly, so that you never end up accidentally writing an outdated version of your schema.

This is where Versioned Parser comes in.

## 👋 Getting started

### Install

```sh
npm install @efstajas/versioned-parser
```

### ✨ Creating a Versioned Parser

For the examples below, we're going to use `zod` as our data validation tool, but Versioned Parser will work with any parse function that takes a single input parameter, throws an error if the expected schema is not followed, and returns the parsed data.

Let's create three versions of a dummy Zod schema, where each adds another mandatory key. When you have your schema versions defined, simply call `createVersionedParser` and pass the versions of your *parse function* (function that takes a single input parameter, throws an error if the expected schema is not followed, and returns the parsed data) in an array as the first argument, where the latest version must be first (index zero), and older versions follow.

```ts
import z from 'zod';
import { createVersionedParser } from '@efstajas/versioned-parser';

// Define example schemas. We're using Zod here, but any parse function will work.

const schemaV1 = z.object({
  foo: z.string(),
  bar: z.number(),
});

const schemaV2 = schemaV1.extend({
  type: z.literal('yes'),
});

const schemaV3 = schemaV2.extend({
  anotherOne: z.literal('no'),
});


/*
  Create the versioned parser. The first argument is an array of parse functions, where index zero is the newest version, 
  and the rest are older versions in descending order.
*/
const parser = createVersionedParser([
  schemaV3.parse,
  schemaV2.parse,
  schemaV1.parse,
]);
```

### 🤓 Parsing data

Once you've created your Versioned Parser, you can start parsing data using three functions; `parseLatest`, `parseAny`, or `parseSpecific`. All these functions magically infer the correct type from your array of parse functions:

```ts
// [...]

// Type of res1 is { foo: string, bar: number, type: 'yes', anotherOne: 'no' }
const res1 = parser.parseLatest(someInput);

// Type of res2 is a union of all versions of the schema.
const res2 = parser.parseAny(someInput);

// Type of res3 is { foo: string, bar: number, type: 'yes' }
const res3 = parser.parseSpecific(1, someInput);
```

As you can see, `parseLatest` always takes the latest version of your parse function, and thus enforces the latest schema. The result of this function is strongly typed according to the return type of the first parse function you passed in your version array.

`parseAny` on the other hand will attempt parsing the supplied data with all possible versions. It'll first try the latest version, then the second-latest, and so on. If none of the parse functions match, it throws an error.

`parseSpecific` allows you to apply a specific parse function according to its index in the version array you passed to `createVersionedParser`.

### Type helpers

In addition to actually running your parse functions, Versioned Parser also comes with a number of helpful TypeScript generics that allow you to strongly type functions processing parsed data as accepting or returning only specific versions of your data:

```ts
  // [...]

 // LatestVersion generic will be the type of the latest version of the parser's schema.
 type LatestVersionOfMySchema = LatestVersion<typeof parser>;
 
 // AnyVersion generic will be a union of all versions of the parser's schema.
 type AnyVersionOfMySchema = AnyVersion<typeof parser>;
 
 
 // SpecificVersion generic returns the type of a specific version of the parser's schema,
 // where `VI` is the index of the parse function as provided to the parser type `PT`.
 type SpecificVersionOfMySchema = SpecificVersion<typeof parser, 0>;
```
