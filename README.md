# PayFlow — Core Payment Gateway, Reliability Engine & Double-Entry Ledger

> **Notice:** Educational Sandbox Gateway. All payments, provider outcomes, and financial transfers are simulated. No real money or payment cards are processed.

PayFlow is an educational fintech payment gateway and reliability engine built with **Node.js, Express, TypeScript, PostgreSQL, Prisma ORM, and React (Vite)**. It demonstrates core distributed systems, database reliability, and financial engineering principles required in production payment infrastructure.

---

## Key Highlights

- **Server-Authoritative Pricing:** Clients submit catalog product IDs and quantities; unit prices and totals are strictly resolved from server data to prevent client-side tampering.
- **Integer Minor Units (Paise):** Money is represented strictly as integer paise (`99900` for ₹999.00) in `INR` currency to eliminate IEEE 754 floating-point rounding errors.
- **Strict Idempotency:** Requires an `Idempotency-Key` header on payment attempts. Normalized request payloads are hashed with SHA-256 and stored in PostgreSQL. Identical replays return cached responses with `Idempotent-Replay: true` header without re-charging. Conflicting payloads return HTTP 409.
- **Concurrency & Double-Charging Protection:** Uses database-level conditional updates (`updateMany({ where: { status: 'CREATED' } })`) and PostgreSQL constraints to prevent concurrent requests from charging an order multiple times.
- **Explicit Finite State Machine:** Governs transitions (`CREATED` ➔ `PROCESSING` ➔ `SUCCEEDED` / `FAILED` / `UNCERTAIN`) and rejects illegal or terminal state modifications.
- **Uncertain Outcomes & Reconciliation:** Never blindly retries provider timeouts. Incurred timeouts transition to an explicit `UNCERTAIN` state, resolved safely via a reconciliation inquiry endpoint.
- **Double-Entry Ledger Accounting:** Transactionally records balanced ledger entries (`Total Debits === Total Credits`) for every captured payment and refund. Duplicate postings are prevented by database-level unique constraints.
- **Atomic Full & Partial Refunds:** Supports multiple partial refunds guarded by PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) to prevent concurrent over-refunding beyond the captured amount.
- **Transactional Webhook Outbox:** Events are written atomically with database mutations, signed with cryptographic HMAC-SHA256 headers (`X-PayFlow-Signature: t=...,v1=...`), and dispatched with exponential backoff retries.
- **Live PostgreSQL Integration Testing:** A complete test suite of **68 tests** verifying database constraints, row locks, foreign key cascades, idempotency replays, and ledger balances.
- **Fintech Sandbox UI:** Interactive multi-workspace dashboard covering Checkout, Transactions, Refunds, Double-Entry Ledger, Webhook Outbox, and Payment Audit Lookup.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript 5, Vite 6, Tailwind CSS 3, Lucide React |
| **Backend** | Node.js (v18+), Express 4, TypeScript 5, Zod 3 (Runtime Validation) |
| **Database & ORM** | PostgreSQL 16, Prisma ORM 6 |
| **Testing** | Vitest 3, Supertest 7 (68 tests: unit + live PostgreSQL integration) |
| **Infrastructure** | Docker, Docker Compose (Alpine PostgreSQL container) |

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Client ["Client Layer"]
        UI["React 18 + Vite Sandbox Dashboard<br/>(Checkout / Transactions / Refunds / Ledger / Webhooks)"]
    end

    subgraph API ["Application Layer (Express + TypeScript)"]
        Router["Express Router & Zod Validation Middleware"]
        Idemp["Idempotency Engine<br/>(SHA-256 Request Hash + Status Check)"]
        SM["Payment State Machine<br/>(Terminal State & Transition Guard)"]
        MockProv["Mock Payment Provider<br/>(SUCCESS / DECLINE / TIMEOUT)"]
        LedgerSvc["Double-Entry Ledger Service<br/>(Debits === Credits Enforcement)"]
        RefundSvc["Refund Engine<br/>(SELECT ... FOR UPDATE Row Lock)"]
        WebhookSvc["Outbox Webhook Engine<br/>(HMAC-SHA256 Cryptographic Signer)"]
    end

    subgraph DB ["Persistence Layer (PostgreSQL 16 via Prisma)"]
        Orders[("orders")]
        Payments[("payment_attempts")]
        IdempRec[("idempotency_records")]
        LedgerTx[("ledger_transactions")]
        LedgerEnt[("ledger_entries")]
        Refunds[("refunds")]
        Webhooks[("webhook_events (Outbox)")]
    end

    UI -->|"HTTP JSON + Idempotency-Key"| Router
    Router --> Idemp
    Idemp -->|"Cache Hit (Same Payload)"| UI
    Idemp -->|"Cache Conflict (Diff Payload)"| UI
    Idemp -->|"New Request"| Orders
    Router --> SM
    SM --> MockProv
    MockProv -->|"SUCCESS"| LedgerSvc
    MockProv -->|"SUCCESS"| WebhookSvc
    MockProv -->|"TIMEOUT"| Payments
    Router --> RefundSvc
    RefundSvc -->|"Row Lock"| Payments
    RefundSvc --> LedgerSvc
    RefundSvc --> WebhookSvc
    LedgerSvc --> LedgerTx
    LedgerSvc --> LedgerEnt
    WebhookSvc --> Webhooks
    Router --> DB
