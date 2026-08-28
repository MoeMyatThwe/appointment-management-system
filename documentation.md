# Appointment Management System

## Overview

This repository contains a generic SaaS appointment-management platform with a
React frontend, Spring Boot microservices, PostgreSQL persistence, Kafka events,
gRPC billing communication, JWT authentication, and Docker Compose deployment.

The system is appointment-focused and does not use patient-specific domain
terminology.

## Business Owner Use Case and User Flow

### Quick workflow

**Register → Onboard → Add staff/services → Set hours → Add customers → Book appointments → Take payments → Share booking link → Review reports.**

### Who uses the product?

There are two different roles:

| Role | Meaning | Main responsibility |
| --- | --- | --- |
| **SaaS platform owner** | You, the developer/company operating this software | Manage the platform, tenants, plans, billing, support, security, and infrastructure |
| **Business owner / tenant** | A customer borrowing the software for their own business | Manage staff, services, customers, appointments, payments, and booking |

The current application is primarily the **business owner / tenant
workspace**. When someone registers, they create one private business
workspace and become its administrator. Their data is isolated from every
other business.

The business type chosen during onboarding does **not** limit the product to
one type of business. It identifies the business as a salon, spa, studio,
clinic, or similar service business and can later be used for defaults,
branding, and reporting.

If one customer operates multiple separate businesses, the safe model is one
workspace per business. Each workspace has its own staff, services, customers,
appointments, settings, and booking link.

The SaaS platform-admin console is implemented in an initial account-management
form. Platform support access should be explicit, permission-controlled,
time-limited, and audited; the platform owner should not automatically browse
tenant business data.

The local platform-admin account is provisioned from `.env`:

```text
Email: platformadmin@test.com
Password: PlatformAdmin123!
```

Platform administrators use the same login page as business users:

1. Open `http://localhost:5173/login`.
2. Enter the platform-admin email and password shown above.
3. Click **Log in**.

The system reads the account's `PLATFORM_ADMIN` role and redirects the user to
`http://localhost:5173/platform`. Platform administrators can then
view tenant account information and activate or suspend accounts. The console
does not expose tenant appointments, customers, or payment records.

### Tenant lifecycle

Platform administrators manage account state only:

`ACTIVE` → normal access  
`SUSPENDED` → login and protected workspace access blocked  
`DELETION_REQUESTED` → access blocked and deletion awaits an approved
retention/export process

Deletion is intentionally a request, not an immediate database delete. This
prevents accidental loss and leaves room for retention, export, legal, and
support checks before permanent removal is added.

The platform lifecycle controls are available from `/platform`:

- **Export account data** downloads the tenant account, workspace, subscription,
  and lifecycle metadata as JSON.
- **Request deletion** disables the tenant and schedules permanent deletion 30
  days later.
- Permanent deletion requires the exact confirmation text
  `DELETE {tenantId}` and is rejected before the retention deadline or when the
  confirmation is incorrect.

The current permanent-delete operation removes the tenant's auth/account
records. Operational records in appointment, payment, customer, and
notification databases still require a coordinated cross-service deletion
workflow before production use. Exporting those operational records should
also be added to the service-level data export contract.

### SaaS plans and billing

The platform includes these subscription plans:

| Plan | Monthly price | Staff limit | Appointment limit |
| --- | ---: | ---: | ---: |
| Free | $0 | 2 | 50 |
| Starter | $29 | 5 | 500 |
| Pro | $79 | 15 | 2,000 |
| Business | $149 | 50 | 10,000 |

Platform administrators assign a plan from `/platform`. Each tenant stores its
plan and subscription status separately from appointment payments. The tenant
workspace can read its own subscription summary through `/auth/subscription`.
Stripe appointment checkout remains separate from SaaS subscription billing;
tenant admins can choose a paid plan from **Settings → Subscription &
billing**, which opens a Stripe recurring Checkout session. Stripe webhook
events update subscription state for checkout completion, renewals, payment
failures, cancellations, and status changes.

For local webhook testing, install the Stripe CLI and run:

```text
stripe listen --forward-to http://localhost:4004/auth/stripe/webhook
```

Copy the CLI signing secret into `STRIPE_WEBHOOK_SECRET` in the ignored
`.env` file, then restart `auth-service`. Never commit Stripe secret keys or
webhook signing secrets.

### Audited support access

Support follows this workflow:

`Platform admin requests → Tenant admin approves or declines → Access expires
automatically → Platform admin can revoke early`

Requests require a reason and a duration between 15 and 240 minutes. Every
request, approval, decline, and revocation is recorded in the platform audit
log. A support request by itself does not grant access to tenant appointments,
customers, or payments.

