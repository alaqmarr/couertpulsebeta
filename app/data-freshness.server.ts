'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateDashboard() {
  // This will revalidate the dashboard page,
  // causing it to refetch data on the next visit.
  // We specify the layout route group '(app)' to ensure it targets correctly.
  revalidatePath('/')
}