```

### Transactional Webhook Outbox Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Customer as User / Merchant
    participant API as Express API
    participant DB as PostgreSQL Transaction
    participant Outbox as Webhook Outbox
    participant Target as Merchant Receiver (Test Target)

    Customer->>API: POST /api/v1/payments (Idempotency-Key)
    API->>DB: Atomic Update Order -> PROCESSING
    API->>API: Execute Mock Provider (SUCCESS)
    critical Database Commit Boundary
        API->>DB: Update Payment -> SUCCEEDED
        API->>DB: Post Balanced Ledger Entries (Debits = Credits)
        API->>DB: Insert Webhook Event (status: PENDING, attempts: 0)
    end
    DB-->>API: Transaction Committed
    API-->>Customer: HTTP 201 Created (Payment Succeeded)
    Note over DB,Outbox: Event is safely persisted before any network I/O

    opt Explicit / On-Demand Dispatch (Test Deliver)
        Customer->>API: POST /api/v1/webhooks/events/:id/deliver
        API->>API: Sign Payload with HMAC-SHA256 (t=..., v1=...)
        API->>Target: HTTP POST with X-PayFlow-Signature
        Target-->>API: HTTP 200 OK (Signature Verified)
        API->>DB: Update Event -> DELIVERED (attempts: 1, deliveredAt: now)
        API-->>Customer: HTTP 200 OK (Delivery Confirmed)
    end
```

---

## Payment Lifecycle & State Machine

```mermaid
stateDiagram-v2
    [*] --> CREATED: Order Created
    CREATED --> PROCESSING: Payment Initiated
    PROCESSING --> SUCCEEDED: Provider Captured
    PROCESSING --> FAILED: Provider Declined
    PROCESSING --> UNCERTAIN: Provider Timeout / Network Error
    UNCERTAIN --> SUCCEEDED: Reconciled as Success
    UNCERTAIN --> FAILED: Reconciled as Failed
    SUCCEEDED --> [*]: Terminal State (Immutable)
    FAILED --> [*]: Terminal State (Immutable)
```

### State Definitions

| Status | Meaning | Next Permitted States |
| :--- | :--- | :--- |
| `CREATED` | Initial attempt record created for order. | `PROCESSING` |
| `PROCESSING` | Handed off to payment provider gateway. | `SUCCEEDED`, `FAILED`, `UNCERTAIN` |
| `SUCCEEDED` | Fund transfer captured. Ledger and outbox updated. | *None (Terminal)* |
| `FAILED` | Provider definitively declined payment. | *None (Terminal)* |
| `UNCERTAIN` | Provider timed out. Fund transfer status unknown. | `SUCCEEDED`, `FAILED` (via `/reconcile`) |

> **Why UNCERTAIN matters:** Blindly retrying a timed-out request could double-charge the customer. PayFlow preserves the `UNCERTAIN` state and requires explicit status inquiry (`POST /api/v1/payments/:id/reconcile`) to safely resolve the payment.

---

## Repository Structure

