// In-memory cache for frequently accessed data
// For production, replace with Redis

interface CacheEntry<T> {
  data: T
  expires: number
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>()
  private defaultTTL = 60000 // 1 minute

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expires) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.store.set(key, { data, expires: Date.now() + ttl })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'))
    for (const key of this.store.keys()) {
      if (regex.test(key)) this.store.delete(key)
    }
  }

  clear(): void {
    this.store.clear()
  }

  size(): number {
    return this.store.size
  }
}

export const cache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
  institution: (id: string) => `inst:${id}`,
  institutionStats: (id: string) => `inst:stats:${id}`,
  student: (id: string) => `student:${id}`,
  course: (id: string) => `course:${id}`,
  courses: (instId: string) => `courses:${instId}`,
  users: (instId: string) => `users:${instId}`,
  plans: () => 'plans:all',
  horarios: (instId: string) => `horarios:${instId}`,
}

// Cache TTLs (in milliseconds)
export const cacheTTL = {
  short: 30000,      // 30 seconds - for frequently changing data
  medium: 60000,     // 1 minute - for semi-static data
  long: 300000,      // 5 minutes - for static data
  veryLong: 3600000, // 1 hour - for plans, configurations
}
