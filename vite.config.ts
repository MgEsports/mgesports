import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = path.resolve(__dirname, 'data', 'db.json')

function readDb(): Record<string, any> {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
    }
  } catch {}
  return { media: [], tournaments: [], news: [], partners: [], orders: [] }
}

function writeDb(db: Record<string, any>) {
  try {
    const dir = path.dirname(DB_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to write db.json:', err)
  }
}

function sendJson(res: any, status: number, data: any) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.end(JSON.stringify(data))
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: any) => { body += chunk })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function localDatabasePlugin(): Plugin {
  return {
    name: 'local-database-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlStr = req.url || ''
        if (!urlStr.startsWith('/api')) {
          return next()
        }

        const method = (req.method || 'GET').toUpperCase()

        if (method === 'OPTIONS') {
          return sendJson(res, 204, {})
        }

        const pathname = urlStr.split('?')[0].replace(/^\/api/, '')

        // 1. Auth routes
        if (pathname === '/auth/login' || pathname === '/auth/register') {
          return sendJson(res, 200, {
            success: true,
            token: 'mg-admin-token-local',
            user: {
              id: 'admin-1',
              email: 'admin@mgesports.in',
              role: 'ADMIN',
              fullName: 'MG Administrator',
            },
          })
        }
        if (pathname === '/auth/me') {
          return sendJson(res, 200, {
            success: true,
            user: {
              id: 'admin-1',
              email: 'admin@mgesports.in',
              role: 'ADMIN',
              fullName: 'MG Administrator',
            },
          })
        }

        // 1b. Site Settings route
        if (pathname === '/settings') {
          const db = readDb()
          if (method === 'GET') {
            return sendJson(res, 200, { success: true, data: db.settings || {} })
          }
          if (method === 'PUT' || method === 'POST') {
            const body = await parseJsonBody(req)
            db.settings = { ...(db.settings || {}), ...body }
            writeDb(db)
            return sendJson(res, 200, { success: true, message: 'Settings updated successfully', data: db.settings })
          }
        }

        // 1c. Backup & Restore routes
        if (pathname === '/admin/backup/export' || pathname === '/backup/export') {
          const db = readDb()
          return sendJson(res, 200, {
            success: true,
            data: {
              version: '2.0',
              organization: 'MG Esports',
              exportedAt: new Date().toISOString(),
              settings: db.settings || {},
              tournaments: db.tournaments || [],
              media: db.media || [],
              news: db.news || [],
              partners: db.partners || [],
              partnerPlans: db.partnerPlans || [],
              players: db.players || [],
              legends: db.legends || [],
              products: db.products || [],
              votingEvents: db.votingEvents || [],
            }
          })
        }

        if ((pathname === '/admin/backup/import' || pathname === '/backup/import') && (method === 'POST' || method === 'PUT')) {
          const body = await parseJsonBody(req)
          const mode = body.mode || 'merge'
          const d = body.data || body
          const db = readDb()

          if (d.settings && typeof d.settings === 'object') {
            db.settings = mode === 'replace' ? d.settings : { ...(db.settings || {}), ...d.settings }
          }
          const listKeys = ['tournaments', 'media', 'news', 'partners', 'partnerPlans', 'players', 'legends', 'products', 'votingEvents']
          for (const k of listKeys) {
            if (Array.isArray(d[k])) {
              db[k] = mode === 'replace' ? d[k] : [...(Array.isArray(db[k]) ? db[k] : []), ...d[k]]
            }
          }
          writeDb(db)
          return sendJson(res, 200, { success: true, message: 'Backup imported successfully' })
        }

        // 1d. Order Management & Tracking Routes
        if (pathname === '/orders/track') {
          const db = readDb()
          const orders = Array.isArray(db.orders) ? db.orders : []
          const rawQuery = urlStr.includes('?') ? new URLSearchParams(urlStr.split('?')[1]).get('query') || '' : ''
          const clean = rawQuery.trim().toUpperCase()
          const cleanDigits = rawQuery.replace(/[^0-9]/g, '')

          if (!clean) {
            return sendJson(res, 200, { success: true, data: [] })
          }

          const matched = orders.filter((o: any) => {
            if (!o) return false
            const ordNum = (o.orderNumber || '').toUpperCase()
            const phone = (o.customerPhone || '').replace(/[^0-9]/g, '')
            const email = (o.customerEmail || '').toUpperCase()
            const tracking = (o.trackingNumber || '').toUpperCase()

            if (ordNum === clean || ordNum.includes(clean)) return true
            if (clean.startsWith('MG-') && ordNum.includes(clean.replace(/^MG-/, ''))) return true
            if (clean.startsWith('LZ-') && ordNum.includes(clean.replace(/^LZ-/, ''))) return true
            if (email === clean) return true
            if (tracking && tracking.includes(clean)) return true
            if (cleanDigits.length >= 6 && phone.includes(cleanDigits)) return true
            return false
          })

          return sendJson(res, 200, { success: true, data: matched })
        }

        if (pathname === '/orders/my-orders') {
          const db = readDb()
          return sendJson(res, 200, { success: true, data: Array.isArray(db.orders) ? db.orders : [] })
        }

        if (pathname.startsWith('/orders/') && pathname.endsWith('/status') && (method === 'PUT' || method === 'POST')) {
          const parts = pathname.split('/')
          const targetId = decodeURIComponent(parts[2] || '')
          const body = await parseJsonBody(req)
          const db = readDb()
          const orders = Array.isArray(db.orders) ? db.orders : []
          let updatedOrder: any = null

          db.orders = orders.map((o: any) => {
            if (o.id === targetId || o.orderNumber === targetId) {
              updatedOrder = { ...o, ...body, updatedAt: new Date().toISOString() }
              return updatedOrder
            }
            return o
          })

          if (!updatedOrder) {
            updatedOrder = { id: targetId, ...body, updatedAt: new Date().toISOString() }
            db.orders = [updatedOrder, ...db.orders]
          }

          writeDb(db)
          return sendJson(res, 200, { success: true, message: 'Order status updated', data: updatedOrder })
        }

        if (pathname === '/orders' && method === 'POST') {
          const body = await parseJsonBody(req)
          const db = readDb()
          const orders = Array.isArray(db.orders) ? db.orders : []
          const randomSuffix = Math.floor(1000 + Math.random() * 9000)
          const orderNumber = body.orderNumber || `MG-${new Date().getFullYear()}-${randomSuffix}`

          const newOrder = {
            id: body.id || `ord-${Date.now()}`,
            orderNumber,
            productName: body.productName || 'MG PRO COMBAT JERSEY 2026',
            customerName: body.customerName || 'Fan',
            customerEmail: body.customerEmail || 'fan@mgesports.in',
            customerPhone: body.customerPhone || '',
            address: body.address || '',
            city: body.city || 'Chennai',
            state: body.state || 'Tamil Nadu',
            pincode: body.pincode || '600001',
            size: body.size || 'L',
            totalAmount: Number(body.totalAmount) || 1299,
            paymentMethod: body.paymentMethod || 'UPI',
            paymentStatus: body.paymentStatus || (body.paymentMethod === 'UPI' ? 'PENDING_VERIFICATION' : 'COD_PENDING'),
            orderStatus: body.orderStatus || 'PENDING',
            ...body,
            createdAt: new Date().toISOString(),
          }

          db.orders = [newOrder, ...orders]
          writeDb(db)
          return sendJson(res, 201, { success: true, message: 'Order created successfully', data: newOrder })
        }

        // 2. Resource Collections: /media, /tournaments, /news, /partners
        const match = pathname.match(/^\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?/)
        if (!match) {
          return sendJson(res, 404, { success: false, message: 'Not found' })
        }

        const resource = match[1]
        const id = match[2]
        const db = readDb()
        const collection = Array.isArray(db[resource]) ? db[resource] : []

        // GET Collection or Single Item
        if (method === 'GET') {
          const isBtr = (item: any) => {
            const t = ((item && (item.title || item.name || item.id)) || '').toLowerCase()
            return t.includes('btr') || t.includes('1 v 3') || t.includes('1v3') || t.includes('international lobby')
          }
          const filtered = resource === 'media' ? collection.filter((x: any) => !isBtr(x)) : collection
          if (id) {
            const item = filtered.find((x: any) => x.id === id || x.slug === id)
            return sendJson(res, 200, { success: true, data: item || null })
          }
          return sendJson(res, 200, { success: true, data: filtered })
        }

        // POST Create Item
        if (method === 'POST') {
          const body = await parseJsonBody(req)
          const newItem = {
            id: body.id || `${resource}-${Date.now()}`,
            ...body,
            createdAt: new Date().toISOString(),
          }
          db[resource] = [newItem, ...collection]
          writeDb(db)
          return sendJson(res, 201, { success: true, data: newItem })
        }

        // PUT Update Item
        if (method === 'PUT' && id) {
          const body = await parseJsonBody(req)
          let updatedItem: any = null
          db[resource] = collection.map((x: any) => {
            if (x.id === id || x.slug === id) {
              updatedItem = { ...x, ...body, updatedAt: new Date().toISOString() }
              return updatedItem
            }
            return x
          })
          if (!updatedItem) {
            updatedItem = { id, ...body }
            db[resource] = [updatedItem, ...db[resource]]
          }
          writeDb(db)
          return sendJson(res, 200, { success: true, data: updatedItem })
        }

        // DELETE Remove Item
        if (method === 'DELETE' && id) {
          const decodedId = decodeURIComponent(id).toLowerCase()
          if (id === 'all') {
            db[resource] = []
            writeDb(db)
            return sendJson(res, 200, { success: true, message: `All ${resource} deleted` })
          }
          db[resource] = collection.filter((x: any) => {
            const xId = (x.id || '').toLowerCase()
            const xTitle = (x.title || x.name || '').toLowerCase()
            if (xId === id.toLowerCase() || xId === decodedId) return false
            if (x.slug && x.slug.toLowerCase() === decodedId) return false
            if (decodedId.length > 3 && xTitle.includes(decodedId)) return false
            if (xTitle.includes('btr') || xTitle.includes('1 v 3') || xTitle.includes('international lobby')) return false
            return true
          })
          writeDb(db)
          return sendJson(res, 200, { success: true })
        }

        return next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), localDatabasePlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
