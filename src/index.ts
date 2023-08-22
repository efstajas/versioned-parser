import { ParseFn, Parser } from "./types";

/**
 * Create a versioned parser. Create it with any amount of versions of the same schema.
 * Call `parseLatest` to parse using the latest version of the schema, or `parseAny`
 * to parse using any version of the schema. `parseAny` will attempt to parse using
 * the latest version first, then the second-latest, and so on. The versions are ordered newest
 * to oldest.
 * 
 * Versions must be a function accepting a value, returning the desired type. Here's an example for
 * how to use this with Zod:
 * 
 * ```ts
 * const schemaV1 = z.object({
 *  foo: z.string(),
 *  bar: z.number(),
 * });
 * 
 * const schemaV2 = schemaV1.extend({
 *  type: z.literal('yes'),
 * });
 * 
 * const schemaV3 = schemaV1.extend({
 *  anotherOne: z.literal('no'),
 * });
 * 
 * const parser = createVersionedParser([
 *  schemaV3.parse,
 *  schemaV2.parse,
 *  schemaV1.parse,
 * ]);
 * 
 * // Type of res1 is { foo: string, bar: number, type: 'yes', anotherOne: 'no' }
 * const res1 = parser.parseLatest('some input');
 * 
 * // Type of res2 is a union of all versions of the schema.
 * const res2 = parser.parseAny('some input');
 * 
 * // Type of res3 is { foo: string, bar: number, type: 'yes' }
 * const res3 = parser.parseSpecific(1, 'some input');
 * 
 * // ___________
 * // Additionally, there are a few helpful generics for typing:
 * 
 * // LatestVersion generic will be the type of the latest version of the parser's schema.
 * type LatestVersionOfMySchema = LatestVersion<typeof parser>;
 * 
 * // AnyVersion generic will be a union of all versions of the parser's schema.
 * type AnyVersionOfMySchema = AnyVersion<typeof parser>;
 * 
 * 
 * // SpecificVersion generic returns the type of a specific version of the parser's schema,
 * // where `VI` is the index of the parse function as provided to the parser type `PT`.
 * type SpecificVersionOfMySchema = SpecificVersion<typeof parser, 0>;
 * ```
 * 
 * @param versions The versions of the schema to include in the parser. Must be ordered newest to oldest.
 * @return A versioned parser with the given versions.
 */
export const createVersionedParser = <PF extends ParseFn[]>(
  versions: [...PF]
): Parser<typeof versions> => {

  /**
   * Parse object `input` using the latest version of the schema.
   * @param input The data to parse using the latest schema.
   * @returns The data parsed using the latest schema.
   */
  function parseLatest(input: unknown): ReturnType<(typeof versions)[0]> {
    return versions[0](input) as ReturnType<(typeof versions)[0]>;
  }

  /**
   * Parse object `input` using any version of the schema. Attempts parsing
   * using the latest version first, then the second-latest, and so on.
   * @param input The data to parse using any version of the schema.
   * @returns The data parsed using the latest schema.
   */
  function parseAny(input: unknown): ReturnType<PF[number]> {
    // Attempt parsing with all versions, starting with the latest.
    for (const version of versions) {
      try {
        const parsed = version(input);
        return parsed as ReturnType<PF[number]>;
      } catch (e) {
        // If parsing fails, try the next version.
        continue;
      }
    }

    // If parsing fails for all versions, throw an error.
    throw new Error(`Failed to parse metadata (no version matched): ${input}`);
  }

  /**
   * Parse using a specific version of the schema. 
   * @param versionIndex The index of the parse function to use, matching the provided array of versions.
   * @param input The data to parse using the specified version of the schema.
   * @returns The data parsed using the specified version of the schema.
   */
  function parseSpecific<VN extends number>(versionIndex: VN,input: unknown): ReturnType<PF[VN]> {
    return versions[versionIndex](input) as ReturnType<PF[VN]>;
  }

  /**
   * Get all parse functions in this parser.
   * @returns All parse functions in this parser.
   */
  function getAllParseFns() {
    return versions;
  }

  return {
    parseLatest,
    parseAny,
    parseSpecific,
    getAllParseFns,
  };
};
