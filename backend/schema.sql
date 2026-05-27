-- ============================================================
-- RIGHTPATH JAMB PRACTICE PLATFORM - DATABASE SCHEMA
-- Compatible with PostgreSQL / Supabase
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  state VARCHAR(100),
  school VARCHAR(255),
  jamb_reg_number VARCHAR(50),
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin', 'superadmin')),
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMPTZ,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMPTZ,
  activation_status VARCHAR(20) DEFAULT 'pending' CHECK (activation_status IN ('pending', 'active', 'expired')),
  activated_at TIMESTAMPTZ,
  activation_expires_at TIMESTAMPTZ,
  profile_photo_url TEXT,
  total_exams_taken INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVATION CODES TABLE
-- ============================================================
CREATE TABLE activation_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  generated_by UUID REFERENCES users(id),
  used_by UUID REFERENCES users(id),
  is_used BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  valid_days INTEGER DEFAULT 30,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  batch_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBJECTS TABLE
-- ============================================================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  is_compulsory BOOLEAN DEFAULT false,
  icon VARCHAR(50),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default JAMB subjects
INSERT INTO subjects (name, code, is_compulsory) VALUES
  ('Use of English', 'ENG', true),
  ('Mathematics', 'MTH', false),
  ('Physics', 'PHY', false),
  ('Chemistry', 'CHE', false),
  ('Biology', 'BIO', false),
  ('Economics', 'ECO', false),
  ('Government', 'GOV', false),
  ('Literature in English', 'LIT', false),
  ('Christian Religious Studies', 'CRS', false),
  ('Islamic Religious Studies', 'IRS', false),
  ('Geography', 'GEO', false),
  ('Agricultural Science', 'AGR', false),
  ('Commerce', 'COM', false),
  ('Accounting', 'ACC', false),
  ('History', 'HIS', false),
  ('Civic Education', 'CIV', false),
  ('Technical Drawing', 'TDD', false),
  ('Food and Nutrition', 'FNT', false),
  ('French', 'FRN', false),
  ('Yoruba', 'YOR', false),
  ('Igbo', 'IGB', false),
  ('Hausa', 'HAU', false);

-- ============================================================
-- QUESTIONS TABLE
-- ============================================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  year INTEGER,
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  times_answered INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  source VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXAM CONFIGURATIONS TABLE
-- ============================================================
CREATE TABLE exam_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  total_questions INTEGER NOT NULL DEFAULT 180,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam Config Subject Mapping
CREATE TABLE exam_config_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_config_id UUID REFERENCES exam_configs(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  question_count INTEGER NOT NULL DEFAULT 40,
  is_compulsory BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0
);

-- Default exam config
INSERT INTO exam_configs (name, description, duration_minutes, total_questions) 
VALUES ('Standard JAMB Mock', 'Full JAMB CBT simulation with 4 subjects', 120, 180);

-- ============================================================
-- EXAM SESSIONS TABLE
-- ============================================================
CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  exam_config_id UUID REFERENCES exam_configs(id),
  selected_subjects UUID[] NOT NULL,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'timed_out', 'abandoned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_remaining_seconds INTEGER,
  total_questions INTEGER NOT NULL,
  answered_questions INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  percentage_score DECIMAL(5,2) DEFAULT 0,
  subject_scores JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  is_reviewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXAM QUESTIONS (questions assigned to a session)
