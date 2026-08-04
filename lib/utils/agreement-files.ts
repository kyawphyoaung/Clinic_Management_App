export interface ParsedAgreementFile {
  documentType: string;
  version: string;
  fileName: string;
}

/** Parse `/agreements/privacy_policy_v1.md` → documentType + version */
export function parseAgreementFilePath(path: string): ParsedAgreementFile {
  const fileName = path.split("/").pop() ?? path;
  const baseName = fileName.replace(/\.md$/i, "");
  const match = baseName.match(/^(.+)_v(\d+)$/);

  if (!match) {
    return {
      documentType: baseName,
      version: "v1",
      fileName,
    };
  }

  return {
    documentType: match[1],
    version: `v${match[2]}`,
    fileName,
  };
}

export function agreementDisplayTitle(documentType: string): string {
  return documentType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
