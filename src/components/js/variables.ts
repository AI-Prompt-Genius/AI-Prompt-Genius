// Typed-variable engine for prompt tokens.
//
// The prompt `text` string stays the single source of truth. This module parses the
// `{{…}}` tokens in that string into a typed model, evaluates conditional logic with a
// *sandboxed* expression evaluator (no eval / no new Function — prompts are shared and
// imported, so arbitrary code execution is off the table), and substitutes filled-in
// values back to produce the final prompt.
//
// Syntax (see plan): {{Name}} legacy · {{Name::text}} · {{Name::largeText}} ·
// {{Name::number}} / {{Name::number-0}} · {{Name::list-a; b; c}} inline dropdown ·
// {{Name::list@setName}} saved-set dropdown · {{if <expr> {vardef};else {vardef}}} conditional.

import type { Branch, Conditional, OptionSet, ParsedVar, Token, VarType } from "../../types"

export type VarValues = Record<string, string>

function isConditional(t: Token): t is Conditional {
    return (t as Conditional).kind === "conditional"
}

// ---------------------------------------------------------------------------------
// Tokenizing
// ---------------------------------------------------------------------------------

/**
 * Scan `text` for top-level `{{ … }}` tokens. Uses single-brace depth tracking so a
 * conditional body (which contains `{ }` groups) is captured whole rather than cut off
 * at the first `}}`. Returns tokens in source order (duplicates included).
 */
export function tokenize(text: string): Token[] {
    const tokens: Token[] = []
    let i = 0
    while (i < text.length) {
        const start = text.indexOf("{{", i)
        if (start === -1) break
        const close = findClosingBraces(text, start + 2)
        if (close === -1) break // unterminated — stop scanning
        const inner = text.slice(start + 2, close)
        const raw = text.slice(start, close + 2)
        tokens.push(parseToken(inner, raw))
        i = close + 2
    }
    return tokens
}

/**
 * Given the index just after an opening `{{`, return the index of the token-level `}}`
 * that closes it, accounting for balanced single braces in between. Returns -1 if none.
 */
function findClosingBraces(text: string, from: number): number {
    let depth = 0
    for (let j = from; j < text.length; j++) {
        const c = text[j]
        if (c === "{") {
            depth++
        } else if (c === "}") {
            if (depth > 0) {
                depth--
            } else if (text[j + 1] === "}") {
                return j // token-level closing brace, next char is the second '}'
            }
            // otherwise a lone '}' at token level: literal content, keep scanning
        }
    }
    return -1
}

function parseToken(inner: string, raw: string): Token {
    if (/^\s*if\b/.test(inner)) {
        const cond = parseConditional(inner, raw)
        if (cond) return cond
        // malformed conditional falls through to a legacy variable so nothing crashes
    }
    return parseVar(inner, raw)
}

// ---------------------------------------------------------------------------------
// Simple variables
// ---------------------------------------------------------------------------------

/** Parse the inside of a `{{ … }}` (or a branch `{ … }`) into a typed variable. */
export function parseVar(inner: string, raw: string): ParsedVar {
    const sepIndex = inner.indexOf("::")
    if (sepIndex === -1) {
        // Legacy variable — the whole inner is the name (matches historical behavior).
        return { name: inner.trim(), type: "legacy", raw }
    }
    const name = inner.slice(0, sepIndex).trim()
    const spec = inner.slice(sepIndex + 2).trim()
    const { type, options, optionSetRef, def } = parseSpec(spec)
    const v: ParsedVar = { name, type, raw }
    if (options) v.options = options
    if (optionSetRef) v.optionSetRef = optionSetRef
    if (def !== undefined) v.default = def
    return v
}