```text
payflow-node/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                  # PostgreSQL schema definitions
│   │   └── migrations/                    # Sequential SQL migrations
│   │       ├── 20261020000000_init/
│   │       ├── 20261020000001_idempotency_and_reliability/
│   │       └── 20261020000002_ledger_refunds_webhooks/
│   ├── src/
│   │   ├── config/index.ts                # Environment variable parsing
│   │   ├── db/prisma.ts                   # Prisma client singleton
│   │   ├── errors/app-error.ts            # Centralized application errors
│   │   ├── middleware/
│   │   │   ├── error-handler.ts           # Global Express error handler
│   │   │   └── validate.ts                # Zod request validator
│   │   ├── modules/
│   │   │   ├── health/                    # Health check module
│   │   │   ├── orders/                    # Orders catalog & server pricing
│   │   │   ├── payments/                  # Payment service, state machine & mock provider
│   │   │   ├── refunds/                   # Atomic refunds with row-level locks
│   │   │   ├── ledger/                    # Double-entry ledger accounting
│   │   │   └── webhooks/                  # Webhook outbox & HMAC-SHA256 cryptography
│   │   ├── types/index.ts                 # Shared backend domain types
│   │   ├── app.ts                         # Express application setup
│   │   └── server.ts                      # Server entry point & graceful shutdown
│   ├── tests/                             # Vitest unit & integration test suites
│   ├── .env.example                       # Backend environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx                 # Navigation bar & system status
│   │   │   ├── ProductCard.tsx            # ₹999 Sample product card
│   │   │   ├── OrderSummary.tsx           # Order details & outcome selector
│   │   │   ├── PaymentStatusCard.tsx      # Payment status card with refund actions
│   │   │   ├── TransactionsView.tsx       # Transactions ledger & reconciliation
│   │   │   ├── RefundsView.tsx            # Refund management & calculations
│   │   │   ├── LedgerView.tsx             # Double-entry audit ledger view
│   │   │   ├── WebhooksView.tsx           # Outbox queue & HMAC signature inspector
│   │   │   ├── PaymentLookupModal.tsx     # Payment audit lookup by reference
│   │   │   └── Badge.tsx                  # Domain status badges
│   │   ├── services/api.ts                # API client with typed endpoints
│   │   ├── types/index.ts                 # Frontend type definitions
│   │   ├── App.tsx                        # Main application container
│   │   └── main.tsx
│   ├── vite.config.ts                     # Vite dev server with /api proxy
│   └── package.json
├── docker-compose.yml                     # PostgreSQL 16 container definition
└── package.json                           # Root workspace scripts
```

---

## Local Setup & Prerequisites

### Prerequisites

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Docker & Docker Compose:** for running local PostgreSQL

### 1. Clone & Start Database

```bash
# Start PostgreSQL container in the background
docker compose up -d

# Verify PostgreSQL is running
docker compose ps
```

### 2. Configure Environment Variables

Create `.env` in `backend/` based on `backend/.env.example`:

```bash
# backend/.env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://payflow_user:payflow_password@localhost:5432/payflow_db?schema=public"
CORS_ORIGIN="http://localhost:5173"
WEBHOOK_SECRET="whsec_sandbox_secret_key_12345"
WEBHOOK_DEFAULT_URL=""
```

*(Optional)* Create `.env` in `frontend/` if connecting to a custom backend URL (defaults to Vite proxy):

```bash
# frontend/.env
VITE_API_BASE_URL=
```

### 3. Install Dependencies & Run Database Migrations

```bash
# Install root, backend, and frontend dependencies
npm --prefix backend install
npm --prefix frontend install

# Apply Prisma migrations to PostgreSQL
npm --prefix backend run prisma:migrate
```

### 4. Run Tests

```bash
# Run all 68 Vitest tests (unit + live PostgreSQL integration)
npm --prefix backend test
```

### 5. Start Development Servers

Open two terminal windows:

```bash
# Terminal 1: Start backend on port 4000
npm run dev:backend

# Terminal 2: Start frontend on port 5173
npm run dev:frontend
```

Open **`http://localhost:5173/`** in your browser.

### 6. Production Builds

```bash
# Build backend (TypeScript compilation via tsc)
npm run build:backend

# Build frontend (TypeScript check + Vite production bundle)
npm run build:frontend

# Build both simultaneously
npm run build
```

---

## Core API Endpoints

### 1. Orders

* **`GET /api/v1/orders/catalog`**
  Returns available products and server-authoritative prices (`unitPriceMinor: 99900`).
* **`POST /api/v1/orders`**
  Creates an order. Server strictly calculates totals.
  ```json
  // Request
  { "productId": "prod_sample_001", "quantity": 1 }
  // Response (201 Created)
  {
    "success": true,
    "data": {
      "id": "ord_...",
      "productId": "prod_sample_001",
      "quantity": 1,
      "unitPriceMinor": 99900,
      "totalPriceMinor": 99900,
      "currency": "INR",
      "status": "CREATED"
    }
  }
  ```

