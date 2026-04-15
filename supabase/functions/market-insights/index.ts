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
    let symbol = 'BTC'
    let interval = '15m'

    if (req.method === 'POST') {
      try {
        const body = await req.json()
        symbol = (body?.symbol || 'BTC').toUpperCase()
        interval = body?.interval || '15m'
      } catch { /* use defaults */ }
    }

    // Fetch prices from Pacifica
    const pricesRes = await fetch('https://app.pacifica.fi/api/v1/info/prices')
    const pricesJson = await pricesRes.json()
    const items: any[] = pricesJson?.data ?? pricesJson ?? []
    const asset = items.find((i: any) => (i.symbol ?? '').toUpperCase() === symbol)

    if (!asset) {
      return new Response(
        JSON.stringify({ error: 'Asset not found', symbol }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const mark = parseFloat(asset.mark) || 0
    const yesterdayPrice = parseFloat(asset.yesterday_price) || 0
    const change24h = yesterdayPrice > 0 ? ((mark - yesterdayPrice) / yesterdayPrice) * 100 : 0
    const funding = asset.funding ?? '0'
    const openInterest = asset.open_interest ?? '0'
    const volume24h = asset.volume_24h ?? '0'

    // Generate synthetic candle data based on interval
    const intervalMs: Record<string, number> = {
      '1m': 60_000, '5m': 300_000, '15m': 900_000, '1h': 3_600_000, '4h': 14_400_000
    }
    const step = intervalMs[interval] || 900_000
    const numCandles = 50
    const now = Date.now()
    const volatility = Math.abs(change24h) / 100 * 0.15 || 0.002

    const candles = []
    for (let i = numCandles - 1; i >= 0; i--) {
      const t = now - i * step
      const progress = (numCandles - 1 - i) / (numCandles - 1)
      const basePrice = yesterdayPrice + (mark - yesterdayPrice) * progress
      const noise = basePrice * volatility * (Math.sin(i * 1.7) * 0.6 + Math.cos(i * 2.3) * 0.4)
      const close = basePrice + noise
      const high = close * (1 + Math.random() * volatility * 0.5)
      const low = close * (1 - Math.random() * volatility * 0.5)
      const open = i === numCandles - 1 ? yesterdayPrice : candles[candles.length - 1]?.close || close
      candles.push({ t, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2) })
    }

    // Compute 24h high/low from candles
    const high24h = Math.max(...candles.map(c => c.high))
    const low24h = Math.min(...candles.map(c => c.low))

    // Fetch social mentions from Elfa
    let mentions: any[] = []
    try {
      const elfaKey = Deno.env.get('ELFA_API_KEY')
      if (elfaKey) {
        const elfaRes = await fetch(
          `https://api.elfa.ai/v2/mentions?keywords=${symbol}&timeWindow=24h&pageSize=5`,
          { headers: { 'x-elfa-api-key': elfaKey } }
        )
        if (elfaRes.ok) {
          const elfaData = await elfaRes.json()
          const rawMentions = elfaData?.data?.data ?? elfaData?.data ?? []
          mentions = rawMentions.map((m: any) => ({
            text: m.content || m.text || '',
            likes: m.metrics?.likeCount ?? m.likes ?? 0,
            author: m.author?.username ?? m.username ?? 'unknown',
          }))
        }
      }
    } catch (e) {
      console.error('Elfa mentions error:', e)
    }

    return new Response(
      JSON.stringify({
        symbol,
        price: mark,
        change24h: +change24h.toFixed(2),
        high24h,
        low24h,
        fundingRate: funding,
        openInterest,
        volume24h,
        candles,
        mentions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('market-insights error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
