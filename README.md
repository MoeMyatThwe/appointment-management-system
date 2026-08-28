# Appointment Management System

An appointment-management SaaS platform for businesses such as salons, spas,
studios, clinics, and other service businesses.

## How the product works

The system has two types of users:

| User | Purpose |
| --- | --- |
| SaaS platform owner | Operates the platform, manages tenant accounts, subscription plans, platform settings, feature flags, support access, and audit records. |
| Business owner | Uses a private business workspace to manage staff, services, customers, schedules, appointments, payments, booking, and reports. |

Every business owner creates or uses an isolated tenant workspace. Data from
one business is not intended to be visible to another business.

## SaaS platform-owner workflow

1. Sign in through the normal login page with a platform-admin account.
2. The `PLATFORM_ADMIN` role redirects to `/platform`.
3. Review tenant accounts and their account status.
4. Assign subscription plans and activate or suspend tenant accounts.
5. Configure global platform settings and tenant feature flags.
6. Review audit events and manage time-limited support-access requests.
7. Export account metadata when required.
8. Request tenant deletion when appropriate. Deletion is delayed for retention
   and export checks rather than being an immediate destructive action.

Platform administrators manage account and platform metadata. They do not
automatically receive access to tenant appointments, customers, or payments.

## Business-owner workflow

1. Register at `/register`.
2. Complete onboarding with the business type, contact information, time zone,
   and currency.
3. Add staff members.
4. Add services with duration, price, and calendar color.
5. Add rooms, stations, equipment, or other bookable resources.
6. Configure business hours and holidays.
7. Add customers.
8. Create, update, reschedule, cancel, or delete appointments.
9. Use the calendar and reports to manage daily operations.
10. Track appointment payments and open subscription billing when authorized.
11. Share the public booking page at `/book/{tenantId}` so customers can view
    available services and slots and request appointments.

The normal business-owner journey is:

```text
Register → Onboard → Configure workspace → Add staff/services
→ Set hours → Add customers → Book appointments
→ Take payments → Share booking link → Review reports
```

## What happens when an appointment is created?

The browser sends requests to the API Gateway on port `4004`. The API Gateway
routes them to the appropriate Spring Boot service.

```text
Browser
  ↓
React frontend (:5173)
  ↓
API Gateway (:4004)
  ↓
Appointment Service (:4000)
  ├─ PostgreSQL: saves the appointment
  ├─ gRPC → Billing Service (:9001): creates/returns a billing account
  └─ Kafka topic "appointment": publishes an appointment event
       ├─ Notification Service: notifications and reminders
       └─ Analytics Service: appointment analytics
```

Authentication is handled by the Auth Service. JWTs identify the user and
tenant, and the services use tenant identifiers to scope business data.

## Main application routes

| Route | Use |
| --- | --- |
| `/login` | Sign in |
| `/register` | Create a business workspace |
| `/onboarding` | Complete workspace setup |
| `/dashboard` | Business overview |
| `/appointments` | Manage appointments |
| `/calendar` | View appointments on a calendar |
| `/customers` | Manage customers |
| `/staff` | Manage staff |
| `/services` | Manage bookable services |
| `/resources` | Manage rooms and resources |
| `/schedule` | Configure business hours and holidays |
| `/billing` | View subscription billing |
| `/reports` | View reports and exports |
| `/book/{tenantId}` | Public booking page |
| `/platform` | Platform-owner console |

## Run locally with Docker

Requirements:

- Docker Desktop with the Linux engine enabled
- Git

Open PowerShell and run:

```powershell
cd "C:\Users\<your-user>\Desktop\Appointment-Management-System\java-spring-microservices"
docker compose up --build
```

Open the frontend at:

```text
http://localhost:5173
```

The API Gateway is available at `http://localhost:4004`. Docker starts the
databases, Kafka, Redis, backend services, API Gateway, and frontend together.
Press `Ctrl+C` in the Docker terminal to stop the local stack.

## Repository structure

```text
frontend/                  React, TypeScript, and Vite application
java-spring-microservices/ Spring Boot microservices and Docker Compose
documentation.md           Detailed product, workflow, service, and operations documentation
```

Keep local secrets in the ignored `.env` file. Do not commit database
passwords, JWT secrets, Stripe keys, or webhook secrets.

## Documentation guide

This repository intentionally has one README and one detailed documentation
file:

- **`README.md`**: Short GitHub landing page. It explains what the application
  is, who uses it, the main workflows, the service architecture, important
  routes, and how to run the complete local stack.
- **`documentation.md`**: Detailed project documentation. It explains
  platform-owner and business-owner operations, permissions, tenant
  isolation, payments, booking, notifications, databases, Kafka, gRPC,
  deployment, monitoring, testing, and known limitations.

The backend directory does not have a separate README. Its service-specific
configuration and source code are documented through the root README and
`documentation.md`.