### Platform settings and feature flags

Open `/platform/settings` from the platform dashboard to manage:

- Global settings such as maintenance mode, new registrations, public booking,
  and Stripe billing.
- Tenant-level flags for online booking, reports, appointment payments, and
  notifications.

Settings and flags are stored centrally and changes are restricted to
`PLATFORM_ADMIN`. Online booking and appointment payments are enforced in the
appointment service, notifications are enforced in the notification service,
and reports are enforced in the workspace frontend. Disabled features return a
clear unavailable response instead of silently continuing.

### Platform audit log

Open `/platform/audit-log` to review platform actions and support-access
history. Filter by tenant ID, actor email, or action type. The log includes
support requests, approvals, declines, and revocations without exposing tenant
appointments, customers, or payment records.

### Security hardening

- **Account recovery:** use `/recovery` or the recovery API. Tokens are
  hashed, expire after 15 minutes, and can be used once. Connect recovery
  delivery to an email provider before production.
- **Secret rotation:** rotate `JWT_SECRET`, Stripe keys, webhook secrets, and
  `INTERNAL_SERVICE_KEY` through deployment secret storage. JWT rotation
  invalidates existing sessions.
- **Rate limits:** login, registration, and recovery have stricter gateway
  limits; public booking remains separately rate-limited.
- **Production review:** use HTTPS, non-default internal keys, production
  secret storage, backups, and alerting.

### Current role permissions

- **TENANT_ADMIN**: Full access to the business workspace.
- **MANAGER**: Manage staff, services, resources, hours, payments, and
  appointments.
- **STAFF**: Manage customers, appointments, and payment records.
- **CUSTOMER**: Public booking only; no authenticated business workspace
  access.
- **PLATFORM_ADMIN**: Manages tenant accounts, plans, and consent-based support
  requests; does not automatically receive tenant operational data access.

This guide explains how a salon, spa, studio, clinic, or similar business
uses the application day to day.

### The main use case

The business owner creates a workspace, configures the business, adds staff
and services, and then manages customer appointments. Customers may either
be added by the business or book through the public booking page. The owner
can manage schedules, record payments, send notifications through configured
providers, and export business data.

### First-time setup

1. Start the Docker services and open `http://localhost:5173`.
2. Select **Register** if you are creating a new business workspace.
3. Complete onboarding:
   - Business name and business type
   - Phone number
   - Time zone
   - Currency
4. The application opens the business-owner dashboard.

For local testing, use:

```text
Email: testuser@test.com
Password: password123
```

### Recommended setup order

Use the sidebar in this order:

1. **Operations → Staff**: Add the people who provide services.
2. **Operations → Services**: Add services, duration, price, and color.
3. **Operations → Rooms & resources**: Add rooms, stations, equipment, or
   other bookable resources when needed.
4. **Settings → Business hours**: Set open days, opening times, breaks, and
   holidays.
5. **Customers → Customer directory**: Add existing customers, contact
   details, notes, groups, and tags.

The system uses these records to validate appointments. It does not allow
appointments outside business hours, on holidays, or during an overlapping
booking for the same staff member, customer, or resource.

### Daily appointment workflow

1. Open **Scheduling → Appointments**.
2. Select a customer, staff member, service, and optional room/resource.
3. Enter the start and end time, then add optional notes.
4. Select **Create appointment**.
5. Review the appointment in the list or in **Scheduling → Calendar**.
6. Use **Reschedule** when the time changes.
7. Use **Cancel** when the visit is cancelled. Cancelled appointments do not
   block future availability.

You can select **Add new customer** during appointment creation instead of
leaving the page.

### Customer workflow

Open **Customers → Customer directory** to:

- Search customers by name or email
- Edit phone, email, group, tags, and private notes
- Review a customer’s appointment history
- Create a customer before booking or directly during booking

Customer records and appointment history are restricted to the customer’s
business tenant.

### Payment workflow

1. Open an appointment and select **Payment**.
2. Review the service total, amount paid, and remaining balance.
3. Record a cash, card, transfer, or other manual payment for a deposit or
   full payment.
4. Use **Pay online with Stripe** to open Stripe Checkout for the remaining
   balance.
5. Keep the receipt number for the customer’s records.

Stripe Checkout uses test mode when `STRIPE_SECRET_KEY` is configured in the
local `.env` file. Subscription checkout uses the same secret, while signed
webhook synchronization additionally requires `STRIPE_WEBHOOK_SECRET`.

### Public customer booking workflow

The owner can select **Open public booking page** from the dashboard or use:

