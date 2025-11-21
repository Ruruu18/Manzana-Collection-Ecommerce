-- Check if the policy has WITH CHECK clause
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'orders'
  AND policyname = 'admin_update_all_orders';
