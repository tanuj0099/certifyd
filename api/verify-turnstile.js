export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.TURNSTILE_SECRET_KEY
  const token = req.body?.token

  if (!secret) {
    return res.status(200).json({ success: true, skipped: true })
  }

  if (!token || token === 'turnstile-disabled') {
    return res.status(400).json({ success: false, error: 'Human verification required' })
  }

  const form = new URLSearchParams()
  form.append('secret', secret)
  form.append('response', token)

  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })

  const result = await verifyRes.json()
  if (!result.success) {
    return res.status(400).json({ success: false, error: 'Human verification failed' })
  }

  return res.status(200).json({ success: true })
}