```text
http://localhost:5173/book/{tenantId}
```

A customer can then:

1. Choose a service.
2. Choose a staff member.
3. Choose a date.
4. Choose an available time slot generated by the server.
5. Enter name, email, phone, and optional notes.
6. Submit the booking request.

The new appointment is created with **PENDING** status. The business confirms
or manages it from the authenticated Appointments page. The public page does
not expose another tenant’s services, staff, customers, or appointments.

### Reports and exports

Open **Insights → Reports & exports** to:

- Review total, upcoming, completed, and cancelled appointments
- See appointment demand by service
- Download appointment records as CSV
- Download customer records as CSV

Exports contain only data from the authenticated business workspace.

### Notifications

Appointment events are sent to the notification service. To deliver email or
SMS, configure the corresponding provider and webhook URL in `.env`.
Notifications can cover appointment creation, confirmation, rescheduling,
cancellation, and scheduled reminders. If providers are set to `none`, the
application continues to work but delivery is skipped.

### Simple example

For a salon called **Moe Hair Studio**:

1. Register the Moe Hair Studio workspace.
2. Add Alex as staff.
3. Add Classic Haircut with a 45-minute duration and price.
4. Set Monday to Friday as open from 09:00 to 17:00.
5. Add a customer named Maria.
6. Book Maria with Alex for Classic Haircut.
7. Record Maria’s deposit from the appointment’s **Payment** dialog.
8. Send Maria the public booking link for future appointments.
9. Review completed appointments and export records from **Reports & exports**.

## Frontend

Location: `frontend`

- React 19 with Vite and TypeScript
- Axios API client
- JWT stored in browser local storage
- Login and logout
- Authenticated appointment listing
- Appointment creation
- Appointment editing and updating
- Appointment cancellation
- Permanent appointment deletion with confirmation
- Separate loading states for login, list loading, saves, and record actions
- API error banners and session-expiration handling

Frontend commands:

```bash
cd frontend
npm ci
npm run lint
npm run build
npm run dev
```

The API base URL is configured with `VITE_API_BASE_URL`. The local Docker
configuration uses `http://localhost:4004`.

## Quick start

Requirements: Docker Desktop with the Linux engine enabled.

From PowerShell:

```powershell
cd "C:\Users\<your-user>\Desktop\Appointment-Management-System\java-spring-microservices"
Copy-Item .env.example .env
```

Edit `.env` and set `DATABASE_PASSWORD` and `JWT_SECRET`. Keep `.env`
private; it is ignored by Git.

For the normal local stack, using local PostgreSQL, Kafka, and Redis:

```powershell
docker compose up --build
```

Open `http://localhost:5173` when the containers are running. The local seed
login is `testuser@test.com` / `password123`.

Local testing credentials:

```text
Email: testuser@test.com
Password: password123
```

These credentials are for local development only. Do not use them in a
production or shared Neon environment.

To create a new salon, spa, or studio workspace, open
`http://localhost:5173/register`. Enter the business name, owner email, and a
password of at least 8 characters. The first account becomes the workspace
owner, and the new workspace is isolated from all other businesses.

New workspace owners are guided through a short setup wizard for business
type, phone number, time zone, and currency before entering the dashboard.

From the dashboard, use **Staff** for team members, **Services** for bookable
offerings with duration, price, and calendar color, and **Rooms & Resources**
for rooms, stations, equipment, or locations. All records are automatically
scoped to the signed-in business workspace.

Use **Business Hours** to configure opening and closing times, optional daily
breaks, and holiday closures. New appointments and reschedules are rejected
when they fall outside the saved schedule.

Use **Calendar** for a weekly visual schedule. The server prevents overlapping
appointments for the same staff member, customer, or selected room/resource.
Cancelled appointments do not block future availability.

To stop the stack, press `Ctrl+C` or run:

```powershell
docker compose down
```

To use the Neon development branch for the auth and appointment databases,
first set `AUTH_DATABASE_URL`, `APPOINTMENT_DATABASE_URL`,
`DATABASE_USERNAME`, and `DATABASE_PASSWORD` in `.env`, then run:

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Use the Neon development branch, not the production branch. Kafka and Redis
remain local unless separately configured as managed services.

Useful commands:

```powershell
docker compose ps
docker compose logs -f auth-service appointment-service api-gateway
```

## Backend services

All backend services are under `java-spring-microservices`.

