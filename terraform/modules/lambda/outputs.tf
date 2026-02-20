output "arn" {
  value = aws_lambda_function.func.arn
}

output "function_name" {
  value = aws_lambda_function.func.function_name
}

output "invoke_arn" {
  value = aws_lambda_function.func.invoke_arn
}

output "role_name" {
  value = aws_iam_role.lambda_exec.name
}
