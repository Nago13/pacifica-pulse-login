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
    let ticker = ''

    if (req.method === 'POST') {
      try {
        const body = await req.json()
        ticker = body?.ticker || 'BTC'
      } catch {
        ticker = 'BTC'
      }
    }
    if (!ticker) {
      const url = new URL(req.url)
      ticker = url.searchParams.get('ticker') || 'BTC'
    }

    const elfaKey = Deno.env.get('ELFA_API_KEY')
    console.log('ELFA_API_KEY present:', !!elfaKey)

    const response = await fetch(
      `https://api.elfa.ai/v2/aggregations/trending-tokens?timeWindow=24h&pageSize=50`,
      { headers: { 'x-elfa-api-key': elfaKey || '' } }
    )

    console.log('Elfa API status:', response.status)
    const rawText = await response.text()
    console.log('Elfa raw response (first 500):', rawText.substring(0, 500))

    let data: any
    try { data = JSON.parse(rawText) } catch { data = null }

    // Structure is { success, data: { total, page, pageSize, data: [...tokens] } }
    let tokens: any[] = []
    if (data?.data?.data && Array.isArray(data.data.data)) tokens = data.data.data
    else if (Array.isArray(data?.data)) tokens = data.data
    else if (Array.isArray(data)) tokens = data

    console.log('Tokens found:', tokens.length)

    const tokenData = tokens.find(
      (t: any) => t.token?.toUpperCase() === ticker.toUpperCase()
    )

    console.log('Token match for', ticker, ':', tokenData ? JSON.stringify(tokenData) : 'not found')

    const mencoes = tokenData?.current_count || tokenData?.mentions || tokenData?.count || tokenData?.mentionCount || 0
    const buzzScore = Math.min(Math.round(mencoes / 10), 100)

    const getLabel = (score: number) => {
      if (score <= 30) return 'Low social activity'
      if (score <= 60) return 'Moderate social activity'
      if (score <= 80) return 'High social activity'
      return 'Explosive social activity'
    }

    const finalScore = buzzScore || 50

    return new Response(
      JSON.stringify({
        score: finalScore,
        label: getLabel(finalScore),
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
