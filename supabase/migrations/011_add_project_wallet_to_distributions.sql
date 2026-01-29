-- 011_add_project_wallet_to_distributions.sql
-- Add project wallet tracking to treasury distributions
-- Changes the 20% reserve to go to designated project wallets

-- Add project wallet columns to treasury_distributions
ALTER TABLE public.treasury_distributions
ADD COLUMN project_wallet_amount bigint DEFAULT 0 CHECK (project_wallet_amount >= 0),
ADD COLUMN project_wallet_address text;

-- Add comment to clarify the new distribution model
COMMENT ON COLUMN public.treasury_distributions.project_wallet_amount IS 'Amount sent to project wallet (20% of distributable balance)';
COMMENT ON COLUMN public.treasury_distributions.project_wallet_address IS 'Network-specific project wallet address that received the funds';
COMMENT ON COLUMN public.treasury_distributions.reserve_amount IS 'Amount kept in treasury for fees (minimum 10 KAS)';
