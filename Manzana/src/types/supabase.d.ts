// Type declaration to help TypeScript resolve supabase module
declare module '../../services/supabase' {
  export const supabase: any;
  export const isDevMode: boolean;
  export const handleSupabaseError: (error: any) => any;
  export const isAuthenticated: () => Promise<boolean>;
  export const getCurrentUser: () => Promise<any>;
  export default any;
}