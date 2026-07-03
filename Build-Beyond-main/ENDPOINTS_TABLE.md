# API Endpoints Reference

## Table of Contents
- [Authentication](#authentication) - 11 endpoints
- [Admin](#admin) - 36 endpoints
- [Platform Manager](#platform-manager) - 12 endpoints
- [Company](#company) - 17 endpoints
- [Customer](#customer) - 30 endpoints
- [Worker](#worker) - 23 endpoints
- [Payment](#payment) - 17 endpoints
- [Project](#project) - 20 endpoints
- [Chat](#chat) - 1 endpoint
- [Review](#review) - 3 endpoints
- [Complaint](#complaint) - 5 endpoints

**Total Endpoints: 175**

---

## Authentication

> **Module**: `auth.js`  
> **Tag**: `auth`  
> **Count**: 11 endpoints

| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 1 | POST | `/api/signup` | Register a new user (customer/company/worker) |
| 2 | POST | `/api/login` | Login with email/password |
| 3 | POST | `/api/login/google` | Login using Google identity token |
| 4 | POST | `/api/login/2fa/verify` | Verify login OTP and complete 2FA login |
| 5 | POST | `/api/login/2fa/resend` | Resend login OTP during 2FA flow |
| 6 | POST | `/api/email-otp/send` | Send email OTP (signup or forgot-password) |
| 7 | POST | `/api/email-otp/verify` | Verify email OTP and get verification token |
| 8 | POST | `/api/reset-password` | Reset password using verification token |
| 9 | GET | `/api/2fa/status` | Get current user 2FA status |
| 10 | PUT | `/api/2fa/status` | Enable or disable 2FA |
| 11 | GET | `/api/logout` | Logout and clear auth cookie |
| 12 | GET | `/api/session` | Get current session authentication state |

---

## Admin

> **Module**: `admin.js`  
> **Tag**: `admin`  
> **Count**: 36 endpoints

### Authentication & Session
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 1 | POST | `/api/admin/login` | Admin login |
| 2 | GET | `/api/admin/verify-session` | Verify current admin session |
| 3 | POST | `/api/admin/logout` | Admin logout |

### Dashboard & Analytics
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 4 | GET | `/api/admindashboard` | Get admin dashboard overview |
| 5 | GET | `/api/admin/analytics` | Get admin analytics metrics |
| 6 | GET | `/api/admin/revenue` | Get admin revenue analytics |
| 7 | GET | `/api/admin/revenue/platform-intelligence` | Get detailed platform revenue intelligence |

### Cache Management
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 8 | GET | `/api/admin/cache/redis-stats` | Get Redis cache statistics |
| 9 | POST | `/api/admin/cache/redis-stats/reset` | Reset Redis cache statistics |

### Settings
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 10 | GET | `/api/admin/settings` | Get platform system settings |
| 11 | PUT | `/api/admin/settings` | Update platform system settings |

### Delete Operations
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 12 | DELETE | `/api/admin/delete-customer/{id}` | Delete a customer account |
| 13 | DELETE | `/api/admin/delete-company/{id}` | Delete a company account |
| 14 | DELETE | `/api/admin/delete-worker/{id}` | Delete a worker account |
| 15 | DELETE | `/api/admin/delete-architectHiring/{id}` | Delete architect hiring record |
| 16 | DELETE | `/api/admin/delete-constructionProject/{id}` | Delete construction project |
| 17 | DELETE | `/api/admin/delete-designRequest/{id}` | Delete design request |
| 18 | DELETE | `/api/admin/delete-bid/{id}` | Delete bid record |
| 19 | DELETE | `/api/admin/delete-jobApplication/{id}` | Delete job application |

### View Details (Basic)
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 20 | GET | `/api/admin/customer/{id}` | Get basic customer details |
| 21 | GET | `/api/admin/company/{id}` | Get basic company details |
| 22 | GET | `/api/admin/worker/{id}` | Get basic worker details |
| 23 | GET | `/api/admin/architect-hiring/{id}` | Get architect hiring details |
| 24 | GET | `/api/admin/construction-project/{id}` | Get construction project details |
| 25 | GET | `/api/admin/design-request/{id}` | Get design request details |
| 26 | GET | `/api/admin/bid/{id}` | Get bid details |
| 27 | GET | `/api/admin/job-application/{id}` | Get job application details |

### View Details (Full)
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 28 | GET | `/api/admin/customers/{customerId}/full` | Get full customer profile |
| 29 | GET | `/api/admin/companies/{companyId}/full` | Get full company profile |
| 30 | GET | `/api/admin/workers/{workerId}/full` | Get full worker profile |
| 31 | GET | `/api/admin/architect-hirings/{projectId}/full` | Get full architect hiring details |
| 32 | GET | `/api/admin/construction-projects/{projectId}/full` | Get full construction project details |
| 33 | GET | `/api/admin/design-requests/{requestId}/full` | Get full design request details |

### Platform Manager Management
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 34 | POST/GET | `/api/admin/platform-managers` | Create new platform manager / Get all platform managers |
| 35 | GET | `/api/admin/platform-managers/{id}/performance` | Get platform manager performance metrics |
| 36 | DELETE | `/api/admin/platform-managers/{id}` | Delete platform manager |
| 37 | PATCH | `/api/admin/platform-managers/{id}/toggle-status` | Toggle platform manager status |

---

## Platform Manager

> **Module**: `platformManager.js`  
> **Tag**: `platform-manager`  
> **Count**: 12 endpoints

### Authentication & Session
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 1 | POST | `/api/platform-manager/login` | Authenticate platform manager session |
| 2 | GET | `/api/platform-manager/verify-session` | Verify platform manager session |
| 3 | POST | `/api/platform-manager/logout` | Logout platform manager |

### Dashboard & Profile
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 4 | GET | `/api/platform-manager/dashboard` | Get platform manager dashboard |
| 5 | GET | `/api/platform-manager/analytics` | Get platform manager analytics |
| 6 | POST | `/api/platform-manager/change-password` | Change platform manager password |

### Verification Tasks
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 7 | GET | `/api/platform-manager/verification/{taskId}` | Get verification task details |
| 8 | POST | `/api/platform-manager/verification/{taskId}/process` | Process verification task (approve/reject) |

### Complaints
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 9 | GET | `/api/platform-manager/complaint/{complaintId}` | Get complaint details |
| 10 | POST | `/api/platform-manager/complaint/{complaintId}/reply` | Reply to complaint |

### Payment Management
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 11 | GET | `/api/platform-manager/company-payments` | Get pending platform fee queue |
| 12 | POST | `/api/platform-manager/company-payments/{projectId}/{milestonePercentage}/collect` | Collect platform fee |

---

## Company

> **Module**: `company.js`  
> **Tag**: `company`  
> **Count**: 17 endpoints

| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 1 | GET | `/api/companydashboard` | Get company dashboard data |
| 2 | GET | `/api/companyongoing_projects` | Get ongoing projects |
| 3 | GET | `/api/project_requests` | Get project requests |
| 4 | PATCH | `/api/projects/{projectId}/{status}` | Update project status |
| 5 | GET | `/api/companyhiring` | Get hiring requests |
| 6 | POST | `/api/companytoworker` | Create hire request for worker |
| 7 | GET | `/api/companysettings` | Get company settings |
| 8 | GET | `/api/companybids` | Get company bids |
| 9 | GET | `/api/companyrevenue` | Get company revenue summary |
| 10 | GET | `/api/my-employees` | Get company employees list |
| 11 | GET | `/api/revenue_form` | Get revenue form view |
| 12 | PATCH | `/api/worker-request/{requestId}` | Handle worker request (accept/reject) |
| 13 | POST | `/api/update-company-profile` | Update company profile |
| 14 | POST | `/api/submit-bid` | Submit bid for design request |
| 15 | POST | `/api/company/submit-proposal` | Submit project proposal |
| 16 | POST | `/api/company/password/update` | Update company password |
| 17 | POST | `/api/company/platform-fee-invoice` | Upload platform fee invoice |

---

## Customer

> **Module**: `customer.js`  
> **Tag**: `customer`  
> **Count**: 30 endpoints

### Profile & Dashboard
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 1 | GET | `/api/customer/profile` | Get customer profile |
| 2 | GET | `/api/customer/home` | Get customer dashboard home |
| 3 | GET | `/api/customer/customerdashboard` | Get customer dashboard |
| 4 | POST | `/api/customer/password/update` | Update customer password |

### Browse Services
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 5 | GET | `/api/customer/architect` | Get list of architects |
| 6 | GET | `/api/customer/architect_form` | Get architect form template |
| 7 | GET | `/api/customer/design_ideas` | Get design inspiration ideas |
| 8 | GET | `/api/customer/interior_designer` | Get list of interior designers |
| 9 | GET | `/api/customer/construction_companies_list` | Get list of construction companies |

### Bid & Forms
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 10 | GET | `/api/customer/bidForm_Submit` | Submit construction bid form |
| 11 | GET | `/api/customer/bidform` | Get bid form template |
| 12 | GET | `/api/customer/bidspace` | Get bid space for projects |
| 13 | GET | `/api/customer/job_status` | Get job/bid request status |

### Project Access
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 14 | GET | `/api/customer/ongoing_projects` | Get customer ongoing projects |
| 15 | GET | `/api/customer/interiordesign_form` | Get interior design request form |
| 16 | GET | `/api/customer/customersettings` | Get customer settings |
| 17 | GET | `/api/customer/architect-hiring/{projectId}` | Get architect hiring details |
| 18 | GET | `/api/customer/design-request/{projectId}` | Get design request details |

### Accept/Reject Proposals
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 19 | GET | `/api/customer/accept-proposal/{type}/{id}` | Accept proposal from worker |
| 20 | GET | `/api/customer/accept-bid/{bidId}/{companyBidId}` | Accept bid from company |
| 21 | GET | `/api/customer/accept-company-proposal/{projectId}` | Accept company proposal |
| 22 | POST | `/api/customer/accept-proposal` | Accept construction proposal |
| 23 | GET | `/api/customer/reject-company-proposal/{projectId}` | Reject company proposal |

### Milestone Management
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 24 | GET | `/api/customer/milestone/approve/{projectId}/{milestoneId}` | Approve milestone |
| 25 | GET | `/api/customer/milestone/reject/{projectId}/{milestoneId}` | Reject milestone |
| 26 | GET | `/api/customer/milestone/request-revision/{projectId}/{milestoneId}` | Request revision |
| 27 | GET | `/api/customer/milestone/report-to-admin/{projectId}/{milestoneId}` | Report to admin |

### Reviews & Payments
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 28 | GET | `/api/customer/review` | Submit review for worker |
| 29 | GET | `/api/customer/review-status/{projectType}/{projectId}` | Get review status |
| 30 | GET | `/api/customer/payment-history` | Get payment history |

---

## Worker

> **Module**: `worker.js`  
> **Tag**: `worker`  
> **Count**: 23 endpoints

### Profile & Dashboard
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 1 | GET | `/api/workerjoin_company` | Get worker company-join page data |
| 2 | GET | `/api/workersettings` | Get worker settings |
| 3 | GET | `/api/worker_edit` | Get worker editable profile data |
| 4 | GET | `/api/worker/dashboard` | Get worker dashboard |
| 5 | GET | `/api/worker/my-company` | Get worker current company |
| 6 | GET | `/api/workers/{id}` | Get worker by id |

### Company & Job Requests
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 7 | DELETE | `/api/worker-requests/{id}` | Delete worker request |
| 8 | POST | `/api/worker_request/{companyId}` | Create worker request to join company |
| 9 | POST | `/api/worker/profile/update` | Update worker profile |
| 10 | POST | `/api/worker/leave-company` | Leave company |

### Job Management
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 11 | GET | `/api/worker/jobs` | Get worker jobs |
| 12 | POST | `/api/jobs/{id}/status` | Update job status |
| 13 | GET | `/api/worker/ongoing-projects` | Get worker ongoing projects |

### Availability & Offers
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 14 | POST | `/api/worker/availability` | Update worker availability |
| 15 | POST | `/api/offers/{id}/accept` | Accept offer |
| 16 | POST | `/api/offers/{id}/decline` | Decline offer |

### Project Work
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 17 | POST | `/api/worker/project-update` | Submit project update |
| 18 | POST | `/api/worker/project-complete` | Mark project complete |
| 19 | POST | `/api/worker/submit-milestone` | Submit milestone |
| 20 | POST | `/api/worker/submit-proposal` | Submit design proposal |

### Account
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 21 | POST | `/api/worker/password/update` | Update worker password |
| 22 | POST | `/api/worker/review` | Submit review for customer |
| 23 | GET | `/api/worker/review-status/{projectType}/{projectId}` | Get review status |

---

## Payment

> **Module**: `payment.js`  
> **Tag**: `payment`, `payment:customer`  
> **Count**: 17 endpoints

### Worker Payment (Escrow)
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 1 | POST | `/api/payment/initialize-escrow` | Initialize escrow for architect/interior |
| 2 | POST | `/api/payment/worker/create-order` | Create Razorpay order for worker |
| 3 | POST | `/api/payment/worker/verify-payment` | Verify worker payment |
| 4 | POST | `/api/payment/worker/test-mark-paid` | Test mode: mark worker payment as paid |
| 5 | POST | `/api/payment/collect-milestone` | Collect milestone into escrow |
| 6 | POST | `/api/payment/release-milestone` | Release escrowed milestone |

### Worker Earnings & Withdrawal
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 7 | GET | `/api/payment/worker/earnings` | Get worker earnings summary |
| 8 | POST | `/api/payment/worker/withdraw` | Request worker withdrawal |
| 9 | GET | `/api/payment/worker/transactions` | Get worker transaction history |

### Company Payment (75/25 Split)
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 10 | POST | `/api/payment/company/create-order` | Create order for company phase payment |
| 11 | POST | `/api/payment/company/verify-payment` | Verify company payment |
| 12 | POST | `/api/payment/company/test-mark-paid` | Test mode: mark company payment as paid |
| 13 | POST | `/api/payment/company/release-milestone` | Release company milestone |

### Company Platform Fee
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 14 | POST | `/api/payment/company/platform-fee/create-order` | Create platform fee order |
| 15 | POST | `/api/payment/company/platform-fee/verify-payment` | Verify platform fee payment |
| 16 | POST | `/api/payment/company/platform-fee/test-mark-paid` | Test mode: mark platform fee as paid |

### Summary
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 17 | GET | `/api/payment/company/summary/{projectId}` | Get company payment summary |

---

## Project

> **Module**: `project.js`  
> **Tag**: `project-customer-accessed`  
> **Count**: 20 endpoints

### Customer - Create Projects
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 1 | POST | `/api/architect_submit` | Submit architect hiring request |
| 2 | POST | `/api/design_request` | Submit design request |
| 3 | POST | `/api/construction_form` | Submit construction project form |

### Customer - View & Manage Projects
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 4 | GET | `/api/projects` | Get all projects |
| 5 | GET | `/api/projects/{id}` | Get project by id |
| 6 | GET | `/api/edit-project/{id}` | Get editable project data |
| 7 | PATCH | `/api/projects/update` | Update project details |

### Customer - Bidding
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 8 | POST | `/api/customer/submit-bid` | Submit bid on project |
| 9 | POST | `/api/customer/accept-bid` | Accept bid |
| 10 | POST | `/api/customer/decline-bid` | Decline bid |

### Customer - Milestone Management
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 11 | POST | `/api/customer/approve-milestone` | Approve milestone |
| 12 | POST | `/api/customer/request-milestone-revision` | Request milestone revision |
| 13 | POST | `/api/customer/pay-milestone` | Pay milestone |

### Customer - Messaging
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 14 | GET | `/api/customer/unviewed-company-messages` | Get unviewed messages from company |
| 15 | POST | `/api/customer/mark-messages-viewed/{projectId}` | Mark customer messages as viewed |

### Customer - Reviews
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 16 | POST | `/api/customer/submit-project-review` | Submit project review |

### Company - Messaging
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 17 | GET | `/api/company/unviewed-customer-messages` | Get unviewed messages from customer |
| 18 | POST | `/api/company/mark-messages-viewed/{projectId}` | Mark company messages as viewed |

### Company - Worker Management
| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 19 | POST | `/api/company/worker-request/accept` | Accept worker request |
| 20 | POST | `/api/company/worker-request/reject` | Reject worker request |

---

## Chat

> **Module**: `chat.js`  
> **Tag**: `chat`  
> **Count**: 1 endpoint

| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 1 | GET | `/api/chat/{roomId}` | Get chat page for specific room |

---

## Review

> **Module**: `review.js`  
> **Tag**: `review`  
> **Count**: 3 endpoints

| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 1 | POST | `/api/customer/review` | Submit review as customer for worker |
| 2 | POST | `/api/worker/review` | Submit review as worker for customer |
| 3 | GET | `/api/project-review-status/{projectType}/{projectId}` | Get review submission status |

---

## Complaint

> **Module**: `complaint.js`  
> **Tag**: `complaint`  
> **Count**: 5 endpoints

| # | Method | Endpoint | Summary |
|---|--------|----------|---------|
| 1 | POST | `/api/complaints` | Submit complaint (customer/company) |
| 2 | GET | `/api/complaints/unviewed/count` | Get unviewed complaints count (admin) |
| 3 | GET | `/api/complaints/company/unviewed/count` | Get unviewed complaints for company |
| 4 | GET | `/api/complaints/{projectId}` | Get all complaints for project |
| 5 | POST | `/api/complaints/{complaintId}/reply` | Reply to complaint |

---

## Summary Statistics

| Module | Endpoints | Total Methods |
|--------|-----------|---------------|
| Authentication | 11 | 12 |
| Admin | 36 | 36 |
| Platform Manager | 12 | 12 |
| Company | 17 | 17 |
| Customer | 30 | 30 |
| Worker | 23 | 23 |
| Payment | 17 | 17 |
| Project | 20 | 20 |
| Chat | 1 | 1 |
| Review | 3 | 3 |
| Complaint | 5 | 5 |
| **TOTAL** | **175** | **176** |

**Note**: `/api/2fa/status` has both GET and PUT methods (1 endpoint, 2 methods), hence 175 endpoints with 176 total methods.

---

## Authentication Requirements

| Requirement | Endpoints | Count |
|------------|-----------|-------|
| Cookie Auth Required | Most protected endpoints | ~140 |
| No Auth Required | Some view endpoints | ~20 |
| Optional Auth | Some dashboard endpoints | ~15 |

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success - GET/PUT successful |
| 201 | Created - POST successful |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Auth failed |
| 403 | Forbidden - Permission denied |
| 404 | Not Found - Resource not found |
| 429 | Rate Limited - Too many requests |
| 500 | Server Error |

