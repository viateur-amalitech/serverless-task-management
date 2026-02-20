resource "aws_iam_role" "lambda_exec" {
  name = "${var.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "func" {
  filename      = var.filename
  function_name = "${var.project_name}-${var.function_name}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = var.handler
  runtime       = "nodejs18.x"

  environment {
    variables = var.environment_variables
  }

  source_code_hash = filebase64sha256(var.filename)
}

resource "aws_cloudwatch_log_group" "logs" {
  name              = "/aws/lambda/${aws_lambda_function.func.function_name}"
  retention_in_days = 7
}

