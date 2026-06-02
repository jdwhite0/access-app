/**
 * JD AI Systems — platform health & resilience (cross-product).
 *
 * Consumed by ACCESS OS, JYSON, Build, Vault tooling, and future products.
 * No UI in this module — diagnostics, classification, and audience-safe messages only.
 */

export * from './status-types'
export * from './product-registry'
export * from './provider-registry'
export * from './status-message'
export * from './health-event'
export * from './health-snapshot'
export * from './error-classifier'

export { classifyError, classifyErrorFromUnknown } from './error-classifier'
export { buildHealthSnapshot } from './health-snapshot'
export { createHealthEvent } from './health-event'
export { buildAudienceMessages, sanitizeForAudience } from './status-message'
export { PRODUCT_REGISTRY, getProduct, listProducts } from './product-registry'
export { PROVIDER_REGISTRY, getProvider } from './provider-registry'
