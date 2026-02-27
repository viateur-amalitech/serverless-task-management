provider "aws" {
  region = var.aws_region
}

# Variables are now managed in variables.tf

# --- Cognito Module ---
module "cognito" {
  source                  = "./modules/cognito"
  project_name            = var.project_name
  pre_signup_lambda_arn   = module.pre_signup_lambda.arn
  post_confirm_lambda_arn = module.post_confirmation_lambda.arn
}

# --- DynamoDB Module ---
module "dynamodb" {
  source       = "./modules/dynamodb"
  project_name = var.project_name
}

# --- SES Module ---
module "ses" {
  source       = "./modules/ses"
  project_name = var.project_name
  sender_email = var.sender_email
  admin_email  = var.admin_email
}

# --- SNS Module ---
module "sns" {
  source       = "./modules/sns"
  project_name = var.project_name
  alarm_email  = var.admin_email
}

# --- Lambda Functions ---

module "pre_signup_lambda" {
  source        = "./modules/lambda"
  project_name  = var.project_name
  function_name = "pre-signup"
  filename      = "../backend/dist/pre_signup.zip"
  handler       = "handlers/pre_signup.handler"
  environment_variables = {
    ALLOWED_DOMAINS = join(",", var.allowed_email_domains)
    # Set TABLE_NAME to satisfy shared config validation in backend
    TABLE_NAME = module.dynamodb.table_name
  }
}

# Permission for Cognito to invoke PreSignUp Lambda
resource "aws_lambda_permission" "allow_cognito" {
  statement_id  = "AllowExecutionFromCognito"
  action        = "lambda:InvokeFunction"
  function_name = module.pre_signup_lambda.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = module.cognito.arn
}

module "post_confirmation_lambda" {
  source        = "./modules/lambda"
  project_name  = var.project_name
  function_name = "post-confirmation"
  filename      = "../backend/dist/post_confirmation.zip"
  handler       = "handlers/post_confirmation.handler"
  environment_variables = {
    PROJECT_NAME      = var.project_name
    USERS_TABLE       = module.dynamodb.users_table_name
    MEMBER_GROUP_NAME = var.member_group_name
  }
}

resource "aws_lambda_permission" "allow_cognito_post_confirm" {
  statement_id  = "AllowPostConfirmExecutionFromCognito"
  action        = "lambda:InvokeFunction"
  function_name = module.post_confirmation_lambda.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = module.cognito.arn
}

resource "aws_iam_role_policy" "post_confirm_policy" {
  name = "post-confirm-policy"
  role = module.post_confirmation_lambda.role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Effect   = "Allow"
        Resource = [module.dynamodb.users_table_arn, "${module.dynamodb.users_table_arn}/index/*"]
      },
      {
        Action = [
          "cognito-idp:AdminAddUserToGroup"
        ]
        Effect   = "Allow"
        Resource = module.cognito.arn
      }
    ]
  })
}

module "task_handler_lambda" {
  source        = "./modules/lambda"
  project_name  = var.project_name
  function_name = "task-handler"
  filename      = "../backend/dist/task_handler.zip"
  handler       = "handlers/task_handler.handler"
  environment_variables = {
    TABLE_NAME        = module.dynamodb.table_name
    AUDIT_TABLE       = module.dynamodb.audit_table_name
    USER_POOL_ID      = module.cognito.user_pool_id
    ALLOWED_DOMAINS   = join(",", var.allowed_email_domains)
    PROJECT_NAME      = var.project_name
    ADMIN_GROUP_NAME  = var.admin_group_name
    MEMBER_GROUP_NAME = var.member_group_name
  }
}

# IAM Policy for Task Handler to access DynamoDB
resource "aws_iam_role_policy" "task_handler_dynamo" {
  name = "task-handler-dynamo-policy"
  role = module.task_handler_lambda.role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect = "Allow"
        Resource = [
          module.dynamodb.table_arn,
          "${module.dynamodb.table_arn}/index/*",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${module.dynamodb.audit_table_name}"
        ]
      },
      {
        Action = [
          "cognito-idp:ListUsers",
          "cognito-idp:AdminGetUser"
        ]
        Effect   = "Allow"
        Resource = module.cognito.arn
      }
    ]
  })
}

