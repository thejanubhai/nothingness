-- Migration: Kinkster Onboarding Answers & Lifestyle Questionnaire
ALTER TABLE kinkster_profiles ADD COLUMN IF NOT EXISTS onboarding_answers JSONB DEFAULT '{}'::jsonb;