function parseSpec(spec: string): {
    type: VarType
    options?: string[]
    optionSetRef?: string
    def?: string
} {
    // `largeText` before `text` so the `text-` prefix check can't swallow it.
    if (spec === "largeText") return { type: "largeText" }
    if (spec.startsWith("largeText-")) {
        return { type: "largeText", def: spec.slice("largeText-".length) }
    }
    if (spec === "text" || spec === "") return { type: "text" }
    if (spec.startsWith("text-")) return { type: "text", def: spec.slice("text-".length) }
    if (spec === "number" || spec.startsWith("number-")) {
        const def = spec.startsWith("number-") ? spec.slice("number-".length) : undefined
        return { type: "number", def }
    }
    if (spec.startsWith("list@")) {
        return { type: "dropdown", optionSetRef: spec.slice("list@".length).trim() }
    }
    if (spec.startsWith("list-")) {
        const options = spec
            .slice("list-".length)
            .split(";")
            .map(o => o.trim())
            .filter(o => o.length > 0)
        return { type: "dropdown", options }
    }
    // Unrecognized spec: treat as a plain text field so authors still get an input.
    return { type: "text" }
}

// ---------------------------------------------------------------------------------
// Conditionals: {{if <expr> {body};else {body}}}
// ---------------------------------------------------------------------------------

function parseConditional(inner: string, raw: string): Conditional | null {
    const afterIf = inner.replace(/^\s*if\b/, "")
    // The expression runs up to the first top-level '{' (start of the then-branch body).
    const braceIndex = indexOfTopLevel(afterIf, "{")
    if (braceIndex === -1) return null
    const expr = afterIf.slice(0, braceIndex).trim()

    const thenClose = matchBrace(afterIf, braceIndex)
    if (thenClose === -1) return null
    const thenBody = afterIf.slice(braceIndex + 1, thenClose)

    let elseBranch: Branch | null = null
    const rest = afterIf.slice(thenClose + 1)
    const elseMatch = /^\s*;?\s*else\b/.exec(rest)
    if (elseMatch) {
        const afterElse = rest.slice(elseMatch[0].length)
        const elseOpen = indexOfTopLevel(afterElse, "{")
        if (elseOpen !== -1) {
            const elseClose = matchBrace(afterElse, elseOpen)
            if (elseClose !== -1) {
                elseBranch = parseBranchBody(afterElse.slice(elseOpen + 1, elseClose))
            }
        }
    }

    return {
        kind: "conditional",
        expr,
        then: parseBranchBody(thenBody),
        else: elseBranch,
        raw,
    }
}

/**
 * Parse a branch body. The text inside a branch's `{ }` is a single variable definition
 * (e.g. `a::text`) or a nested conditional (e.g. `if b {c::text}`) — not further-braced.
 */
function parseBranchBody(body: string): Branch {
    const trimmed = body.trim()
    if (trimmed === "") return { raw: body, tokens: [] }
    return { raw: body, tokens: [parseToken(trimmed, trimmed)] }
}

/** Index of `char` in `s` at brace-depth 0 (ignores occurrences inside nested braces). */
function indexOfTopLevel(s: string, char: string): number {
    let depth = 0
    for (let j = 0; j < s.length; j++) {
        const c = s[j]
        if (c === "{") {
            if (char === "{" && depth === 0) return j
            depth++
        } else if (c === "}") {
            if (depth > 0) depth--
        } else if (c === char && depth === 0) {
            return j
        }
    }
    return -1
}

/** Given the index of an opening `{`, return the index of its matching `}` (or -1). */
function matchBrace(s: string, open: number): number {
    let depth = 0
    for (let j = open; j < s.length; j++) {
        if (s[j] === "{") depth++
        else if (s[j] === "}") {
            depth--
            if (depth === 0) return j
        }
    }
    return -1
}

// ---------------------------------------------------------------------------------
// Sandboxed expression evaluator
// ---------------------------------------------------------------------------------

type ExprValue = string | number | boolean

/**
 * Evaluate a boolean/arithmetic expression against `values`. Supports literals
 * (string/number/true/false), variable references, `== != < > <= >=`, `&& || !`,
 * `+` (numeric add or string concat), and parentheses. No property access, calls, or
 * globals. Any parse/eval error returns "" (a falsy fallback) — never throws.
 */
export function evalExpression(expr: string, values: VarValues): ExprValue {
    try {
        const p = new ExprParser(expr, values)
        const result = p.parseOr()
        p.expectEnd()
        return result
    } catch {
        return ""
    }
}

interface ExprToken {
    type: "num" | "str" | "ident" | "op"
    value: string
}

const OPERATORS = ["==", "!=", "<=", ">=", "&&", "||", "<", ">", "+", "!", "(", ")"]

