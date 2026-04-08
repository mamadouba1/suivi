import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <NavBar userName={profile?.full_name || user.email || ''} />
      <main className="flex-1 p-4 md:p-8 md:ml-60 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  )
}
