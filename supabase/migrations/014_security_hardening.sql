-- =============================================================================
-- KaspaClash Security Hardening Migration
-- Adds rate limiting table and strengthens RLS policies
-- =============================================================================

-- ============================================================================
-- RATE LIMITING TABLE
-- ============================================================================

-- Table for distributed rate limiting (works in serverless)
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL,
    endpoint TEXT NOT NULL DEFAULT 'global',
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, endpoint, window_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_client_window 
    ON rate_limits(client_id, endpoint, window_start);

-- Enable RLS on rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
CREATE POLICY "Rate limits are managed by service role only"
    ON rate_limits
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- RATE LIMIT CHECK FUNCTION (Atomic)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rate_limit(
    p_client_id TEXT,
    p_endpoint TEXT DEFAULT 'global',
    p_window_seconds INTEGER DEFAULT 60,
    p_max_requests INTEGER DEFAULT 60
) RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
    v_window_start TIMESTAMP WITH TIME ZONE;
    v_now TIMESTAMP WITH TIME ZONE;
BEGIN
    v_now := NOW();
    -- Round to the start of the current window
    v_window_start := date_trunc('minute', v_now);
    
    -- Upsert rate limit record (atomic)
    INSERT INTO rate_limits (client_id, endpoint, request_count, window_start)
    VALUES (p_client_id, p_endpoint, 1, v_window_start)
    ON CONFLICT (client_id, endpoint, window_start) 
    DO UPDATE SET request_count = rate_limits.request_count + 1
    RETURNING request_count INTO v_count;
    
    -- Return result
    RETURN jsonb_build_object(
        'allowed', v_count <= p_max_requests,
        'count', v_count,
        'remaining', GREATEST(0, p_max_requests - v_count),
        'reset_at', v_window_start + (p_window_seconds || ' seconds')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    client_ip TEXT,
    user_address TEXT,
    endpoint TEXT,
    success BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying audit logs
CREATE INDEX IF NOT EXISTS idx_audit_log_created 
    ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user 
    ON security_audit_log(user_address) WHERE user_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type 
    ON security_audit_log(event_type);

-- Enable RLS
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/view audit logs
CREATE POLICY "Audit logs are managed by service role only"
    ON security_audit_log
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- AUDIT LOG FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_event_data JSONB DEFAULT '{}',
    p_client_ip TEXT DEFAULT NULL,
    p_user_address TEXT DEFAULT NULL,
    p_endpoint TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true
) RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO security_audit_log (
        event_type, event_data, client_ip, user_address, endpoint, success
    ) VALUES (
        p_event_type, p_event_data, p_client_ip, p_user_address, p_endpoint, p_success
    ) RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CLEANUP FUNCTION (Run periodically)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_rate_limits(
    p_older_than_hours INTEGER DEFAULT 1
) RETURNS INTEGER
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - (p_older_than_hours || ' hours')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION check_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION log_security_event TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_rate_limits TO service_role;
