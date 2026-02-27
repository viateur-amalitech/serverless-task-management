variable "project_name" {
  type = string
}

variable "user_pool_id" {
  type = string
}

variable "client_id" {
  type = string
}

variable "region" {
  type = string
}

# Configurable CORS allowed origins for the HTTP API
# Example values (set from root module):
# ["http://localhost:5173", "https://yourapp.amplifyapp.com"]
variable "allowed_origins" {
  type        = list(string)
  description = "List of allowed origins for CORS on the HTTP API"
  default     = ["*"]
}
