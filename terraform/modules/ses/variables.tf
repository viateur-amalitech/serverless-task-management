variable "project_name" {
  type        = string
  description = "Project name for resource naming"
}

variable "sender_email" {
  type        = string
  description = "Email address to verify for sending notifications"
}

variable "admin_email" {
  type        = string
  description = "Admin email address to verify"
}
