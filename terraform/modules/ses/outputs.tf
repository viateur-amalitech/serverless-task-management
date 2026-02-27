output "sender_email" {
  value       = aws_ses_email_identity.sender.email
  description = "Verified sender email address"
}

output "admin_email" {
  value       = aws_ses_email_identity.admin.email
  description = "Verified admin email address"
}

output "configuration_set_name" {
  value       = aws_ses_configuration_set.main.name
  description = "SES configuration set name"
}

output "sender_arn" {
  value       = aws_ses_email_identity.sender.arn
  description = "ARN of the sender email identity"
}
