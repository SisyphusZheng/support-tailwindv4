import { parseArgs } from "@std/cli/parse-args";
import * as path from "@std/path";
import { ensureMinDenoVersion, error } from "./utils.ts";
import { updateProject } from "./update.ts";
import * as colors from "@std/fmt/colors";

const MIN_DENO_VERSION = "1.43.1";

const HELP = `@fresh/update

Update a Fresh project. This updates dependencies and optionally performs code
mods to update a project's source code to the latest recommended patterns.

To upgrade a project in the current directory, run:
  deno run -A jsr:@fresh/update .

USAGE:
    @fresh/update [DIRECTORY]
`;

ensureMinDenoVersion(MIN_DENO_VERSION);

const flags = parseArgs(Deno.args, {
  boolean: ["help"],
  alias: { h: "help" },
});

// Handle help flag
if (flags.help) {
  // deno-lint-ignore no-console
  console.log(HELP);
  Deno.exit(0);
}

// deno-lint-ignore no-console
console.log(
  colors.bgRgb8(colors.rgb8(" 🍋 Fresh Updater ", 0), 121),
);
// deno-lint-ignore no-console
console.log();
// deno-lint-ignore no-console
console.log(
  colors.yellow(
    "Important: This tool helps with common upgrade tasks. Breaking changes or complex projects may require additional manual updates.",
  ),
);
// deno-lint-ignore no-console
console.log(
  colors.italic(
    "Note: Breaking changes may require additional manual updates.",
  ),
);
// deno-lint-ignore no-console
console.log();

const CWD = Deno.cwd();
let dir = CWD;

// Interactive directory prompt if no arguments provided
if (flags._.length === 0) {
  // deno-lint-ignore no-console
  console.log(colors.cyan("Where is the project directory?"));
  // deno-lint-ignore no-console
  console.log(
    colors.gray("(Press Enter to use current directory, or type a path)"),
  );
  // deno-lint-ignore no-console
  console.log();

  const prompt = colors.bold("Directory: ");
  Deno.stdout.writeSync(new TextEncoder().encode(prompt));

  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  const input = new TextDecoder().decode(buf.subarray(0, n || 0)).trim();

  if (input && input.length > 0) {
    dir = path.resolve(CWD, input);
  }
  // deno-lint-ignore no-console
  console.log();
} else {
  const targetDir = flags._[0] as string;
  if (typeof targetDir !== "string" || targetDir.trim() === "") {
    error("Invalid or empty directory specified.");
    Deno.exit(1);
  }
  dir = path.resolve(CWD, targetDir);
}

// Validate directory exists and is accessible
try {
  const stat = await Deno.stat(dir);
  if (!stat.isDirectory) {
    error(`Target path is not a directory: ${dir}`);
    Deno.exit(1);
  }
} catch (e) {
  if (e instanceof Deno.errors.NotFound) {
    error(`Directory not found: ${dir}`);
    Deno.exit(1);
  }
  // deno-lint-ignore no-console
  console.error(
    colors.red(
      `Error accessing directory ${dir}: ${(e as Error).message || e}`,
    ),
  );
  Deno.exit(1);
}

// deno-lint-ignore no-console
console.log(
  colors.bold(`🚀 Starting Fresh project update in: ${colors.cyan(dir)}`),
);
// deno-lint-ignore no-console
console.log("   This may take a few moments...");
// deno-lint-ignore no-console
console.log();

try {
  const result = await updateProject(dir);

  // deno-lint-ignore no-console
  console.log(
    colors.green(colors.bold("\n🎉 Project update process finished!")),
  );

  // Summary of changes
  // deno-lint-ignore no-console
  console.log(colors.bold("\n📊 Summary:"));
  // deno-lint-ignore no-console
  console.log(
    `  • Configuration: ${
      result.configUpdated
        ? colors.green("Updated")
        : colors.gray("No changes needed")
    }`,
  );
  // deno-lint-ignore no-console
  console.log(
    `  • Files processed: ${colors.cyan(result.filesProcessed.toString())}`,
  );
  // deno-lint-ignore no-console
  console.log(
    `  • Files modified: ${colors.green(result.filesModified.toString())}`,
  );
  if (result.errors > 0) {
    // deno-lint-ignore no-console
    console.log(
      `  • Errors encountered: ${colors.red(result.errors.toString())}`,
    );
  }

  // deno-lint-ignore no-console
  console.log("\nNext Steps:");
  // deno-lint-ignore no-console
  console.log(
    `  1. ${
      colors.bold("Review the changes")
    } made to your project files carefully.`,
  );
  // deno-lint-ignore no-console
  console.log(
    `  2. Run ${
      colors.bold(colors.cyan("deno task check"))
    } (or your project's equivalent check script) to identify any type errors or linting issues.`,
  );
  // deno-lint-ignore no-console
  console.log(
    `  3. Test your application thoroughly to ensure everything works as expected.`,
  );
  // deno-lint-ignore no-console
  console.log(
    `  4. Consult the ${
      colors.underline(colors.blue("Fresh 2.x migration guide"))
    } for details on conceptual changes (e.g., routing, islands, 'fresh.gen.ts' removal, and other breaking changes).`,
  );
  // deno-lint-ignore no-console
  console.log(
    colors.italic(
      "\nIf you encounter issues, please report them to the Fresh GitHub repository.",
    ),
  );
} catch (err) {
  // deno-lint-ignore no-console
  console.error(colors.red("\n❌ Update failed during project processing:"));
  // The error function from utils.ts handles styling and exit.
  // If err is already styled or a simple message, error() will still work.
  error((err as Error).message || "An unknown error occurred.");
}
