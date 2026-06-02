import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type {
  FounderBlueprintSpec,
  FounderBlueprintValidationResult,
} from '@/types/founder-blueprint'

const SCHEMA_PATH = join(process.cwd(), 'schemas', 'blueprint.schema.mvp.json')

let validateFn: ReturnType<Ajv['compile']> | null = null

async function getValidator() {
  if (validateFn) return validateFn
  const raw = await readFile(SCHEMA_PATH, 'utf8')
  const schema = JSON.parse(raw) as object
  const ajv = new Ajv({ allErrors: true, strict: false })
  addFormats(ajv)
  validateFn = ajv.compile(schema)
  return validateFn
}

export async function validateFounderBlueprint(
  spec: FounderBlueprintSpec
): Promise<FounderBlueprintValidationResult> {
  const validate = await getValidator()
  const valid = validate(spec)
  if (valid) return { valid: true, errors: [] }

  const errors = (validate.errors ?? []).map((err) => {
    const path = err.instancePath || '/'
    return `${path} ${err.message ?? 'invalid'}`.trim()
  })
  return { valid: false, errors }
}

export function parseFounderBlueprintAnswers(raw: unknown): FounderBlueprintSpec | null {
  if (!raw || typeof raw !== 'object') return null
  return raw as FounderBlueprintSpec
}
