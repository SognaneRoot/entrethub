-- ═══════════════════════════════════════════════════════════════════
-- ENTRETHUB — Schéma Supabase complet
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ═══════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id      TEXT UNIQUE NOT NULL,
  first_name    TEXT,
  last_name     TEXT,
  email         TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,
  current_job   TEXT,
  seniority     TEXT CHECK (seniority IN ('junior','mid','senior','lead','executive')),
  target_job    TEXT,
  subscription  TEXT NOT NULL DEFAULT 'free' CHECK (subscription IN ('free','premium')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CVS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cvs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Mon CV',
  content     JSONB NOT NULL DEFAULT '{}',
  ats_score   INTEGER CHECK (ats_score BETWEEN 0 AND 100),
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INTERVIEW_SESSIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interview_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_title        TEXT NOT NULL,
  difficulty       TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard','expert')),
  duration_minutes INTEGER,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','abandoned')),
  global_score     INTEGER CHECK (global_score BETWEEN 0 AND 100),
  feedback         TEXT,
  transcript       JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CAREER_GOALS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_goals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('job_search','skill_learning','networking','salary','promotion')),
  description TEXT NOT NULL,
  priority    INTEGER NOT NULL DEFAULT 2 CHECK (priority IN (1,2,3)),
  deadline    DATE,
  progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROGRESS_TRACKING ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress_tracking (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES interview_sessions(id) ON DELETE SET NULL,
  category    TEXT NOT NULL,
  score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  comments    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','reminder')),
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan              TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','cancelled','past_due')),
  expires_at        TIMESTAMPTZ,
  payment_provider  TEXT,
  provider_ref      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies : chaque utilisateur ne voit que ses données
-- (Le service role key bypass ces policies — utilisé uniquement côté serveur)

CREATE POLICY "users_own" ON users FOR ALL USING (clerk_id = current_setting('app.clerk_user_id', TRUE));
CREATE POLICY "cvs_own" ON cvs FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_user_id', TRUE)));
CREATE POLICY "interviews_own" ON interview_sessions FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_user_id', TRUE)));
CREATE POLICY "goals_own" ON career_goals FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_user_id', TRUE)));
CREATE POLICY "progress_own" ON progress_tracking FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_user_id', TRUE)));
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_user_id', TRUE)));
CREATE POLICY "subscriptions_own" ON subscriptions FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_user_id', TRUE)));

-- ─── AUTO-UPDATE timestamps ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cvs_updated_at BEFORE UPDATE ON cvs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER interviews_updated_at BEFORE UPDATE ON interview_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER goals_updated_at BEFORE UPDATE ON career_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── INDEXES ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON career_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
