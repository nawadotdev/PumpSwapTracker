export const logParser = (logs: string[]) => {
  var currentProgramLogs = [];
  var programLogs = [];
  var count = 0;
  for (var i = 0; i < logs.length; i++) {
    currentProgramLogs.push(logs[i]);
    const logParts = logs[i].split(" ");
    const isInvoke = logParts[2] == "invoke" && logParts[0] == "Program";
    const isSuccess = logParts[2] == "success" && logParts[0] == "Program";
    if (!isInvoke && !isSuccess) continue;
    const programId = logParts[1];
    if (isInvoke) count++;
    if (isSuccess) count--;
    if (isSuccess && count == 0) {
      programLogs.push({
        programId,
        logs: currentProgramLogs,
      });
      currentProgramLogs = [];
    }
  }

  return programLogs;
};
