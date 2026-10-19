// Subscription gating — structured so a paid tier can be added cleanly.
// Rule 3: max three goals per cycle. Rule 4: free users get only one active goal.
export const FREE_GOAL_LIMIT = 1;
export const PAID_GOAL_LIMIT = 3;

export function goalLimit(tier: string) {
  return tier === 'pro' || tier === 'paid' ? PAID_GOAL_LIMIT : FREE_GOAL_LIMIT;
}

export function canAddGoal(currentCount: number, tier: string) {
  return currentCount < goalLimit(tier);
}

export function tierFromUser(user: { data?: { subscription_tier?: string } } | null | undefined) {
  return user?.data?.subscription_tier || 'free';
}