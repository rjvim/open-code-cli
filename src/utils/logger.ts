import { cyan, green, red, yellow } from "kleur/colors";
import ora, { Ora } from "ora";

// Color helpers for consistent styling
export const highlighter = {
  error: red,
  warn: yellow,
  info: cyan,
  success: green,
};

// Logger for consistent output
export const logger = {
  error(...args: unknown[]) {
    console.log(highlighter.error(args.join(" ")));
  },
  warn(...args: unknown[]) {
    console.log(highlighter.warn(args.join(" ")));
  },
  info(...args: unknown[]) {
    console.log(highlighter.info(args.join(" ")));
  },
  success(...args: unknown[]) {
    console.log(highlighter.success(args.join(" ")));
  },
  log(...args: unknown[]) {
    console.log(args.join(" "));
  },
  break() {
    console.log("");
  },
};

// Spinner for async operations
export function spinner(
  text: string,
  options?: {
    silent?: boolean;
  }
): Ora {
  return ora({
    text,
    isSilent: options?.silent,
  });
}

// Error handler
export function handleError(error: unknown): void {
  logger.error(
    "Something went wrong. Please check the error below for more details."
  );

  if (typeof error === "string") {
    logger.error(error);
  } else if (error instanceof Error) {
    logger.error(error.message);

    if (error.stack) {
      logger.log(error.stack);
    }
  } else {
    logger.error("An unknown error occurred");
  }

  logger.break();
  process.exit(1);
}
