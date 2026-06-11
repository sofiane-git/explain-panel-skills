/**
 * Migrator template. Copy to v<old>-to-v<new>.ts and adapt.
 *
 * Usage (no shebang — invoke via npx tsx for portability across BSD/GNU envs):
 *   npx tsx migrate/v<old>-to-v<new>.ts <input-path> [--stdout]
 *
 * Convention:
 *   - Read input, validate against the old schema (fail fast if invalid).
 *   - Transform.
 *   - Set schemaVersion to the new value.
 *   - Validate against the new schema.
 *   - Write back to the input path, unless --stdout is given.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OLD_VERSION = "<old>";
const NEW_VERSION = "<new>";

type OldMap = Record<string, unknown>; // replace with the actual old type
type NewMap = Record<string, unknown>; // replace with the actual new type

function migrate(input: OldMap): NewMap {
  // Implement transformation here.
  const output = structuredClone(input) as NewMap;
  output.schemaVersion = NEW_VERSION;
  return output;
}

function main() {
  const [, , inputPath, ...flags] = process.argv;
  if (!inputPath) {
    console.error(`Usage: ${process.argv[1]} <input-path> [--stdout]`);
    process.exit(1);
  }

  const raw = readFileSync(resolve(inputPath), "utf8");
  const parsed = JSON.parse(raw) as OldMap;

  if (parsed.schemaVersion !== OLD_VERSION) {
    console.error(
      `Expected schemaVersion="${OLD_VERSION}", got "${parsed.schemaVersion}". Aborting.`,
    );
    process.exit(2);
  }

  const next = migrate(parsed);
  const serialized = JSON.stringify(next, null, 2) + "\n";

  if (flags.includes("--stdout")) {
    process.stdout.write(serialized);
  } else {
    writeFileSync(resolve(inputPath), serialized, "utf8");
    console.error(`✅ Migrated ${inputPath} to schemaVersion=${NEW_VERSION}`);
  }
}

main();