function lexExpr(expr: string): ExprToken[] {
    const out: ExprToken[] = []
    let i = 0
    while (i < expr.length) {
        const c = expr[i]
        if (c === " " || c === "\t" || c === "\n") {
            i++
            continue
        }
        if (c === '"' || c === "'") {
            let j = i + 1
            let str = ""
            while (j < expr.length && expr[j] !== c) {
                if (expr[j] === "\\" && j + 1 < expr.length) {
                    str += expr[j + 1]
                    j += 2
                } else {
                    str += expr[j]
                    j++
                }
            }
            if (j >= expr.length) throw new Error("unterminated string")
            out.push({ type: "str", value: str })
            i = j + 1
            continue
        }
        if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(expr[i + 1] ?? ""))) {
            let j = i
            while (j < expr.length && /[0-9.]/.test(expr[j])) j++
            out.push({ type: "num", value: expr.slice(i, j) })
            i = j
            continue
        }
        if (/[A-Za-z_$]/.test(c)) {
            let j = i
            while (j < expr.length && /[A-Za-z0-9_$ ]/.test(expr[j])) j++
            // trailing spaces belong to the following operator, not the identifier
            out.push({ type: "ident", value: expr.slice(i, j).trim() })
            i = j
            continue
        }
        const op = OPERATORS.find(o => expr.startsWith(o, i))
        if (!op) throw new Error(`unexpected char: ${c}`)
        out.push({ type: "op", value: op })
        i += op.length
    }
    return out
}

class ExprParser {
    private toks: ExprToken[]
    private pos = 0
    constructor(
        expr: string,
        private values: VarValues,
    ) {
        this.toks = lexExpr(expr)
    }

    private peek(): ExprToken | undefined {
        return this.toks[this.pos]
    }
    private eatOp(op: string): boolean {
        const t = this.peek()
        if (t && t.type === "op" && t.value === op) {
            this.pos++
            return true
        }
        return false
    }
    expectEnd(): void {
        if (this.pos !== this.toks.length) throw new Error("trailing tokens")
    }

    parseOr(): ExprValue {
        let left = this.parseAnd()
        while (this.eatOp("||")) {
            const right = this.parseAnd()
            left = truthy(left) || truthy(right)
        }
        return left
    }
    private parseAnd(): ExprValue {
        let left = this.parseEquality()
        while (this.eatOp("&&")) {
            const right = this.parseEquality()
            left = truthy(left) && truthy(right)
        }
        return left
    }
    private parseEquality(): ExprValue {
        let left = this.parseComparison()
        for (;;) {
            if (this.eatOp("==")) left = looseEquals(left, this.parseComparison())
            else if (this.eatOp("!=")) left = !looseEquals(left, this.parseComparison())
            else break
        }
        return left
    }
    private parseComparison(): ExprValue {
        let left = this.parseAdditive()
        for (;;) {
            if (this.eatOp("<=")) left = num(left) <= num(this.parseAdditive())
            else if (this.eatOp(">=")) left = num(left) >= num(this.parseAdditive())
            else if (this.eatOp("<")) left = num(left) < num(this.parseAdditive())
            else if (this.eatOp(">")) left = num(left) > num(this.parseAdditive())
            else break
        }
        return left
    }
    private parseAdditive(): ExprValue {
        let left = this.parseUnary()
        while (this.eatOp("+")) {
            const right = this.parseUnary()
            if (isNumeric(left) && isNumeric(right)) left = num(left) + num(right)
            else left = str(left) + str(right)
        }
        return left
    }
    private parseUnary(): ExprValue {
        if (this.eatOp("!")) return !truthy(this.parseUnary())
        return this.parsePrimary()
    }
    private parsePrimary(): ExprValue {
        const t = this.peek()
        if (!t) throw new Error("unexpected end")
        if (t.type === "op" && t.value === "(") {
            this.pos++
            const inner = this.parseOr()
            if (!this.eatOp(")")) throw new Error("missing )")
            return inner
        }
        if (t.type === "num") {
            this.pos++
            return Number(t.value)
        }
        if (t.type === "str") {
            this.pos++
            return t.value
        }
        if (t.type === "ident") {
            this.pos++
            if (t.value === "true") return true
            if (t.value === "false") return false
            return this.values[t.value] ?? ""
        }
        throw new Error(`unexpected token: ${t.value}`)
    }
}

