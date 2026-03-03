import { TelinfyProvider, TelinfyProviderConfig } from './telinfy.provider';
import { NodemailerProvider, NodemailerProviderConfig } from './nodemailer.provider';
import { projectConfigService, ResolvedTelinfyConfig, ResolvedSmtpConfig } from '../services/project-config.service';
import { logger } from '../utils/logger';

/**
 * Cache entry wrapping a provider instance with metadata.
 */
interface CacheEntry<T> {
    provider: T;
    createdAt: number;
    lastAccessedAt: number;
}

/**
 * LRU-style cache configuration.
 */
interface CacheConfig {
    maxSize: number;       // Max number of cached providers
    ttlMs: number;         // Time-to-live in milliseconds
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
    maxSize: 20,
    ttlMs: 10 * 60 * 1000, // 10 minutes
};

/**
 * ProviderFactory — creates and caches provider instances per project.
 * 
 * Instead of using singleton providers, services call:
 *   const telinfyProvider = await providerFactory.getTelinfyProvider(projectId);
 *   const emailProvider = await providerFactory.getNodemailerProvider(projectId);
 * 
 * The factory:
 * 1. Checks an in-memory LRU cache (keyed by projectId)
 * 2. On miss → loads resolved config from ProjectConfigService → creates provider → caches
 * 3. Returns the provider instance
 * 
 * Cache invalidation:
 * - TTL-based: entries expire after 10 minutes
 * - Explicit: call invalidate(projectId) when config is updated
 * - LRU eviction: when cache is full, least-recently-accessed entry is evicted
 */
class ProviderFactory {
    private telinfyCache = new Map<string, CacheEntry<TelinfyProvider>>();
    private nodemailerCache = new Map<string, CacheEntry<NodemailerProvider>>();
    private cacheConfig: CacheConfig;

    constructor(cacheConfig?: Partial<CacheConfig>) {
        this.cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...cacheConfig };
    }

    /**
     * Get a TelinfyProvider configured for the given project.
     */
    async getTelinfyProvider(projectId: string): Promise<TelinfyProvider> {
        // Check cache
        const cached = this.telinfyCache.get(projectId);
        if (cached && !this.isExpired(cached)) {
            cached.lastAccessedAt = Date.now();
            return cached.provider;
        }

        // Cache miss — resolve config and create provider
        logger.info('Creating TelinfyProvider for project (cache miss)', { projectId });
        const resolvedConfig = await projectConfigService.resolveTelinfyConfig(projectId);

        if (!resolvedConfig.apiKey) {
            throw new Error(`No Telinfy API key configured for project ${projectId} and no default set`);
        }

        const provider = new TelinfyProvider(resolvedConfig);

        // Evict if full
        this.evictIfNeeded(this.telinfyCache);

        this.telinfyCache.set(projectId, {
            provider,
            createdAt: Date.now(),
            lastAccessedAt: Date.now(),
        });

        return provider;
    }

    /**
     * Get a NodemailerProvider configured for the given project.
     */
    async getNodemailerProvider(projectId: string): Promise<NodemailerProvider> {
        // Check cache
        const cached = this.nodemailerCache.get(projectId);
        if (cached && !this.isExpired(cached)) {
            cached.lastAccessedAt = Date.now();
            return cached.provider;
        }

        // Cache miss — resolve config and create provider
        logger.info('Creating NodemailerProvider for project (cache miss)', { projectId });
        const resolvedConfig = await projectConfigService.resolveSmtpConfig(projectId);

        if (!resolvedConfig.host || !resolvedConfig.user) {
            throw new Error(`No SMTP configuration for project ${projectId} and no default set`);
        }

        const provider = new NodemailerProvider(resolvedConfig);

        // Evict if full (close transporter on eviction)
        this.evictIfNeeded(this.nodemailerCache, (entry) => {
            entry.provider.close();
        });

        this.nodemailerCache.set(projectId, {
            provider,
            createdAt: Date.now(),
            lastAccessedAt: Date.now(),
        });

        return provider;
    }

    /**
     * Invalidate cached providers for a project (call after config update).
     */
    invalidate(projectId: string): void {
        logger.info('Invalidating provider cache for project', { projectId });

        this.telinfyCache.delete(projectId);

        const nodemailerEntry = this.nodemailerCache.get(projectId);
        if (nodemailerEntry) {
            nodemailerEntry.provider.close();
            this.nodemailerCache.delete(projectId);
        }
    }

    /**
     * Clear all cached providers.
     */
    clearAll(): void {
        this.telinfyCache.clear();
        for (const [, entry] of this.nodemailerCache) {
            entry.provider.close();
        }
        this.nodemailerCache.clear();
        logger.info('All provider caches cleared');
    }

    /**
     * Get cache stats (for monitoring).
     */
    getStats() {
        return {
            telinfy: {
                size: this.telinfyCache.size,
                maxSize: this.cacheConfig.maxSize,
            },
            nodemailer: {
                size: this.nodemailerCache.size,
                maxSize: this.cacheConfig.maxSize,
            },
        };
    }

    private isExpired<T>(entry: CacheEntry<T>): boolean {
        return Date.now() - entry.createdAt > this.cacheConfig.ttlMs;
    }

    private evictIfNeeded<T>(
        cache: Map<string, CacheEntry<T>>,
        onEvict?: (entry: CacheEntry<T>) => void
    ): void {
        if (cache.size < this.cacheConfig.maxSize) return;

        // Find the least-recently-accessed entry
        let oldestKey: string | null = null;
        let oldestAccess = Infinity;

        for (const [key, entry] of cache) {
            if (entry.lastAccessedAt < oldestAccess) {
                oldestAccess = entry.lastAccessedAt;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            const evicted = cache.get(oldestKey);
            if (evicted && onEvict) onEvict(evicted);
            cache.delete(oldestKey);
            logger.info('Evicted provider from cache', { projectId: oldestKey });
        }
    }
}

export const providerFactory = new ProviderFactory();
