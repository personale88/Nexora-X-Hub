export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class AIResponseValidator {
  /**
   * Validate that an affected file exists within the repository's known file list.
   */
  public static validateAffectedFile(
    filePath: string,
    repositoryFiles: string[]
  ): ValidationResult {
    const errors: string[] = [];
    if (!filePath || typeof filePath !== 'string') {
      errors.push('Affected file path is missing or invalid.');
      return { valid: false, errors };
    }

    const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const fileExists = repositoryFiles.some(
      (f) => f.replace(/\\/g, '/').replace(/^\/+/, '') === normalizedPath
    );

    if (!fileExists) {
      errors.push(
        `AI hallucinated file path "${filePath}". File does not exist in repository files tree.`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate that patch diff or before/after code is valid and non-empty.
   */
  public static validatePatch(patch: {
    file: string;
    beforeCode: string;
    afterCode: string;
    unifiedDiff?: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (!patch.file) {
      errors.push('Patch target file is unspecified.');
    }
    if (!patch.afterCode || patch.afterCode.trim().length === 0) {
      errors.push('Patch afterCode is empty.');
    }
    if (patch.beforeCode === patch.afterCode) {
      errors.push('Patch makes zero code changes (beforeCode equals afterCode).');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
