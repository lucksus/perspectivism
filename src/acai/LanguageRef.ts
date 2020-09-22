export type Hash = string;

// Unique Language ID with option type
export default class LanguageRef {
    // Optional type of ExpressionAdapter which enables generic
    // language adapters like for Holochain where the same
    // ExpressionAdapter implementation can be used with any
    // DNA implementing the Expression trait.
    languageType: void | string;
    languageHash: Hash;
    name: string;
}
