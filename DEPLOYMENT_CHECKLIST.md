# Project Deployment Checklist

This checklist ensures your Serverless Task Management System is fully functional from infrastructure to frontend.

## ✅ Pre-Deployment Checklist

### 1. AWS Prerequisites
- [ ] AWS CLI configured with valid credentials (`aws configure`)
- [ ] Sufficient permissions to create: Lambda, API Gateway, Cognito, DynamoDB, SES, SNS, IAM, CloudWatch
- [ ] AWS region selected (default: `eu-north-1` or your preferred region)

### 2. Local Development Environment
- [ ] Node.js v22+ installed (`node -v`)
- [ ] npm v10+ installed (`npm -v`)
- [ ] Terraform v1.0+ installed (`terraform -v`)

---

## 🚀 Deployment Steps

### Step 1: Build Backend
```bash
cd backend
npm install
npm run build
```

**Verify**: Check that `backend/dist/` contains compiled `.js` files and `.zip` archives.

### Step 2: Configure Terraform Variables
```bash
cd ../terraform
cp terraform.tfvars.example terraform.tfvars
```

**Edit `terraform.tfvars`** with your values:
```hcl
aws_region   = "eu-north-1"  # Your AWS region (default for this project)
project_name = "serverless-task-mgmt"

# IMPORTANT: Use valid email addresses you have access to
# Allowed signup domains
allowed_email_domains = [
  "amalitech.com",
  "amalitechtraining.org"
]

# SES emails (must be verified in eu-north-1 while SES is in sandbox)
sender_email          = "noreply@amalitech.com"
admin_email           = "admin@amalitech.com"

admin_group_name  = "Admin"
member_group_name = "Member"
```

### Step 3: Deploy Infrastructure
```bash
terraform init
terraform plan    # Review what will be created
terraform apply   # Type 'yes' to confirm
```

**Capture Outputs**: After successful apply, note:
- `api_url`
- `user_pool_id`
- `user_pool_client_id`
- `aws_region`

### Step 4: Verify SES Email Addresses
**CRITICAL**: AWS SES starts in sandbox mode. You MUST verify email addresses.

1. Check your inbox for emails from `no-reply@ses.amazonaws.com`
2. Click verification links for:
   - `sender_email` (e.g., noreply@amalitech.com)
   - `admin_email` (e.g., admin@amalitech.com)
   - Optional test recipient (developer): `viateur.akimana@amalitechtraining.org`
3. Verify both emails are in "Verified" status in AWS SES console

**Without this step, email notifications will fail!**

### Step 5: Configure Frontend
**Option A: Using `.env` (Recommended)**
```bash
cd ../frontend
```

Create `.env` file:
```env
VITE_API_URL=<api_url from terraform output>
VITE_USER_POOL_ID=<user_pool_id from terraform output>
VITE_USER_POOL_CLIENT_ID=<user_pool_client_id from terraform output>
VITE_AWS_REGION=<aws_region from terraform output>
VITE_ADMIN_GROUP_NAME=Admin
```

**Option B: Edit `aws-exports.ts` directly**
Update `frontend/src/aws-exports.ts` with the Terraform outputs.

### Step 6: Run Frontend
```bash
npm install
npm run dev
```

Frontend should be available at `http://localhost:5173`.

---

## 🧪 Testing & Verification

### 1. Create First Admin User
**Option A: Using Script**
```bash
cd scripts
chmod +x create-admin.sh
./create-admin.sh
```

**Option B: AWS Console**
1. Go to AWS Cognito > User Pools
2. Select your user pool
3. Create user with email from `allowed_email_domains`
4. Add user to `Admin` group

### 2. Test Authentication
- [ ] Sign up with allowed email domain (should work)
- [ ] Sign up with non-allowed domain (should fail)
- [ ] Verify email via code sent to inbox
- [ ] Login with verified credentials

### 3. Test Admin Features
- [ ] Dashboard loads successfully
- [ ] "New Task" button visible (Admin only)
- [ ] Create a task with title, description, priority
- [ ] Assign task to a user
- [ ] View all users in dropdown (Admin only)

