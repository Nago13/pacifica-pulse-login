import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    let ticker = url.searchParams.get('ticker') || ''

    // Also accept ticker from JSON body
    if (!ticker && req.method === 'POST') {
      try {
        const body = await req.json()
        ticker = body?.ticker || 'BTC'
      } catch {
        ticker = 'BTC'
      }
    }
    if (!ticker) ticker = 'BTC'

    const elfaKey = Deno.env.get('ELFA_API_KEY')
    console.log('ELFA_API_KEY present:', !!elfaKey)

    const response = await fetch(
      `https://api.elfa.ai/v2/aggregations/trending-tokens?timeWindow=24h&pageSize=50`,
      { headers: { 'x-elfa-api-key': elfaKey || '' } }
    )

    console.log('Elfa API status:', response.status)
    const data = await response.json()

    const tokenData = data?.data?.find(
      (t: any) =>
        t.token?.toUpperCase() === ticker.toUpperCase() ||
        t.symbol?.toUpperCase() === ticker.toUpperCase()
    )

    const mencoes = tokenData?.mentions || tokenData?.count || tokenData?.mentionCount || 0
    const buzzScore = Math.min(Math.round(mencoes / 10), 100)

    const getText = (score: number) => {
      if (score <= 30) return 'Baixa atividade nas redes'
      if (score <= 60) return 'Atividade moderada nas redes'
      if (score <= 80) return 'Alta atividade nas redes'
      return 'Atividade explosiva nas redes'
    }

    const finalScore = buzzScore || 50

    return new Response(
      JSON.stringify({
        score: finalScore,
        label: getText(finalScore),
        raw: tokenData || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ score: 50, label: 'Atividade moderada nas redes' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
