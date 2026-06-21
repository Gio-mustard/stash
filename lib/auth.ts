import "server-only";
import { createClient } from "@/lib/supabase";

/**
 * Server-side authentication utility to verify user session authenticity.
 */
export const auth = {
  /**
   * Verifies that the current request is from an authenticated user.
   *
   * @returns A promise resolving to true if the session is valid, false otherwise.
   */
  async verify(): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  },
};
