variable "project_name" {
  type = string
}

variable "lambda_function_names" {
  type = list(string)
}

variable "sns_topic_arn" {
  type        = string
  description = "ARN of the SNS topic for alarm notifications"
}

variable "lambda_duration_threshold_ms" {
  type        = number
  description = "Duration threshold in milliseconds for Lambda duration alarms"
  default     = 5000
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each            = toset(var.lambda_function_names)
  alarm_name          = "${var.project_name}-${each.value}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alarm when the ${each.value} lambda function fails"
  alarm_actions       = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.value
  }
}

# Lambda Throttles alarm (any throttle event)
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each            = toset(var.lambda_function_names)
  alarm_name          = "${var.project_name}-${each.value}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Alarm when the ${each.value} lambda function is throttled"
  alarm_actions       = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.value
  }
}

# Lambda Duration alarm (average duration breaching threshold)
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each            = toset(var.lambda_function_names)
  alarm_name          = "${var.project_name}-${each.value}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = var.lambda_duration_threshold_ms
  alarm_description   = "Alarm when the ${each.value} average duration (ms) exceeds threshold"
  alarm_actions       = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.value
  }
}

output "alarm_arns" {
  value       = [for a in aws_cloudwatch_metric_alarm.lambda_errors : a.arn]
  description = "ARNs of all CloudWatch alarms"
}