| Service | Port | Responsibility |
|---|---:|---|
| `api-gateway` | 4004 | Public API entry point, routing, CORS, JWT validation, correlation IDs |
| `auth-service` | 4005 | Login, JWT generation and validation, user roles and tenant claims |
| `appointment-service` | 4000 | Appointment CRUD, tenant scoping, billing gRPC calls, Kafka events |
| `billing-service` | 4001 / 9001 | HTTP health endpoint and billing gRPC server |
| `analytics-service` | 4002 | Kafka appointment-event consumer and analytics processing |
| `notification-service` | 4003 | Kafka lifecycle consumer, reminders, email/SMS/calendar adapters |

Backend technologies:

- Java 21
- Spring Boot 3.4.x
- Spring Web and Spring Validation
- Spring Data JPA and Hibernate
- Spring Security
- Spring Cloud Gateway
- Springdoc OpenAPI
- gRPC and Protocol Buffers
- Apache Kafka with Protobuf event payloads
- Spring Boot Actuator and Micrometer Prometheus metrics

## Authentication, authorization, and tenancy

- Login returns a signed JWT.
- JWTs contain the authenticated email, role, and `tenantId`.
- The gateway validates bearer tokens through `auth-service`.
- The gateway propagates trusted `X-Tenant-ID`, `X-User-Role`, and
  `X-User-Email` context to protected appointment routes.
- Appointment queries and writes are scoped to the authenticated tenant.
- Appointment changes require `ADMIN`, `MANAGER`, or `STAFF`.
- Existing records and users were migrated to `default-tenant`.
- Production Compose keeps internal service ports private; the gateway is the
  public backend entry point.
- Every customer, staff member, service, and appointment is scoped to the
  authenticated tenant. The gateway overwrites client-supplied tenant headers,
  so a salon cannot switch tenants by editing browser requests.
- A SaaS platform owner should not receive automatic access to salon data.
  Support or operations access should be implemented as explicit, audited,
  time-limited impersonation with the salon owner's approval.

## Databases and migrations

PostgreSQL databases:

- `auth-service-db` on local host port 5433
- `appointment-service-db` on local host port 5434

Flyway migrations:

- Auth: `auth-service/src/main/resources/db/migration`
- Appointment: `appointment-service/src/main/resources/db/migration`

Current migrations include:

- Auth users table
- Appointment table compatibility schema
- User tenant column and index
- Appointment tenant column, default-tenant backfill, and index

Local-only test data is isolated under:

`auth-service/src/main/resources/db/migration-local`

Production uses only the shared schema migrations. Hibernate runs with
`validate`; it does not mutate production schemas.

## Messaging and service communication

- Kafka topic: `appointment`
- Appointment creation publishes an `APPOINTMENT_CREATED` event.
- Rescheduling and updates publish `APPOINTMENT_RESCHEDULED` or
  `APPOINTMENT_UPDATED`.
- Cancellation publishes `APPOINTMENT_CANCELLED`.
- Billing account creation uses gRPC.
- gRPC calls have bounded deadlines and retries.
- Kafka publishing has bounded timeouts and retries.
- Analytics consumes appointment events using a single-broker-safe Kafka setup.
- Notification service consumes lifecycle events and schedules reminders.
- Reminder timing is configured with `NOTIFICATION_REMINDER_MINUTES_BEFORE`.

## Observability and operations

- Actuator health endpoints are available at `/actuator/health`.
- Prometheus metrics are available at `/actuator/prometheus`.
- Correlation IDs use the `X-Correlation-ID` header.
- The gateway creates a correlation ID when one is not supplied.
- Service logs include correlation IDs.
- Optional monitoring overlay:

```bash
cd java-spring-microservices
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

Prometheus is exposed locally at `http://localhost:9090`.
Alert rules are defined in `monitoring/alerts.yml`. Loki and Promtail provide
optional centralized local log storage when the monitoring overlay is enabled;
Loki is exposed at `http://localhost:3100`.

The gateway uses Redis-backed rate limiting for protected appointment routes.
The default local policy allows 20 requests per second with a burst capacity
of 40 requests per client IP. Authentication and appointment mutations emit
`AUDIT` log events containing the event type, tenant, user, and resource ID.

## Docker deployment

Local full stack:

```bash
cd java-spring-microservices
docker compose up --build
```

Production overlay:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Production requires:

- `POSTGRES_PASSWORD`
- `DATABASE_USERNAME` and `DATABASE_PASSWORD` for the managed PostgreSQL role
- `AUTH_DATABASE_URL` and `APPOINTMENT_DATABASE_URL` as JDBC PostgreSQL URLs
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `VITE_API_BASE_URL`
- `NOTIFICATION_EMAIL_PROVIDER` and `NOTIFICATION_EMAIL_WEBHOOK_URL`
- `NOTIFICATION_SMS_PROVIDER` and `NOTIFICATION_SMS_WEBHOOK_URL`
- `NOTIFICATION_CALENDAR_PROVIDER` and `NOTIFICATION_CALENDAR_WEBHOOK_URL`

