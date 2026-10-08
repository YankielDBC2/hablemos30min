CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE IF NOT EXISTS app_settings (id boolean PRIMARY KEY DEFAULT true CHECK(id), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS bookings (
 id uuid PRIMARY KEY, kind text NOT NULL DEFAULT 'booking' CHECK(kind IN ('booking','block')), idempotency_key uuid UNIQUE NOT NULL, payload_hash text NOT NULL,
 customer_name text NOT NULL, email text NOT NULL, phone text NOT NULL, topic text NOT NULL, notes text NOT NULL DEFAULT '', admin_notes text NOT NULL DEFAULT '',
 start_at timestamptz NOT NULL, end_at timestamptz NOT NULL, blocked_until timestamptz NOT NULL, timezone text NOT NULL,
 meeting_type text NOT NULL, meeting_url text NOT NULL DEFAULT '', host_name text NOT NULL, admin_email text NOT NULL,
 status text NOT NULL DEFAULT 'held' CHECK(status IN ('held','confirmed','payment_review','completed','no_show','cancelled','expired')),
 payment_status text NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','paid','review')),
 price_cents integer NOT NULL DEFAULT 4900 CHECK(price_cents=4900), currency text NOT NULL DEFAULT 'usd' CHECK(currency='usd'),
 stripe_session_id text UNIQUE, hold_expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz,
 CHECK(kind='block' OR end_at=start_at+interval '30 minutes'), CHECK(end_at>start_at), CHECK(blocked_until>=end_at),
 EXCLUDE USING gist (tstzrange(start_at,blocked_until,'[)') WITH &&) WHERE (status IN ('held','confirmed','payment_review'))
);
CREATE INDEX IF NOT EXISTS bookings_start_idx ON bookings(start_at);
CREATE TABLE IF NOT EXISTS notifications (
 id uuid PRIMARY KEY, booking_id uuid NOT NULL REFERENCES bookings(id), kind text NOT NULL, recipient text NOT NULL,
 due_at timestamptz NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed','skipped')),
 attempts integer NOT NULL DEFAULT 0, lease_token uuid, lease_until timestamptz, sent_at timestamptz, last_error text, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(booking_id,kind,recipient)
);
CREATE INDEX IF NOT EXISTS notifications_due_idx ON notifications(due_at) WHERE status IN ('pending','sending');
CREATE TABLE IF NOT EXISTS audit_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, action text NOT NULL, details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, count integer NOT NULL, reset_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS rate_limits_reset_idx ON rate_limits(reset_at);
