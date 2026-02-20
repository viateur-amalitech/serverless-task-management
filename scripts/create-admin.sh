#!/bin/bash

set -euo pipefail

# Create Admin User Script
# Usage: bash scripts/create-admin.sh <email> <password> <name>
# Prerequisite: Infrastructure must be deployed via Terraform first.

EMAIL=$1
PASSWORD=$2
NAME=$3

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ] || [ -z "$NAME" ]; then
    echo "Usage: bash scripts/create-admin.sh <email> <password> <name>"
    exit 1
fi

# Locate repo directories relative to this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TF_DIR="$SCRIPT_DIR/../terraform"

# Fetch User Pool ID from Terraform
echo "Fetching User Pool ID from Terraform..."
USER_POOL_ID=$(cd "$TF_DIR" && terraform output -raw user_pool_id)

# Determine AWS region (default to eu-north-1 for this project)
REGION="$(aws configure get region || true)"
if [ -z "${REGION}" ]; then
  REGION="eu-north-1"
fi

if [ -z "$USER_POOL_ID" ]; then
    echo "Error: Could not retrieve User Pool ID. Ensure 'terraform apply' has been run."
    exit 1
fi

echo "Creating Admin User: $EMAIL in Pool: $USER_POOL_ID..."

# 1. Create User
aws cognito-idp admin-create-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$EMAIL" \
    --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true Name=name,Value="$NAME" \
    --message-action SUPPRESS \
    --region "$REGION"

# 2. Set Password
aws cognito-idp admin-set-user-password \
    --user-pool-id "$USER_POOL_ID" \
    --username "$EMAIL" \
    --password "$PASSWORD" \
    --permanent \
    --region "$REGION"

# 3. Add to Admin Group
aws cognito-idp admin-add-user-to-group \
    --user-pool-id "$USER_POOL_ID" \
    --username "$EMAIL" \
    --group-name "Admin" \
    --region "$REGION"

echo "Admin User Created Successfully!"
