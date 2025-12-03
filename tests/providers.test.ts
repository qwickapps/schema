/**
 * Data Provider Tests
 */

import { JsonDataProvider, CachedDataProvider, MemoryCacheProvider, Model } from '../src';

describe('Data Providers', () => {
  describe('JsonDataProvider', () => {
    test('should get single item by slug', async () => {
      const provider = new JsonDataProvider({
        company: { name: 'QwickApps', founded: 2025 },
        'home-hero': { title: 'Welcome', subtitle: 'Get started' }
      });

      const response = await provider.get('company');
      
      expect(response.data).toBeDefined();
      expect(response.data?.slug).toBe('company');
      expect(response.data?.data.name).toBe('QwickApps');
    });

    test('should select multiple items', async () => {
      const provider = new JsonDataProvider({
        products: [
          { name: 'Product 1', price: 100 },
          { name: 'Product 2', price: 200 }
        ]
      });

      const response = await provider.select('products');
      
      expect(response.data).toHaveLength(2);
      expect(response.data?.[0].data.name).toBe('Product 1');
      expect(response.meta?.total).toBe(2);
    });
  });

  describe('CachedDataProvider', () => {
    const createBaseProvider = () => new JsonDataProvider({
      company: { name: 'QwickApps', founded: 2025 },
      products: [
        { name: 'Product 1', price: 100 },
        { name: 'Product 2', price: 200 }
      ]
    });

    describe('Constructor options', () => {
      test('should work with false (no caching)', async () => {
        const baseProvider = createBaseProvider();
        const cachedProvider = new CachedDataProvider(baseProvider, false);

        // All calls should bypass cache
        const response1 = await cachedProvider.get('company');
        expect(response1.cached).toBe(false); // Base provider returns cached: false
        expect(response1.data?.data.name).toBe('QwickApps');

        const response2 = await cachedProvider.get('company');
        expect(response2.cached).toBe(false);
        expect(response2.data?.data.name).toBe('QwickApps');

        // Cache stats should show no caching
        const stats = cachedProvider.getCacheStats();
        expect(stats.cachingEnabled).toBe(false);
        expect(stats.totalEntries).toBe(0);
      });

      test('should work with true (default MemoryCacheProvider)', async () => {
        const baseProvider = createBaseProvider();
        const cachedProvider = new CachedDataProvider(baseProvider, true);

        // First call - should fetch from base provider
        const response1 = await cachedProvider.get('company');
        expect(response1.cached).toBe(false);
        expect(response1.data?.data.name).toBe('QwickApps');

        // Second call - should return cached result
        const response2 = await cachedProvider.get('company');
        expect(response2.cached).toBe(true);
        expect(response2.data?.data.name).toBe('QwickApps');

        // Cache stats should show caching is enabled
        const stats = cachedProvider.getCacheStats();
        expect(stats.cachingEnabled).toBe(true);
        expect(stats.totalEntries).toBeGreaterThan(0);
      });

      test('should work with config object (MemoryCacheProvider with config)', async () => {
        const baseProvider = createBaseProvider();
        const cachedProvider = new CachedDataProvider(baseProvider, {
          defaultTTL: 1000,
          maxSize: 50,
          enableLogging: false
        });

        // First call - should fetch from base provider
        const response1 = await cachedProvider.get('company');
        expect(response1.cached).toBe(false);
        expect(response1.data?.data.name).toBe('QwickApps');

        // Second call - should return cached result
        const response2 = await cachedProvider.get('company');
        expect(response2.cached).toBe(true);
        expect(response2.data?.data.name).toBe('QwickApps');

        // Cache stats should reflect the config
        const stats = cachedProvider.getCacheStats();
        expect(stats.defaultTTL).toBe(1000);
        expect(stats.maxSize).toBe(50);
      });

      test('should work with custom ICacheProvider', async () => {
        const baseProvider = createBaseProvider();
        const customCache = new MemoryCacheProvider({ maxSize: 10, defaultTtl: 2000 });
        const cachedProvider = new CachedDataProvider(baseProvider, customCache);

        // First call - should fetch from base provider
        const response1 = await cachedProvider.get('company');
        expect(response1.cached).toBe(false);
        expect(response1.data?.data.name).toBe('QwickApps');

        // Second call - should return cached result
        const response2 = await cachedProvider.get('company');
        expect(response2.cached).toBe(true);
        expect(response2.data?.data.name).toBe('QwickApps');
      });
    });

    describe('Caching behavior', () => {
      test('should cache both get and select operations', async () => {
        const baseProvider = createBaseProvider();
        const cachedProvider = new CachedDataProvider(baseProvider, true);

        // Test get caching
        const getResponse1 = await cachedProvider.get('company');
        expect(getResponse1.cached).toBe(false);
        
        const getResponse2 = await cachedProvider.get('company');
        expect(getResponse2.cached).toBe(true);

        // Test select caching
        const selectResponse1 = await cachedProvider.select('products');
        expect(selectResponse1.cached).toBe(false);
        expect(selectResponse1.data).toHaveLength(2);
        
        const selectResponse2 = await cachedProvider.select('products');
        expect(selectResponse2.cached).toBe(true);
        expect(selectResponse2.data).toHaveLength(2);
      });

      test('should respect cache TTL', async () => {
        const baseProvider = createBaseProvider();
        const cachedProvider = new CachedDataProvider(baseProvider, {
          defaultTTL: 10, // Very short TTL
          enableLogging: false
        });

        // First call
        await cachedProvider.get('company');
        
        // Wait for cache to expire
        await new Promise(resolve => setTimeout(resolve, 20));
        
        // Should fetch fresh data
        const response = await cachedProvider.get('company');
        expect(response.cached).toBe(false);
      });

      test('should handle cache clearing', async () => {
        const baseProvider = createBaseProvider();
        const cachedProvider = new CachedDataProvider(baseProvider, true);

        // Cache some data
        await cachedProvider.get('company');
        await cachedProvider.select('products');

        // Verify cached
        let response = await cachedProvider.get('company');
        expect(response.cached).toBe(true);

        // Clear specific cache
        cachedProvider.clearCache('get:company');
        
        // Should fetch fresh data for cleared key
        response = await cachedProvider.get('company');
        expect(response.cached).toBe(false);

        // Clear all cache
        cachedProvider.clearCache();
        
        // All should be fresh
        const selectResponse = await cachedProvider.select('products');
        expect(selectResponse.cached).toBe(false);
      });

      test('should handle manual cache entry setting', async () => {
        const baseProvider = createBaseProvider();
        const cachedProvider = new CachedDataProvider(baseProvider, true);

        // Manually set a cache entry
        const testData = { slug: 'test', modelName: 'Test', data: { name: 'Manual Test' } };
        cachedProvider.setCacheEntryManually('manual-key', testData);

        // Verify stats show the entry
        const stats = cachedProvider.getCacheStats();
        expect(stats.totalEntries).toBeGreaterThan(0);
      });
    });

    describe('No caching behavior', () => {
      test('should not cache when disabled', async () => {
        const baseProvider = createBaseProvider();
        const cachedProvider = new CachedDataProvider(baseProvider, false);

        // Multiple calls should not use cache
        const response1 = await cachedProvider.get('company');
        const response2 = await cachedProvider.get('company');
        
        expect(response1.cached).toBe(false);
        expect(response2.cached).toBe(false);

        // Cache operations should handle no-cache gracefully
        cachedProvider.clearCache();
        cachedProvider.setCacheEntryManually('test', { data: 'test' });
        
        const stats = cachedProvider.getCacheStats();
        expect(stats.cachingEnabled).toBe(false);
      });
    });
  });
});