### 4. Test Task Management
- [ ] Update task status: Open → In Progress → Closed
- [ ] Search tasks by title/description
- [ ] Delete a task (Admin only)
- [ ] Verify task appears in list after creation

### 5. Test Notifications
- [ ] Create/update a task
- [ ] Check if notification email is sent to assigned user
- [ ] Check admin email for task notifications

**If emails don't arrive**: Verify SES email addresses are verified (Step 4)

### 6. Test Member Role
- [ ] Create a member user (not in Admin group)
- [ ] Login as member
- [ ] Verify "New Task" button is hidden
- [ ] Verify member can only update status of assigned tasks

---

## 🔍 Common Issues & Troubleshooting

### Issue: "crypto.hash is not a function" (Vite)
**Solution**: Upgrade Node.js to v22+
```bash
nvm install 22
nvm use 22
```

### Issue: 401/403 Errors from API
**Causes**:
- Frontend `.env` values don't match Terraform outputs
- User not verified in Cognito
- JWT token expired

**Solution**: Double-check `VITE_API_URL`, `VITE_USER_POOL_ID`, `VITE_USER_POOL_CLIENT_ID`

### Issue: Emails Not Sending
**Causes**:
- SES email addresses not verified
- SES still in sandbox mode (can only send to verified addresses)

**Solution**:
1. Verify emails in SES console
2. For production: Request SES production access via AWS Support

### Issue: CORS Errors
**Cause**: API Gateway CORS misconfiguration

**Solution**: Check `terraform/modules/apigateway/main.tf` CORS settings:
```hcl
cors_configuration {
  allow_origins = ["*"]  # Or specific frontend URL
  allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  allow_headers = ["Authorization", "Content-Type"]
}
```

### Issue: Terraform Apply Fails
**Common Causes**:
- Missing `terraform.tfvars` file
- Invalid email format in variables
- AWS credentials expired

**Solution**: Verify `terraform.tfvars` exists and contains valid values

---

## 📊 Post-Deployment Verification

### CloudWatch Monitoring
1. Go to AWS CloudWatch > Alarms
2. Verify alarms exist for each Lambda function
3. Check SNS topic subscription (you should receive confirmation email)

### DynamoDB
1. Go to AWS DynamoDB > Tables
2. Verify `serverless-task-mgmt-tasks` table exists
3. Check that GSI `AssignedToIndex` is active

### Lambda Functions
1. Go to AWS Lambda > Functions
2. Verify 4 functions exist:
   - `pre-signup`
   - `post-confirmation`
   - `task-handler`
   - `notification-handler`
3. Check CloudWatch Logs for any errors

### API Gateway
1. Go to AWS API Gateway > APIs
2. Verify HTTP API exists
3. Check routes: `/tasks`, `/tasks/{taskId}`, `/users`
4. Verify JWT authorizer is attached

---

## 🎯 Success Criteria

Your project is fully functional when:

✅ Infrastructure deployed without errors
✅ SES emails verified
✅ Frontend connects to API successfully
✅ Admin can create, update, delete tasks
✅ Members can view and update assigned tasks
✅ Email notifications are received
✅ Search functionality works
✅ CloudWatch alarms are active
✅ No console errors in browser or Lambda logs

---

## 🚨 Security Reminders

- [ ] Never commit `terraform.tfvars` to Git (it's in `.gitignore`)
- [ ] Never commit `.env` to Git
- [ ] Use strong passwords for Cognito users
- [ ] Review IAM policies for least privilege
- [ ] Monitor CloudWatch for suspicious activity
- [ ] Keep dependencies updated (`npm audit`)

---

## 📝 Next Steps After Deployment

1. **Production SES Access**: Request production access to send emails to any address
2. **Custom Domain**: Configure custom domain for API Gateway and Amplify
3. **CI/CD Pipeline**: Set up GitHub Actions for automated deployments
4. **Monitoring Dashboard**: Create CloudWatch dashboard for metrics
5. **Backup Strategy**: Enable DynamoDB point-in-time recovery
6. **Load Testing**: Test with multiple concurrent users
7. **Documentation**: Document any custom configurations or workflows
