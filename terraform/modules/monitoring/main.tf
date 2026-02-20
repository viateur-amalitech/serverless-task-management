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

  dimensions = {
    FunctionName = each.value
  }
}

output "alarm_arns" {
  value       = [for a in aws_cloudwatch_metric_alarm.lambda_errors : a.arn]
  description = "ARNs of all CloudWatch alarms"
}
