import { AdminService } from '../database/AdminService';

export async function checkAdminAuth(userId: string): Promise<boolean> {
  if (!userId) {
    return false;
  }
  
  try {
    return await AdminService.isUserAdmin(userId);
  } catch (error) {
    console.error('Error checking admin auth:', error);
    return false;
  }
}

export function requireAdmin() {
  return async (userId: string | null): Promise<boolean> => {
    if (!userId) {
      return false;
    }
    
    return await checkAdminAuth(userId);
  };
}