-- ============================================================
CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) NOT NULL,
  subject_id UUID REFERENCES subjects(id) NOT NULL,
  question_order INTEGER NOT NULL,
  shuffled_options JSONB NOT NULL, -- stores shuffled option mapping
  selected_answer CHAR(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  is_flagged BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BADGES TABLE
-- ============================================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  criteria_type VARCHAR(50) NOT NULL,
  criteria_value INTEGER NOT NULL,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO badges (name, description, icon, color, criteria_type, criteria_value, rarity) VALUES
  ('First Step', 'Completed your first mock exam', '🎯', '#4CAF50', 'exams_completed', 1, 'common'),
  ('Five Star', 'Completed 5 mock exams', '⭐', '#FF9800', 'exams_completed', 5, 'common'),
  ('Decade', 'Completed 10 mock exams', '🔟', '#2196F3', 'exams_completed', 10, 'rare'),
  ('Exam Warrior', 'Completed 25 mock exams', '⚔️', '#9C27B0', 'exams_completed', 25, 'rare'),
  ('Top Performer', 'Scored above 80% in any exam', '🏆', '#FFD700', 'single_score', 80, 'rare'),
  ('Excellence', 'Scored above 90% in any exam', '💎', '#00BCD4', 'single_score', 90, 'epic'),
  ('Perfect Score', 'Scored 100% in any exam', '🌟', '#FF4081', 'single_score', 100, 'legendary'),
  ('Consistency Master', 'Maintained 70%+ average over 5 exams', '📈', '#4CAF50', 'average_score', 70, 'rare'),
  ('English Expert', 'Scored 90%+ in English section', '📚', '#3F51B5', 'subject_score_eng', 90, 'epic'),
  ('Science Champion', 'Scored 90%+ in Sciences', '🔬', '#00BCD4', 'subject_score_sci', 90, 'epic'),
  ('Math Genius', 'Scored 90%+ in Mathematics', '🔢', '#FF5722', 'subject_score_mth', 90, 'epic'),
  ('Rising Star', 'Improved score by 20+ points', '🚀', '#FF9800', 'improvement', 20, 'rare'),
  ('Night Owl', 'Completed exam after 10 PM', '🦉', '#607D8B', 'time_of_day', 22, 'common'),
  ('Early Bird', 'Completed exam before 7 AM', '🌅', '#FFEB3B', 'time_of_day', 7, 'common');

-- ============================================================
-- USER BADGES TABLE
-- ============================================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badges(id) NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID REFERENCES exam_sessions(id),
  UNIQUE(user_id, badge_id)
);

-- ============================================================
-- QUESTION UPLOAD BATCHES
-- ============================================================
CREATE TABLE upload_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by UUID REFERENCES users(id),
  subject_id UUID REFERENCES subjects(id),
  filename VARCHAR(255),
  upload_type VARCHAR(20) CHECK (upload_type IN ('pdf', 'json', 'manual')),
  questions_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'badge')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_activation_status ON users(activation_status);
CREATE INDEX idx_activation_codes_code ON activation_codes(code);
CREATE INDEX idx_activation_codes_used_by ON activation_codes(used_by);
CREATE INDEX idx_questions_subject_id ON questions(subject_id);
CREATE INDEX idx_questions_year ON questions(year);
CREATE INDEX idx_questions_is_active ON questions(is_active);
CREATE INDEX idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX idx_exam_questions_session_id ON exam_questions(session_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VIEWS
-- ============================================================
CREATE OR REPLACE VIEW v_student_stats AS
SELECT
  u.id,
  u.full_name,
  u.email,
  u.total_exams_taken,
  u.average_score,
  u.activation_status,
  u.activation_expires_at,
  COUNT(DISTINCT ub.badge_id) AS badge_count,
  MAX(es.percentage_score) AS highest_score,
  MIN(es.percentage_score) AS lowest_score
FROM users u
LEFT JOIN exam_sessions es ON es.user_id = u.id AND es.status = 'submitted'
LEFT JOIN user_badges ub ON ub.user_id = u.id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.email, u.total_exams_taken, u.average_score, u.activation_status, u.activation_expires_at;

CREATE OR REPLACE VIEW v_question_stats AS
SELECT
  q.id,
  q.question_text,
  s.name AS subject_name,
  q.year,
  q.times_answered,
  q.times_correct,
  CASE 
    WHEN q.times_answered > 0 
    THEN ROUND((q.times_correct::DECIMAL / q.times_answered) * 100, 2) 
    ELSE 0 
  END AS success_rate
FROM questions q
JOIN subjects s ON s.id = q.subject_id
WHERE q.is_active = true
ORDER BY success_rate ASC;