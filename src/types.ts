export type ParseFn<T = unknown> = (input: unknown) => T;

export type Parser<ParseFns extends ParseFn[] = ParseFn[]> = {
  parseLatest: (input: unknown) => ReturnType<ParseFns[0]>;
  parseAny: (input: unknown) => ReturnType<ParseFns[number]>;
  parseSpecific: <VN extends number>(
    versionIndex: VN,
    input: unknown
  ) => ReturnType<ParseFns[VN]>;
  getAllParseFns: () => ParseFns;
};

/** Type of the newest schema version in this parser */
export type LatestVersion<PT extends Parser> = ReturnType<PT['parseLatest']>;

/** Type of any schema version in this parser */
export type AnyVersion<PT extends Parser> = ReturnType<PT['parseAny']>;

type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>

type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>

/** Type of a specific schema version in this parser. `VI` is the index of the parse function as provided to the parser type `PT`. */
export type SpecificVersion<
  PT extends Parser,
  VI extends IntRange<0, ReturnType<PT['getAllParseFns']>['length']>
> = ReturnType<PT['getAllParseFns']>[VI];
