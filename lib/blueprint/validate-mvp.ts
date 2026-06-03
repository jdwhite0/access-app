import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type {
  FounderBlueprintSpec,
  FounderBlueprintValidationResult,
} from '@/types/founder-blueprint'
// Static import — bundler includes this in the serverless function.
// readFile(path) was used before and failed on Vercel (file not traced).
import schemaJson from '../../schemas/blueprint.schema.mvp.json'

let validateFn: ReturnType<Ajv['compile']> | null = null

function getValidator() {
  if (validateFn) return validateFn
  const ajv = new Ajv({ allErrors: true, strict: false })
  addFormats(ajv)
  validateFn = ajv.compile(schemaJson as object)
  return validateFn
}

export async function validateFounderBlueprint(
  spec: FounderBlueprintSpec
): Promise<FounderBlueprintValidationResult> {
  const validate = getValidator()
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
