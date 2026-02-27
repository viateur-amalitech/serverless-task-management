output "topic_arn" {
  value       = aws_sns_topic.alerts.arn
  description = "ARN of the SNS alerts topic"
}

output "topic_name" {
  value       = aws_sns_topic.alerts.name
  description = "Name of the SNS alerts topic"
}
