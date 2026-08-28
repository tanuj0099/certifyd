-- Create table for storing push subscriptions
CREATE TABLE IF NOT EXISTS ops_push_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_email TEXT NOT NULL,
    subscription_object JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_email, subscription_object)
);

-- Set up Row Level Security
ALTER TABLE ops_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can insert and read their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
ON ops_push_subscriptions FOR INSERT
WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can read their own subscriptions"
ON ops_push_subscriptions FOR SELECT
USING (auth.email() = user_email);

CREATE POLICY "Users can delete their own subscriptions"
ON ops_push_subscriptions FOR DELETE
USING (auth.email() = user_email);

-- Super admin can read all subscriptions (optional, but good for admin)
CREATE POLICY "Super admins can read all subscriptions"
ON ops_push_subscriptions FOR SELECT
USING (
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE email = auth.email()) = 'SUPER_ADMIN'
  OR 
  auth.email() = 'admin@certifyd.in'
);
