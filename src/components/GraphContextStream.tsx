/**
 * Shim file for backward compatibility with tests and legacy imports.
 * Re-exports the actual ContextStream component from layout/.
 * Also re-exports the extended ContextStreamProps type that accepts legacy props.
 */
export * from "@/components/layout/ContextStream";
export { default } from "@/components/ContextStream";
export type { ContextStreamProps, ContextPosition } from "@/components/ContextStream";
