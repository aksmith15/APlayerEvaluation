import { supabase } from './supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Types for subscription callbacks
export type SubscriptionCallback<T extends Record<string, any> = Record<string, any>> = (payload: RealtimePostgresChangesPayload<T>) => void;

export interface SubscriptionConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: SubscriptionCallback;
}

// Real-time subscription manager
export class RealtimeSubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, SubscriptionConfig> = new Map();

  // Subscribe to table changes
  subscribe(
    subscriptionId: string,
    config: SubscriptionConfig
  ): void {
    try {
      // Unsubscribe existing subscription if it exists
      this.unsubscribe(subscriptionId);

      console.log(`Setting up real-time subscription: ${subscriptionId} for table: ${config.table}`);

      // Create new channel
      const channel = supabase.channel(`${subscriptionId}-${config.table}`);
      
      // Subscribe to postgres changes
      channel.on(
        'postgres_changes' as any,
        {
          event: config.event || '*',
          schema: 'public',
          table: config.table,
          filter: config.filter
        } as any,
        config.callback as any
      );

      // Subscribe to the channel
      channel.subscribe((status) => {
        console.log(`Subscription ${subscriptionId} status:`, status);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to ${config.table} changes`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to ${config.table} changes`);
        }
      });

      // Store the channel and config
      this.channels.set(subscriptionId, channel);
      this.subscriptions.set(subscriptionId, config);

    } catch (error) {
      console.error(`Error setting up subscription ${subscriptionId}:`, error);
    }
  }

  // Unsubscribe from table changes
  unsubscribe(subscriptionId: string): void {
    try {
      const channel = this.channels.get(subscriptionId);
      if (channel) {
        console.log(`Unsubscribing from: ${subscriptionId}`);
        supabase.removeChannel(channel);
        this.channels.delete(subscriptionId);
        this.subscriptions.delete(subscriptionId);
      }
    } catch (error) {
      console.error(`Error unsubscribing from ${subscriptionId}:`, error);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll(): void {
    console.log('Unsubscribing from all real-time channels');
    this.channels.forEach((_, subscriptionId) => {
      this.unsubscribe(subscriptionId);
    });
  }

  // Get active subscriptions
  getActiveSubscriptions(): string[] {
    return Array.from(this.channels.keys());
  }

  // Check if subscription is active
  isSubscribed(subscriptionId: string): boolean {
    return this.channels.has(subscriptionId);
  }
}

// Global subscription manager instance
export const realtimeManager = new RealtimeSubscriptionManager();

// Convenience functions for common analytics subscriptions

// Subscribe to evaluation score changes for a specific employee
export const subscribeToEmployeeEvaluations = (
  employeeId: string,
  callback: SubscriptionCallback
): void => {
  realtimeManager.subscribe(
    `employee-evaluations-${employeeId}`,
    {
      table: 'weighted_evaluation_scores',
      event: '*',
      filter: `evaluatee_id=eq.${employeeId}`,
      callback
    }
  );
};

// Subscribe to quarter final scores for trending data
export const subscribeToQuarterlyScores = (
  employeeId: string,
  callback: SubscriptionCallback
): void => {
  realtimeManager.subscribe(
    `quarterly-scores-${employeeId}`,
    {
      table: 'quarter_final_scores',
      event: '*',
      filter: `evaluatee_id=eq.${employeeId}`,
      callback
    }
  );
};

// Subscribe to evaluation cycles (quarters) changes
export const subscribeToEvaluationCycles = (
  callback: SubscriptionCallback
): void => {
  realtimeManager.subscribe(
    'evaluation-cycles',
    {
      table: 'evaluation_cycles',
      event: '*',
      callback
    }
  );
};

// Subscribe to people (employees) changes
export const subscribeToPeopleChanges = (
  callback: SubscriptionCallback
): void => {
  realtimeManager.subscribe(
    'people-changes',
    {
      table: 'people',
      event: '*',
      callback
    }
  );
};

// Subscribe to app config changes (webhook URLs, etc.)
export const subscribeToAppConfig = (
  callback: SubscriptionCallback
): void => {
  realtimeManager.subscribe(
    'app-config',
    {
      table: 'app_config',
      event: '*',
      callback
    }
  );
};

// Cleanup function for React components
export const useRealtimeCleanup = () => {
  return () => {
    realtimeManager.unsubscribeAll();
  };
};

// Types for subscription events
export interface EvaluationScoreChange {
  evaluatee_id: string;
  quarter_id: string;
  attribute_name: string;
  weighted_final_score: number;
  completion_percentage: number;
}

export interface QuarterScoreChange {
  evaluatee_id: string;
  quarter_id: string;
  final_quarter_score: number;
  completion_percentage: number;
}

export interface EvaluationCycleChange {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export interface PeopleChange {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  active: boolean;
}

export interface AppConfigChange {
  id: number;
  key: string;
  value: string;
  environment: string;
} 