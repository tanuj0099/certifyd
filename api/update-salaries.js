import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)
const SCRIPT_PATH = path.join(process.cwd(), 'scraper.py')
const MAX_DURATION_MS = 300000 // 5 minutes
const MAX_BUFFER = 20 * 1024 * 1024

async function runScraper(command) {
  return execAsync(command, {
    timeout: MAX_DURATION_MS,
    maxBuffer: MAX_BUFFER,
  })
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers['authorization']
  const isVercelCron = req.headers['x-vercel-cron'] === '1'

  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!process.env.CRON_SECRET) {
    return res.status(500).json({ error: 'Server misconfiguration: CRON_SECRET is missing' })
  }

  try {
    const pythonCmd = process.env.PYTHON || 'python3'
    let result

    try {
      result = await runScraper(`${pythonCmd} "${SCRIPT_PATH}"`)
    } catch (err) {
      if (err.code === 'ENOENT' && pythonCmd !== 'python') {
        result = await runScraper(`python "${SCRIPT_PATH}"`)
      } else {
        throw err
      }
    }

    return res.status(200).json({
      success: true,
      output: result.stdout,
      errors: result.stderr || null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stderr: error.stderr || null,
      timestamp: new Date().toISOString(),
    })
  }
}
