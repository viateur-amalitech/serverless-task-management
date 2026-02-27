resource "aws_ses_email_identity" "sender" {
  email = var.sender_email
}

resource "aws_ses_email_identity" "admin" {
  email = var.admin_email
}

resource "aws_ses_configuration_set" "main" {
  name = "${var.project_name}-ses-config"
}
