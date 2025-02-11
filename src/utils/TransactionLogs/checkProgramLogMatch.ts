import { Programs } from "../../lib";

export const checkProgramLogMatch = (log: string) => {
  for (const program of Programs) {
    if (program.logMatch(log)) return program;
  }
  return false;
};
