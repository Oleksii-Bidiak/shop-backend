# Versioning and Backward Compatibility Policy

## Principles
- The API follows semantic versioning for public endpoints (`MAJOR.MINOR.PATCH`).
- Changes that alter request/response contracts, authentication flows, or business rules are treated as **breaking** and require a new major version.
- Additive, backward-compatible improvements (new optional fields, endpoints, or headers) are released as minor versions.
- Patch versions are reserved for bug fixes, security updates, and internal-only changes.

## Breaking Changes
Breaking changes include (but are not limited to):
- Removing or renaming endpoints, parameters, response fields, or enum values.
- Changing response shapes, validation rules, pagination defaults, or error formats.
- Modifying authentication or authorization requirements for existing endpoints.
- Introducing rate limits or throttling where none existed before.
- Any change that requires client code to adapt before upgrading.

When a breaking change is unavoidable:
- A new major version path is introduced (e.g., `/api/v2/**`).
- The existing major version remains available through its announced support window.
- Deprecation notices are documented in release notes and API docs at least one minor version before removal.

## v1 Support Policy
- **Status:** Active and backward compatible. Changes are limited to additive improvements, non-breaking bug fixes, and security updates.
- **Guarantees:**
  - Request/response contracts remain stable.
  - Authentication and authorization requirements remain unchanged unless explicitly announced.
  - Deprecations are communicated via changelog and OpenAPI descriptions.
- **Maintenance Window:** v1 will be maintained until the public launch of v2 plus at least 6 months of overlap.

## v2 Roadmap
- **Goals:**
  - Streamlined filtering and sorting parameters for catalog endpoints.
  - Improved pagination metadata and consistent error envelope across modules.
  - Expanded observability (trace IDs in responses) and stricter input validation defaults.
- **Migration Plan:**
  - Alpha endpoints exposed under `/api/v2` for early adopters.
  - Dual-run period where v1 and v2 coexist; clients can opt in per-route.
  - Final v1 deprecation date announced after v2 reaches feature parity and stability.

## Version Discovery and Testing
- Default API version is `v1` via URI versioning (e.g., `/api/v1/products`).
- Automated contract and integration tests verify that v1 responses remain backward compatible for key endpoints.
- CI pipelines publish contract artifacts for downstream consumers and execute verification on every push.