### 2. Payments

* **`POST /api/v1/payments`**
  Processes a payment attempt. **Requires `Idempotency-Key` header**.
  ```http
  POST /api/v1/payments
  Idempotency-Key: idemp_sample_uuid_12345
  Content-Type: application/json

  {
    "orderId": "ord_...",
    "simulatedOutcome": "SUCCESS",
    "paymentMethod": "UPI"
  }
  ```
  ```json
  // Response (201 Created)
  {
    "success": true,
    "data": {
      "id": "pay_...",
      "paymentReference": "pay_1729420000000_abc123",
      "orderId": "ord_...",
      "amountMinor": 99900,
      "currency": "INR",
      "status": "SUCCEEDED"
    }
  }
  ```
  *Replaying with identical payload returns `HTTP 200` with `Idempotent-Replay: true` header.*
  *Replaying with different payload returns `HTTP 409 Conflict` (`IDEMPOTENCY_PAYLOAD_MISMATCH`).*

* **`POST /api/v1/payments/:id/reconcile`**
  Reconciles an `UNCERTAIN` payment by performing a non-charging inquiry against the provider.
  ```json
  { "resolution": "SUCCESS" }
  ```

### 3. Refunds

* **`POST /api/v1/payments/:id/refunds`**
  Issues a full or partial refund guarded by PostgreSQL row-level locking.
  ```json
  // Request
  { "amountMinor": 40000, "reason": "Customer requested partial return" }
  // Response (201 Created)
  {
    "success": true,
    "data": {
      "id": "ref_...",
      "refundReference": "ref_1729420000000_xyz789",
      "paymentAttemptId": "pay_...",
      "amountMinor": 40000,
      "currency": "INR",
      "status": "SUCCEEDED"
    }
  }
  ```

### 4. Ledger

* **`GET /api/v1/ledger/transactions`**
  Returns immutable double-entry ledger transactions and their balanced entry pairs.
* **`GET /api/v1/ledger/payments/:paymentId`**
  Returns the double-entry journal transaction for a specific payment capture.

### 5. Webhooks

* **`GET /api/v1/webhooks/events`**
  Returns the transactional outbox event queue (`PENDING`, `DELIVERED`, `FAILED`).
* **`POST /api/v1/webhooks/events/:id/deliver`**
  Dispatches an outbox event to a target destination with HMAC-SHA256 signature verification.
  ```json
  { "targetUrl": "http://localhost:4000/api/v1/webhooks/test-target", "forceFail": false }
  ```
* **`POST /api/v1/webhooks/test-target`**
  Built-in sandbox receiver that validates incoming `X-PayFlow-Signature` headers using constant-time equality checks and returns `HTTP 200`.

---

## Render Deployment (Infrastructure as Code)

PayFlow includes a root-level `render.yaml` Blueprint file configured for seamless deployment on Render:

| Service | Type | Plan | Build / Start Command | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **payflow-backend** | Web Service (`node`) | Free | `npm install && npm run prisma:generate && npm run build`<br>`preDeployCommand: npm run prisma:deploy`<br>`npm start` | Binds to `0.0.0.0:$PORT`. Health check at `/api/v1/health`. Non-destructive migrations run via `prisma migrate deploy`. |
| **payflow-frontend** | Static Site (`static`) | Free | `npm install && npm run build`<br>Publish: `./dist` | Single-Page Application rewrites all routes (`/*` &rarr; `/index.html`). |
| **payflow-postgres** | Managed PostgreSQL | Free | Managed by Render | Injects `DATABASE_URL` directly into the backend service. |

> [!WARNING]
> **Render Free Tier Limitations:**
> 1. **PostgreSQL Expiration:** Render free PostgreSQL databases expire and are deleted after **30 days** unless upgraded to a paid plan ($7/mo Starter).
> 2. **Web Service Inactivity:** Free web services spin down after 15 minutes of inactivity; initial cold starts take ~50 seconds.

---

## Test Verification

The test suite contains **68 automated tests** across 9 test suites executed via Vitest against both in-memory unit tests and live PostgreSQL integration tests:

