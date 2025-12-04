# Deployment and Secrets Reference

Use this guide to provision environment variables, Docker assets, and GitHub Actions secrets for staging and production deployments.

## Environment files
Two example files describe the variables the application expects:

- `.env.staging.example` for staging deployments
- `.env.production.example` for production deployments

Copy the appropriate template to `.env.staging` or `.env.production`, then replace the placeholder values before deploying.

### Required variables
- `NODE_ENV` and `PORT`: runtime metadata for the NestJS server.
- `DATABASE_URL`: Prisma/PostgreSQL connection string used by the application and migration steps.
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`: credentials applied to the PostgreSQL container in `docker-compose`.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: secrets for signing access and refresh tokens.
- `JWT_ACCESS_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN`: token durations (e.g., `15m`, `7d`).

## Docker assets
- `Dockerfile` builds a multi-stage image with compiled NestJS artifacts and Prisma client assets.
- `docker-compose.staging.yml` runs the application alongside PostgreSQL using `.env.staging`.
- `docker-compose.production.yml` mirrors staging but targets `.env.production` and the production image tag.

## GitHub Actions secrets
Populate the following repository or environment secrets before enabling the workflows:

### Shared
- `REGISTRY_USERNAME` / `REGISTRY_PASSWORD`: credentials for authenticating to the container registry.
- `REGISTRY_URL`: hostname of the registry (e.g., `registry.example.com`).
- `IMAGE_NAME`: repository/name used for the built image (e.g., `shop-backend`).

### Staging (used in `develop` workflow)
- `STAGING_DATABASE_URL`: connection string for `prisma migrate deploy`.
- `STAGING_DEPLOY_HOST`: SSH hostname or IP of the staging server.
- `STAGING_DEPLOY_USER`: SSH username.
- `STAGING_SSH_KEY`: private key for SSH access.
- `STAGING_ENV_FILE`: path to the `.env.staging` file on the remote host.
- `STAGING_DOCKER_COMPOSE`: path to `docker-compose.staging.yml` on the remote host.

### Production (used in `main` workflow)
- `PRODUCTION_DATABASE_URL`: connection string for `prisma migrate deploy`.
- `PRODUCTION_DEPLOY_HOST`: SSH hostname or IP of the production server.
- `PRODUCTION_DEPLOY_USER`: SSH username.
- `PRODUCTION_SSH_KEY`: private key for SSH access.
- `PRODUCTION_ENV_FILE`: path to the `.env.production` file on the remote host.
- `PRODUCTION_DOCKER_COMPOSE`: path to `docker-compose.production.yml` on the remote host.

### Optional
- `SSH_KNOWN_HOSTS`: precomputed known-hosts entries to avoid interactive prompts.

## Deployment flow
1. On push to `develop`, the staging workflow builds/tests the app, applies migrations to `STAGING_DATABASE_URL`, pushes an image tagged with the commit SHA to `${REGISTRY_URL}/${IMAGE_NAME}:staging-${{ github.sha }}`, and remotely deploys the stack using the staging compose file.
2. On push to `main`, the production workflow repeats the process using production secrets and tags images as `${REGISTRY_URL}/${IMAGE_NAME}:prod-${{ github.sha }}` plus `:latest`.
3. Servers should already contain the corresponding `.env` file and compose file paths referenced in the secrets above; the deploy step pulls the new image and restarts the stack via `docker compose`.