# --- API Gateway ---


module "apigateway" {
  source          = "./modules/apigateway"
  project_name    = var.project_name
  user_pool_id    = module.cognito.user_pool_id
  client_id       = module.cognito.client_id
  region          = var.aws_region
  allowed_origins = var.frontend_allowed_origins
}

# --- HTTP API Integration ---

resource "aws_apigatewayv2_integration" "task_handler" {
  api_id                 = module.apigateway.api_id
  integration_type       = "AWS_PROXY"
  integration_uri        = module.task_handler_lambda.invoke_arn
  payload_format_version = "2.0"
}

# --- Routes ---

resource "aws_apigatewayv2_route" "tasks_get" {
  api_id    = module.apigateway.api_id
  route_key = "GET /tasks"
  target    = "integrations/${aws_apigatewayv2_integration.task_handler.id}"

  authorization_type = "JWT"
  authorizer_id      = module.apigateway.authorizer_id
}

resource "aws_apigatewayv2_route" "tasks_post" {
  api_id    = module.apigateway.api_id
  route_key = "POST /tasks"
  target    = "integrations/${aws_apigatewayv2_integration.task_handler.id}"

  authorization_type = "JWT"
  authorizer_id      = module.apigateway.authorizer_id
}

resource "aws_apigatewayv2_route" "tasks_put" {
  api_id    = module.apigateway.api_id
  route_key = "PUT /tasks/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.task_handler.id}"

  authorization_type = "JWT"
  authorizer_id      = module.apigateway.authorizer_id
}

resource "aws_apigatewayv2_route" "tasks_delete" {
  api_id    = module.apigateway.api_id
  route_key = "DELETE /tasks/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.task_handler.id}"

  authorization_type = "JWT"
  authorizer_id      = module.apigateway.authorizer_id
}

resource "aws_apigatewayv2_route" "users_get" {
  api_id    = module.apigateway.api_id
  route_key = "GET /users"
  target    = "integrations/${aws_apigatewayv2_integration.task_handler.id}"

  authorization_type = "JWT"
  authorizer_id      = module.apigateway.authorizer_id
}

# Lambda Permission for HTTP API
resource "aws_lambda_permission" "apigw_lambda" {
  statement_id  = "AllowExecutionFromHTTPAPI"
  action        = "lambda:InvokeFunction"
  function_name = module.task_handler_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.apigateway.execution_arn}/*/*"
}

data "aws_caller_identity" "current" {}

# --- Notification Lambda ---

module "notification_lambda" {
  source        = "./modules/lambda"
  project_name  = var.project_name
  function_name = "notification-handler"
  filename      = "../backend/dist/notification_handler.zip"
  handler       = "handlers/notification_handler.handler"
  environment_variables = {
    SENDER_EMAIL = var.sender_email
    ADMIN_EMAIL  = var.admin_email
    PROJECT_NAME = var.project_name
  }
}

# IAM Policy for Notification Lambda to access SES and DynamoDB Streams
resource "aws_iam_role_policy" "notification_lambda_policy" {
  name = "notification-lambda-policy"
  role = module.notification_lambda.role_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Effect   = "Allow"
        Resource = module.ses.sender_arn
      },
      {
        Action = [
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:DescribeStream",
          "dynamodb:ListStreams"
        ]
        Effect   = "Allow"
        Resource = module.dynamodb.stream_arn
      }
    ]
  })
}

# Event Source Mapping: DynamoDB Stream -> Notification Lambda
resource "aws_lambda_event_source_mapping" "task_updates" {
  event_source_arn  = module.dynamodb.stream_arn
  function_name     = module.notification_lambda.function_name
  starting_position = "LATEST"
}

# --- Monitoring ---
module "monitoring" {
  source       = "./modules/monitoring"
  project_name = var.project_name
  lambda_function_names = [
    module.pre_signup_lambda.function_name,
    module.post_confirmation_lambda.function_name,
    module.task_handler_lambda.function_name,
    module.notification_lambda.function_name
  ]
  sns_topic_arn = module.sns.topic_arn
}

