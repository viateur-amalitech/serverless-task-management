output "api_url" {
  value = module.apigateway.api_endpoint
}

output "user_pool_id" {
  value = module.cognito.user_pool_id
}

output "user_pool_client_id" {
  value = module.cognito.client_id
}

output "aws_region" {
  value = var.aws_region
}

# Helpful for configuring frontend role checks (optional)
output "admin_group_name" {
  value = var.admin_group_name
}

output "member_group_name" {
  value = var.member_group_name
}
