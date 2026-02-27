aws_region   = "eu-north-1"
project_name = "serverless-task-mgmt"

# Enforce organizational signup domains
allowed_email_domains = [
  "amalitech.com",
  "amalitechtraining.org"
]

# SES sender/notification emails
sender_email = "viateur.akimana@amalitechtraining.org"
admin_email  = "viateur.akimana@amalitechtraining.org"

# Cognito groups (RBAC)
admin_group_name  = "Admin"
member_group_name = "Member"