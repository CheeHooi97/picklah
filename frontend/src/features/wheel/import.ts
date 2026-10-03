export async function readChoiceFile(file: File): Promise<string[]> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Choose a file smaller than 5 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  let values: string[];
  if (extension === "txt") {
    values = (await file.text()).replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
  } else if (["csv", "xlsx", "xls"].includes(extension || "")) {
    const { read, utils } = await import("xlsx");
    const data = extension === "csv" ? await file.text() : await file.arrayBuffer();
    const workbook = read(data, { type: extension === "csv" ? "string" : "array", raw: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error("This file has no worksheet to import.");
    const rows = utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "", blankrows: false });
    values = rows.map((row) => String(row[0] ?? ""));
  } else {
    throw new Error("Choose a TXT, CSV, XLSX, or XLS file.");
  }
  const choices = values.map((value) => value.trim()).filter(Boolean);
  if (!choices.length) throw new Error("No choices found. Put choices on separate lines or in the first column.");
  if (choices.some((value) => value.length > 80)) throw new Error("Keep each choice within 80 characters, then try again.");
  return choices;
}
