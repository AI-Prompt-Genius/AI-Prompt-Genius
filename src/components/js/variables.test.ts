import { describe, expect, it } from "vitest"
import {
    buildConditionExpr,
    evalExpression,
    hasVariables,
    parseSimpleCondition,
    parseVar,
    resolveActiveVars,
    resolveText,
    tokenize,
} from "./variables"
import type { Conditional, ParsedVar } from "../../types"

const asVar = (t: unknown) => t as ParsedVar
const asCond = (t: unknown) => t as Conditional

describe("parseVar / spec parsing", () => {
    it("treats a bare name as a legacy variable", () => {
        const v = parseVar("firstName", "{{firstName}}")
        expect(v).toMatchObject({ name: "firstName", type: "legacy" })
    })
    it("parses text and largeText", () => {
        expect(parseVar("A::text", "").type).toBe("text")
        expect(parseVar("Bio::largeText", "").type).toBe("largeText")
    })
    it("parses number with and without a default", () => {
        expect(parseVar("n::number", "").type).toBe("number")
        expect(parseVar("n::number", "").default).toBeUndefined()
        expect(parseVar("n::number-0", "")).toMatchObject({ type: "number", default: "0" })
        expect(parseVar("n::number-3+x", "")).toMatchObject({ type: "number", default: "3+x" })
    })
    it("parses optional defaults for text and largeText", () => {
        expect(parseVar("greeting::text-Hello", "")).toMatchObject({
            type: "text",
            default: "Hello",
        })
        expect(parseVar("bio::largeText-write here", "")).toMatchObject({
            type: "largeText",
            default: "write here",
        })
        // bare largeText must not be read as text with a default
        expect(parseVar("bio::largeText", "").type).toBe("largeText")
        expect(parseVar("bio::largeText", "").default).toBeUndefined()
    })
    it("parses inline dropdown options split on ;", () => {
        const v = parseVar("tone::list-happy; very, sad; neutral", "")
        expect(v.type).toBe("dropdown")
        expect(v.options).toEqual(["happy", "very, sad", "neutral"])
    })
    it("parses a saved-set dropdown reference", () => {
        expect(parseVar("tone::list@tones", "")).toMatchObject({
            type: "dropdown",
            optionSetRef: "tones",
        })
    })
})

describe("tokenize", () => {
    it("finds simple tokens in order", () => {
        const toks = tokenize("Hi {{name}}, you are {{mood::text}}")
        expect(toks.map(t => asVar(t).name)).toEqual(["name", "mood"])
    })
    it("captures a whole conditional despite inner braces", () => {
        const toks = tokenize("{{if x == 1 {a::text};else {b::number}}}")
        expect(toks).toHaveLength(1)
        const c = asCond(toks[0])
        expect(c.kind).toBe("conditional")
        expect(c.expr).toBe("x == 1")
        expect(c.then.tokens.map(t => asVar(t).name)).toEqual(["a"])
        expect(c.else?.tokens.map(t => asVar(t).name)).toEqual(["b"])
    })
    it("supports a conditional with no else", () => {
        const c = asCond(tokenize("{{if flag {note::text}}}")[0])
        expect(c.else).toBeNull()
        expect(c.then.tokens.map(t => asVar(t).name)).toEqual(["note"])
    })
})

describe("evalExpression (sandboxed)", () => {
    const v = { x: "foo", n: "5", flag: "true" }
    it("string equality", () => {
        expect(evalExpression('x == "foo"', v)).toBe(true)
        expect(evalExpression('x != "bar"', v)).toBe(true)
    })
    it("numeric comparison and arithmetic", () => {
        expect(evalExpression("n > 3", v)).toBe(true)
        expect(evalExpression("n + 1", v)).toBe(6)
        expect(evalExpression("n <= 5 && n >= 5", v)).toBe(true)
    })
    it("string concatenation with +", () => {
        expect(evalExpression('x + "bar"', v)).toBe("foobar")
    })
    it("boolean logic, negation, parens", () => {
        expect(evalExpression("!(n > 10)", v)).toBe(true)
        expect(evalExpression('x == "foo" || n > 99', v)).toBe(true)
    })
    it("never executes code — malicious input returns a falsy fallback", () => {
        expect(evalExpression("constructor.constructor('return 1')()", v)).toBe("")
        expect(evalExpression("process.exit(1)", v)).toBe("")
        expect(evalExpression("1;drop table", v)).toBe("")
    })
})

