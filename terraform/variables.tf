variable "aws_region" {
  type        = string
  description = "AWS region for deployment"
}

variable "project_name" {
  type        = string
  description = "Project name used for resource naming"
}

variable "allowed_email_domains" {
  type        = list(string)
  description = "List of allowed email domains for user registration"
}

variable "sender_email" {
  type        = string
  description = "Email address for sending notifications (must be verified in SES)"
}

variable "admin_email" {
  type        = string
  description = "Admin email address for notifications"
}

variable "admin_group_name" {
  type        = string
  description = "Name of the admin user group in Cognito"
}

variable "member_group_name" {
  type        = string
  description = "Name of the member user group in Cognito"
}

# List of allowed origins for the frontend to call the API (CORS)
# Example:
#   frontend_allowed_origins = [
#     "http://localhost:5173",
#     "https://yourapp.amplifyapp.com"
#   ]
variable "frontend_allowed_origins" {
  type        = list(string)
  description = "CORS allowed origins for API Gateway HTTP API"
  default     = ["http://localhost:5173"]
}