```text
 ✓ tests/state-machine.test.ts      (10 tests)  - Valid & invalid transitions, terminal state immunity
 ✓ tests/ledger.test.ts             (5 tests)   - Debits === Credits invariant, positive integers, formatting
 ✓ tests/webhooks.test.ts           (12 tests)  - HMAC-SHA256 signatures, replay attacks, retry backoff
 ✓ tests/health.test.ts             (1 test)    - Service uptime and health diagnostics
 ✓ tests/orders.test.ts             (6 tests)   - Server pricing enforcement, input validation
 ✓ tests/payments.test.ts           (9 tests)   - Payment lifecycle, decline handling, timeout transitions
 ✓ tests/refunds.test.ts            (8 tests)   - Partial refunds, balance calculation, over-refund blocks
 ✓ tests/idempotency.test.ts        (10 tests)  - Replay caching, payload mismatch 409, concurrency blocks
 ✓ tests/integration.db.test.ts     (7 tests)   - Live PostgreSQL transactions, row locks, outbox dispatch
---------------------------------------------------------------------------------------------------------
 Test Files: 9 passed (9)
 Tests:      68 passed (68)
 Duration:   ~1.8s
```

To run the tests:
```bash
npm --prefix backend test
```

---

## Reliability & Design Decisions

### 1. Why Integer Minor Units (Paise)?
In JavaScript/Node.js, standard numbers are IEEE 754 64-bit floating point numbers. Operations like `0.1 + 0.2` yield `0.30000000000000004`. In financial computing, accumulated floating-point inaccuracies cause accounting drift. PayFlow enforces integer paise: ₹999 is stored strictly as `99900`.

### 2. Why Double-Entry Bookkeeping?
Every financial transaction moves money between two accounts. When a payment of ₹999 is captured:
- **Debit:** `CUSTOMER_FUNDS` (₹999.00 / 99900 paise)
- **Credit:** `MERCHANT_SETTLEMENT` (₹999.00 / 99900 paise)
`Total Debits (99900) === Total Credits (99900)`. This mathematical invariant ensures that money is neither spontaneously created nor destroyed. Duplicate ledger entries for the same payment capture or refund are rejected at the database level by a unique composite constraint (`@@unique([referenceType, referenceId])`).

### 3. Why Row-Level Locking on Refunds?
If a user submits two concurrent partial refund requests of ₹600 on a ₹999 transaction:
Without row locks, both requests could read `totalRefunded = 0`, compute `refundableBalance = 99900`, approve the request, and refund ₹1,200 total (a critical over-refund bug).
PayFlow acquires a row lock inside the database transaction:
```sql
SELECT id FROM payment_attempts WHERE id = $1 FOR UPDATE;
```
This forces concurrent refund attempts to execute sequentially. The second request reads the updated refund sum and is safely rejected with `EXCEEDS_REFUNDABLE_BALANCE`.

### 4. Why an Outbox Pattern for Webhooks?
Calling external merchant endpoints synchronously inside a database transaction is an anti-pattern:
- Network latency stalls database connections and holds row locks.
- If the merchant endpoint fails or times out, rolling back the database transaction would erroneously undo an already-settled customer charge.
PayFlow saves the webhook event directly to PostgreSQL as `PENDING` within the database transaction. Network delivery occurs independently, ensuring that delivery failures never reverse financial operations.

---

## Current Limitations

- **Simulated Payment Provider:** Real credit cards and banking rails (Visa/Mastercard/UPI) are not connected; provider responses are simulated deterministically (`SUCCESS`, `DECLINE`, `TIMEOUT`).
- **No Background Daemon Worker:** In this sandbox, webhooks are dispatched via the interactive **Test Deliver** action or on-demand API calls. A continuous background polling worker (e.g. BullMQ / Redis) is not included in the single-process demo.
- **Single Currency:** The sandbox is configured for `INR` (Indian Rupee) minor units. Multi-currency exchange rate conversions are outside current scope.
- **Not Production Certified:** This is an educational reference implementation and is not certified for PCI-DSS compliant cardholder storage.

---

## Future Improvements

1. **Distributed Queue Worker:** Add BullMQ / Redis to automatically drain the webhook outbox asynchronously with jittered backoff.
2. **Distributed Redis Locks:** Supplement PostgreSQL row-level locks with Redlock for multi-instance horizontal scaling.
3. **Automated Reconciliation Cron:** Implement a scheduled cron job that automatically reconciles `UNCERTAIN` payments after a timeout window.
4. **Merchant Webhook Endpoints Management:** Provide a merchant settings dashboard to register multiple webhook URLs with independent signing secrets.

---

## License

This project is currently private educational source code. All rights reserved. No formal open-source license is granted.
