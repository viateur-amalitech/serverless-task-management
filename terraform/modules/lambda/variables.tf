variable "project_name" {
  type = string
}

variable "function_name" {
  type = string
}

variable "handler" {
  type    = string
  default = "index.handler"
}

variable "filename" {
  type = string
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}