describe("resolveActiveVars", () => {
    it("dedupes by name (same-name reuse)", () => {
        const toks = tokenize("{{name::text}} ... {{name::text}}")
        expect(resolveActiveVars(toks, {}).map(v => v.name)).toEqual(["name"])
    })
    it("picks the branch dictated by current values", () => {
        const toks = tokenize('{{if role == "dev" {lang::list-js; ts};else {tool::text}}}')
        expect(resolveActiveVars(toks, { role: "dev" }).map(v => v.name)).toEqual(["lang"])
        expect(resolveActiveVars(toks, { role: "pm" }).map(v => v.name)).toEqual(["tool"])
    })
})

describe("resolveText", () => {
    it("legacy round-trip is unchanged", () => {
        expect(resolveText("Hello {{name}}!", { name: "World" })).toBe("Hello World!")
    })
    it("substitutes typed variables", () => {
        const text = "{{greeting::text}} {{n::number-2}}"
        expect(resolveText(text, { greeting: "Hi", n: "9" })).toBe("Hi 9")
    })
    it("applies a number default when empty", () => {
        expect(resolveText("{{n::number-42}}", {})).toBe("42")
    })
    it("resolves an expression default", () => {
        expect(resolveText("{{total::number-3+base}}", { base: "4" })).toBe("7")
    })
    it("renders the chosen conditional branch", () => {
        const text = 'Use {{if lvl > 5 {pro::text};else {basic::text}}} mode'
        expect(resolveText(text, { lvl: "9", pro: "expert" })).toBe("Use expert mode")
        expect(resolveText(text, { lvl: "1", basic: "simple" })).toBe("Use simple mode")
    })
    it("empty else branch resolves to nothing", () => {
        expect(resolveText("A{{if flag {x::text}}}B", { flag: "" })).toBe("AB")
    })
})

describe("hasVariables", () => {
    it("true for prompts with tokens, false otherwise", () => {
        expect(hasVariables("no vars here")).toBe(false)
        expect(hasVariables("{{name}}")).toBe(true)
        expect(hasVariables("{{if x {a::text}}}")).toBe(true)
    })
})

describe("buildConditionExpr / parseSimpleCondition", () => {
    it("quotes string values and leaves numbers/booleans bare", () => {
        expect(buildConditionExpr({ variable: "role", operator: "==", value: "dev" })).toBe(
            'role == "dev"',
        )
        expect(buildConditionExpr({ variable: "n", operator: ">", value: "2" })).toBe("n > 2")
        expect(buildConditionExpr({ variable: "flag", operator: "==", value: "true" })).toBe(
            "flag == true",
        )
    })
    it("escapes embedded quotes and backslashes", () => {
        expect(buildConditionExpr({ variable: "x", operator: "==", value: 'a"b' })).toBe(
            'x == "a\\"b"',
        )
    })
    it("emits a bare variable for the truthy (has-any-value) case", () => {
        expect(buildConditionExpr({ variable: "role", operator: "", value: "" })).toBe("role")
    })
    it("round-trips string and numeric comparisons", () => {
        for (const c of [
            { variable: "role", operator: "==" as const, value: "dev" },
            { variable: "count", operator: ">=" as const, value: "5" },
            { variable: "role", operator: "" as const, value: "" },
        ]) {
            expect(parseSimpleCondition(buildConditionExpr(c))).toEqual(c)
        }
    })
    it("parses the truthy shape", () => {
        expect(parseSimpleCondition("role")).toEqual({ variable: "role", operator: "", value: "" })
    })
    it("returns null for expressions the structured builder can't express", () => {
        expect(parseSimpleCondition('a > 2 && b == "x"')).toBeNull()
        expect(parseSimpleCondition("a == b")).toBeNull() // rhs is a variable, not a literal
        expect(parseSimpleCondition("(a)")).toBeNull()
        expect(parseSimpleCondition("true")).toBeNull()
        expect(parseSimpleCondition("")).toBeNull()
    })
})