Database backup scripts:

- Windows: `scripts/backup-databases.ps1`
- Linux: `scripts/backup-databases.sh`
- Restore drill: `scripts/restore-drill.ps1` or `scripts/restore-drill.sh`

Backups must be copied to durable off-host storage and periodically restored
in a separate environment.

## Cloud deployment package

Kubernetes manifests are in `java-spring-microservices/deploy/k8s`. They
assume:

- Managed PostgreSQL endpoints for the auth and appointment databases
- Managed Kafka bootstrap servers
- A Kubernetes secret named `appointment-production-secrets` containing
  `postgres-username`, `postgres-password`, and `jwt-secret`
- NGINX Ingress and cert-manager with a `letsencrypt-prod` ClusterIssuer
- Kubernetes Metrics Server for HPA decisions
- Container images published to the registry configured in `configmap.yaml`

After replacing the example registry, database, Kafka, and domain values:

```bash
kubectl apply -k java-spring-microservices/deploy/k8s
kubectl -n appointment-production rollout status deployment/api-gateway
```

The manifests provide TLS ingress, readiness/liveness probes, non-root
backend containers, network policy, and autoscaling for the gateway,
appointment, and notification services. Managed database/Kafka provisioning,
DNS records, certificates, and secret creation remain cloud-provider
operations rather than repository-local resources.

## Testing and CI

The repository includes:

- Spring Boot service tests
- Gateway tests
- Kafka tests
- REST Assured integration tests
- Frontend lint and production build
- GitHub Actions CI
- Trivy filesystem security scanning

The CI workflow is at:

`.github/workflows/ci.yml`

## Current limitations and remaining work

- Tenant provisioning and user/role administration workflows are not yet
  exposed as a management API or frontend.
- Notification and calendar adapters use configurable HTTPS webhooks. When a
  provider is `none` or its webhook URL is empty, delivery is skipped safely.
  Provider-specific credentials and webhook implementations remain deployment
  responsibilities.
- Alert delivery must be connected to Prometheus Alertmanager or the selected
  cloud monitoring platform.
- Restore drills must be scheduled and recorded; the repository scripts restore
  backups into temporary databases but do not provide off-site storage.
- Billing is currently represented by the gRPC service flow; persistent
  subscription and payment-provider management is not yet implemented.

### Customer management

The Customers workspace supports tenant-scoped customer records with contact
details, private notes, customer groups, and comma-separated tags. Business
owners can search the directory, edit profiles, review appointment history,
and add a new customer directly while creating an appointment. Customer
history and records are restricted to the authenticated business tenant.

### Appointment payments

Each appointment can have a tenant-scoped payment record. Owners and staff can
record cash, card, transfer, or other payments, including deposits. The system
calculates the service total, balance, payment status, and receipt number.
Payment amounts cannot exceed the appointment total. SaaS subscription billing
is managed separately from appointment payments under Settings → Subscription
& billing.

Stripe Checkout is supported in test mode through the appointment payment
dialog. Configure `STRIPE_SECRET_KEY` as a container environment variable;
the key is never stored in source code. Checkout opens a Stripe-hosted payment
page for the remaining appointment balance. Configure
`STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` for deployed environments.
Stripe appointment webhook confirmation remains separate from SaaS subscription
webhooks; configure `STRIPE_WEBHOOK_SECRET` to enable signed webhook handling.

### Notifications

Appointment-created, confirmed, rescheduled, cancelled, and reminder events
are published to the notification service. Email and SMS delivery use the
configured provider webhook adapters. Set `NOTIFICATION_EMAIL_PROVIDER` and
`NOTIFICATION_EMAIL_WEBHOOK_URL` (and the equivalent SMS variables) in `.env`
when connecting a provider. Customer name and email are resolved from the
tenant-scoped customer record before notification events are published.

### Reports and exports

The Reports & exports workspace provides appointment totals, upcoming,
completed, and cancelled counts, service demand summaries, and tenant-scoped
CSV exports for appointments and customers.

### Online booking

Each workspace has a public booking URL:

`http://localhost:5173/book/{tenantId}`

The dashboard provides a direct link to it. Customers can select a service,
staff member, date, and server-generated available time slot, then submit
their contact details. The request creates a pending appointment in the
business tenant. Public booking is rate-limited and uses the same
business-hours, holiday, and overlap validation as staff-created bookings.
