import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  IAIProvider,
  AIProviderConfig,
  AIProviderType,
  AIProviderStatus,
} from '../interfaces/ai-provider.interface';
import { OpenAIProvider } from '../providers/openai.provider';
import { AnthropicProvider } from '../providers/anthropic.provider';
import { GeminiProvider } from '../providers/gemini.provider';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Service for managing AI provider registration, configuration, and lifecycle
 */
@Injectable()
export class AIProviderRegistryService {
  private readonly logger = new Logger(AIProviderRegistryService.name);
  private readonly providers = new Map<string, IAIProvider>();
  private readonly encryptionKey: Buffer;
  private readonly encryptionIV: Buffer;

  constructor(private readonly prisma: PrismaService) {
    // Initialize encryption for API keys (in production, use proper key management)
    this.encryptionKey = Buffer.from(
      process.env.AI_ENCRYPTION_KEY || randomBytes(32).toString('hex').slice(0, 32),
    );
    this.encryptionIV = Buffer.from(
      process.env.AI_ENCRYPTION_IV || randomBytes(16).toString('hex').slice(0, 16),
    );
  }

  /**
   * Initialize and load all active providers from database
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing AI provider registry');

    try {
      const providerConfigs = await this.prisma.aIProvider.findMany({
        where: { isActive: true },
      });

      for (const config of providerConfigs) {
        await this.registerProvider(this.mapDatabaseToConfig(config));
      }

      this.logger.log(`Loaded ${this.providers.size} AI providers`);
    } catch (error) {
      this.logger.error(`Failed to initialize providers: ${error.message}`);
    }
  }

  /**
   * Register a new AI provider
   */
  async registerProvider(config: AIProviderConfig): Promise<IAIProvider> {
    try {
      this.logger.log(`Registering provider: ${config.name} (${config.type})`);

      // Create provider instance based on type
      const provider = this.createProvider(config);

      // Initialize the provider
      await provider.initialize();

      // Validate configuration
      const isValid = await provider.validateConfig();
      if (!isValid) {
        throw new Error(`Provider validation failed for ${config.name}`);
      }

      // Store in memory
      this.providers.set(config.id, provider);

      // Persist to database if not exists
      await this.saveProviderToDatabase(config);

      this.logger.log(`Successfully registered provider: ${config.name}`);
      return provider;
    } catch (error) {
      this.logger.error(`Failed to register provider ${config.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unregister a provider
   */
  async unregisterProvider(providerId: string): Promise<void> {
    this.logger.log(`Unregistering provider: ${providerId}`);

    this.providers.delete(providerId);

    await this.prisma.aIProvider.update({
      where: { id: providerId },
      data: { isActive: false },
    });
  }

  /**
   * Get a provider by ID
   */
  getProvider(providerId: string): IAIProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new NotFoundException(`Provider not found: ${providerId}`);
    }
    return provider;
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): IAIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers by type
   */
  getProvidersByType(type: AIProviderType): IAIProvider[] {
    return this.getAllProviders().filter((p) => p.type === type);
  }

  /**
   * Get active and healthy providers
   */
  async getHealthyProviders(): Promise<IAIProvider[]> {
    const providers = this.getAllProviders();
    const healthChecks = await Promise.all(
      providers.map(async (p) => ({
        provider: p,
        health: await p.healthCheck(),
      })),
    );

    return healthChecks.filter((h) => h.health.healthy).map((h) => h.provider);
  }

  /**
   * Update provider configuration
   */
  async updateProvider(
    providerId: string,
    updates: Partial<AIProviderConfig>,
  ): Promise<IAIProvider> {
    const provider = this.getProvider(providerId);
    const currentConfig = provider.config;

    const updatedConfig: AIProviderConfig = {
      ...currentConfig,
      ...updates,
      id: currentConfig.id, // Prevent ID change
    };

    // Unregister old provider
    await this.unregisterProvider(providerId);

    // Register with new config
    return this.registerProvider(updatedConfig);
  }

  /**
   * Perform health check on all providers
   */
  async healthCheckAll(): Promise<
    Array<{ providerId: string; name: string; healthy: boolean; message?: string }>
  > {
    const providers = this.getAllProviders();
    const results = await Promise.all(
      providers.map(async (provider) => {
        const health = await provider.healthCheck();
        return {
          providerId: provider.config.id,
          name: provider.config.name,
          healthy: health.healthy,
          message: health.message,
        };
      }),
    );

    return results;
  }

  /**
   * Encrypt API key for secure storage
   */
  private encryptApiKey(apiKey: string): string {
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, this.encryptionIV);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt API key from storage
   */
  private decryptApiKey(encryptedKey: string): string {
    const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, this.encryptionIV);
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Create provider instance based on type
   */
  private createProvider(config: AIProviderConfig): IAIProvider {
    switch (config.type) {
      case AIProviderType.OPENAI:
        return new OpenAIProvider(config);
      case AIProviderType.ANTHROPIC:
        return new AnthropicProvider(config);
      case AIProviderType.GOOGLE:
        return new GeminiProvider(config);
      default:
        throw new Error(`Unsupported provider type: ${config.type}`);
    }
  }

  /**
   * Save provider configuration to database
   */
  private async saveProviderToDatabase(config: AIProviderConfig): Promise<void> {
    const encryptedApiKey = this.encryptApiKey(config.apiKey);

    const settings = {
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      stopSequences: config.stopSequences,
      customHeaders: config.customHeaders,
      customParameters: config.customParameters,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      rateLimit: config.rateLimit,
      pricing: config.pricing,
      priority: config.priority,
    };

    await this.prisma.aIProvider.upsert({
      where: { id: config.id },
      update: {
        name: config.name,
        type: config.type,
        endpoint: config.endpoint || '',
        apiKey: encryptedApiKey,
        settings: settings as never,
        isActive: config.isActive,
      },
      create: {
        id: config.id,
        name: config.name,
        type: config.type,
        endpoint: config.endpoint || '',
        apiKey: encryptedApiKey,
        settings: settings as never,
        isActive: config.isActive,
      },
    });
  }

  /**
   * Map database record to AIProviderConfig
   */
  private mapDatabaseToConfig(dbProvider: {
    id: string;
    name: string;
    type: string;
    endpoint: string | null;
    apiKey: string;
    settings: unknown;
    isActive: boolean;
  }): AIProviderConfig {
    const settings = dbProvider.settings as Record<string, unknown>;
    const decryptedApiKey = this.decryptApiKey(dbProvider.apiKey);

    return {
      id: dbProvider.id,
      name: dbProvider.name,
      type: dbProvider.type as AIProviderType,
      apiKey: decryptedApiKey,
      endpoint: dbProvider.endpoint || undefined,
      model: settings.model as string,
      maxTokens: settings.maxTokens as number,
      temperature: settings.temperature as number,
      topP: settings.topP as number | undefined,
      topK: settings.topK as number | undefined,
      frequencyPenalty: settings.frequencyPenalty as number | undefined,
      presencePenalty: settings.presencePenalty as number | undefined,
      stopSequences: settings.stopSequences as string[] | undefined,
      customHeaders: settings.customHeaders as Record<string, string> | undefined,
      customParameters: settings.customParameters as Record<string, unknown> | undefined,
      timeout: settings.timeout as number | undefined,
      retryAttempts: settings.retryAttempts as number | undefined,
      retryDelay: settings.retryDelay as number | undefined,
      rateLimit: settings.rateLimit as AIProviderConfig['rateLimit'],
      pricing: settings.pricing as AIProviderConfig['pricing'],
      priority: settings.priority as number | undefined,
      isActive: dbProvider.isActive,
      status: AIProviderStatus.ACTIVE,
    };
  }
}
