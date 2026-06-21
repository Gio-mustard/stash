/**
 * Centralized utility to calculate user's Total Balance (wallet balance + guardaditos + pockets).
 */
export async function getUserTotalBalance(supabase: any, userId: string): Promise<number> {
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: guardaditos } = await supabase
    .from("guardaditos")
    .select("current")
    .eq("user_id", userId);

  const { data: pockets } = await supabase
    .from("pockets")
    .select("balance")
    .eq("user_id", userId);

  const walletBalance = portfolio ? Number(portfolio.balance) : 0;
  const guardaditosBalance = (guardaditos || []).reduce((sum: number, g: any) => sum + Number(g.current), 0);
  const pocketsBalance = (pockets || []).reduce((sum: number, p: any) => sum + Number(p.balance), 0);

  return walletBalance + guardaditosBalance + pocketsBalance;
}

