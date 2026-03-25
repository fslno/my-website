import { useMemo } from 'react';
import { useUser } from './provider';

/**
 * Custom hook to determine if the currently authenticated user has administrator privileges.
 * 
 * It checks against:
 * - Hardcoded admin UIDs
 * - Specific admin email (fslno.dev@gmail.com)
 * - Any email ending with '@example.com' (for testing/staff)
 * 
 * Use this hook instead of manual checks to ensure consistency across the application.
 */
export function useIsAdmin() {
  const { user } = useUser();

  const isAdmin = useMemo(() => {
    if (!user) return false;

    const adminUIDs = [
      'ulyu5w9XtYeVTmceUfOZLZwDQxF2', // Primary Admin 1
      'cge90HsQLwgri3quh6VBIZs4wiP2'  // Primary Admin 2
    ];

    const adminEmails = [
      'fslno.dev@gmail.com',
      'admin@fslno.ca',
      'goal@fslno.ca'
    ];

    return (
      adminUIDs.includes(user.uid) ||
      (user.email && (
        adminEmails.includes(user.email) ||
        user.email.endsWith('@example.com')
      )) || false
    );
  }, [user]);

  return isAdmin;
}