function isNumeric(v: ExprValue): boolean {
    if (typeof v === "number") return true
    if (typeof v === "boolean") return false
    return v.trim() !== "" && !isNaN(Number(v))
}
function num(v: ExprValue): number {
    return typeof v === "number" ? v : typeof v === "boolean" ? (v ? 1 : 0) : Number(v)
}
function str(v: ExprValue): string {
    return typeof v === "string" ? v : String(v)
}
function truthy(v: ExprValue): boolean {
    if (typeof v === "boolean") return v
    if (typeof v === "number") return v !== 0
    return v !== ""
}
function looseEquals(a: ExprValue, b: ExprValue): boolean {
    if (isNumeric(a) && isNumeric(b)) return num(a) === num(b)
    return str(a) === str(b)
}

// ---------------------------------------------------------------------------------
// Resolution: which vars are active, and the final substituted text
// ---------------------------------------------------------------------------------

/** Resolve a variable's default to a display string (defaults may be expressions). */
export function resolveDefault(v: ParsedVar, values: VarValues): string {
    if (v.default === undefined) return ""
    const raw = v.default.trim()
    if (raw === "") return ""
    const evaluated = evalExpression(raw, values)
    // Fall back to the literal default when evaluation yields nothing useful.
    if (evaluated === "" || (typeof evaluated === "number" && isNaN(evaluated))) return v.default
    return str(evaluated)
}

/** The value that should fill a variable: user input, else its resolved default. */
export function valueFor(v: ParsedVar, values: VarValues): string {
    const entered = values[v.name]
    if (entered !== undefined && entered !== "") return entered
    return resolveDefault(v, values)
}

/**
 * Flatten `tokens` into the de-duplicated (by name) list of variables the user should
 * fill *right now*, evaluating each conditional against `values` to pick a branch.
 */
export function resolveActiveVars(tokens: Token[], values: VarValues): ParsedVar[] {
    const out: ParsedVar[] = []
    const seen = new Set<string>()
    const walk = (list: Token[]) => {
        for (const t of list) {
            if (isConditional(t)) {
                const branch = truthy(evalExpression(t.expr, values)) ? t.then : t.else
                if (branch) walk(branch.tokens)
            } else if (t.type !== "legacy" || t.name !== "") {
                if (!seen.has(t.name)) {
                    seen.add(t.name)
                    out.push(t)
                }
            }
        }
    }
    walk(tokens)
    return out
}

/** Every variable declared anywhere in the tokens (both branches of every conditional). */
export function collectAllVars(tokens: Token[]): ParsedVar[] {
    const out: ParsedVar[] = []
    const walk = (list: Token[]) => {
        for (const t of list) {
            if (isConditional(t)) {
                walk(t.then.tokens)
                if (t.else) walk(t.else.tokens)
            } else if (!(t.type === "legacy" && t.name === "")) {
                out.push(t)
            }
        }
    }
    walk(tokens)
    return out
}

/** True when the prompt contains at least one fillable variable (in any branch). */
export function hasVariables(text: string): boolean {
    return collectAllVars(tokenize(text)).length > 0
}

/**
 * Produce the final prompt: substitute every token with its resolved value. Conditionals
 * render the chosen branch's body with its own variables substituted; dropdowns use the
 * selected option (saved-set lookups honored via `optionSets` for validation only — the
 * stored value is already the chosen option text).
 */
export function resolveText(text: string, values: VarValues, _optionSets?: OptionSet[]): string {
    let out = text
    for (const token of tokenize(text)) {
        const replacement = isConditional(token)
            ? resolveConditional(token, values)
            : valueFor(token, values)
        out = replaceAllLiteral(out, token.raw, replacement)
    }
    return out
}

function resolveConditional(c: Conditional, values: VarValues): string {
    const branch = truthy(evalExpression(c.expr, values)) ? c.then : c.else
    if (!branch) return ""
    return branch.tokens
        .map(t => (isConditional(t) ? resolveConditional(t, values) : valueFor(t, values)))
        .join("")
}

function replaceAllLiteral(haystack: string, needle: string, replacement: string): string {
    if (needle === "") return haystack
    return haystack.split(needle).join(replacement)
}
