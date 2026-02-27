resource "aws_dynamodb_table" "tasks" {
  name         = "${var.project_name}-tasks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "taskId"

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "taskId"
    type = "S"
  }

  attribute {
    name = "assignedTo"
    type = "S"
  }

  global_secondary_index {
    name            = "AssignedToIndex"
    hash_key        = "assignedTo"
    projection_type = "ALL"
  }

  tags = {
    Project = var.project_name
  }
}

resource "aws_dynamodb_table" "users" {
  name         = "${var.project_name}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }

  tags = {
    Project = var.project_name
  }
}

resource "aws_dynamodb_table" "audit" {
  name         = "${var.project_name}-audit"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "auditId"

  attribute {
    name = "auditId"
    type = "S"
  }

  tags = {
    Project = var.project_name
  }
}

