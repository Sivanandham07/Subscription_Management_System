import { createAdminClient } from '../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function TestPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('products').select('name, sales_price')

  if (error) return <pre style={{ padding: 24 }}>Error: {error.message}</pre>

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 'bold' }}>Connected to Supabase</h1>
      <ul>
        {data?.map((p) => (
          <li key={p.name}>{p.name}: {p.sales_price}</li>
        ))}
      </ul>
    </div>
  )
}