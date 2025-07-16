-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS session_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS sessions;

-- Create sessions table without the question column
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  admin_password TEXT DEFAULT 'admin123',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create questions table to store multiple questions for a session
CREATE TABLE questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_options table for multiple choice options, linked to questions
CREATE TABLE session_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table, linked to questions
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  voter_name TEXT,
  selected_option_id UUID REFERENCES session_options(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to sessions" ON sessions FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to questions" ON questions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to session_options" ON session_options FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to session_options" ON session_options FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to votes" ON votes FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_questions_session_id ON questions(session_id);
CREATE INDEX idx_session_options_question_id ON session_options(question_id);
CREATE INDEX idx_votes_question_id ON votes(question_id);
CREATE INDEX idx_votes_option_id ON votes(selected_option_id);
