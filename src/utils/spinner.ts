import ora, { Ora, Options } from "ora";
import { CommandOptions } from "../types";

export function spinner(text: Options["text"], options?: CommandOptions): Ora {
  return ora({
    text,
    isSilent: options?.silent,
  });
}
