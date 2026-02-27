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
