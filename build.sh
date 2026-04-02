#!/usr/bin/env bash
# Build a multi-arch container image (linux/amd64 + linux/arm64) using podman.
#
# Usage:
#   IMAGE_REPO=quay.io/yourorg/quarkus-pipelines-app ./build.sh
#   IMAGE_REPO=quay.io/yourorg/quarkus-pipelines-app IMAGE_TAG=1.0.0 ./build.sh
#
# Prerequisites:
#   - podman 4.x+
#   - QEMU/binfmt_misc for cross-arch builds (on Linux: sudo dnf install qemu-user-static)
#   - Logged in to your registry: podman login quay.io
set -euo pipefail

IMAGE_REPO="${IMAGE_REPO:-quay.io/yourorg/quarkus-pipelines-app}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
FULL_IMAGE="${IMAGE_REPO}:${IMAGE_TAG}"

echo "==> Building Quarkus uber-jar..."
./mvnw package -DskipTests

echo "==> Creating multi-arch manifest: ${FULL_IMAGE}"
# Remove existing manifest if it already exists locally
podman manifest rm "${FULL_IMAGE}" 2>/dev/null || true
podman manifest create "${FULL_IMAGE}"

echo "==> Building linux/amd64..."
podman build \
  --platform linux/amd64 \
  --manifest "${FULL_IMAGE}" \
  .

echo "==> Building linux/arm64..."
podman build \
  --platform linux/arm64 \
  --manifest "${FULL_IMAGE}" \
  .

echo "==> Pushing manifest to registry..."
podman manifest push "${FULL_IMAGE}" "docker://${FULL_IMAGE}"

echo "==> Done: ${FULL_IMAGE}"
echo "    Inspect with: podman manifest inspect ${FULL_IMAGE}"
