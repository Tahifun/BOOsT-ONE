// src/hooks/useModeration.ts
import { useState, useCallback, useEffect, useRef } from 'react';

export interface ModSettings {
  spamFilter: {
    enabled: boolean;
    maxRepeats: number;
    capsThreshold: number;
    emoteLimit: number;
    minInterval: number;
  };
  linkPolicy: {
    enabled: boolean;
    blockAll: boolean;
    whitelist: string[];
  };
  bannedWords: {
    enabled: boolean;
    words: string[];
    regexPatterns: string[];
  };
  toxicityFilter: {
    enabled: boolean;
    threshold: number;
    action: 'warn' | 'timeout' | 'ban';
  };
  raidGuard: {
    enabled: boolean;
    threshold: number;
    action: 'slowMode' | 'subOnly' | 'lockdown';
  };
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: number;
  flagged?: boolean;
  flags?: string[];
}

export interface ModAction {
  id: string;
  type: 'timeout' | 'ban' | 'warn' | 'delete';
  user: string;
  reason: string;
  moderator: string;
  timestamp: number;
}

export interface QueueItem {
  id: string;
  user: string;
  message: string;
  timestamp: number;
  type: 'question' | 'giveaway';
  approved?: boolean;
}

const DEFAULT_SETTINGS: ModSettings = {
  spamFilter: {
    enabled: true,
    maxRepeats: 3,
    capsThreshold: 70,
    emoteLimit: 5,
    minInterval: 2
  },
  linkPolicy: {
    enabled: true,
    blockAll: true,
    whitelist: ['discord.gg/myserver', 'twitter.com/myprofile', 'youtube.com', 'twitch.tv']
  },
  bannedWords: {
    enabled: true,
    words: [],
    regexPatterns: []
  },
  toxicityFilter: {
    enabled: true,
    threshold: 0.7,
    action: 'timeout'
  },
  raidGuard: {
    enabled: false,
    threshold: 50,
    action: 'slowMode'
  }
};

export function useModeration() {
  const [settings, setSettings] = useState<ModSettings>(DEFAULT_SETTINGS);
  const [modActions, setModActions] = useState<ModAction[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isRaidMode, setIsRaidMode] = useState(false);
  const [slowModeDelay, setSlowModeDelay] = useState(0);
  
  // Message history for spam detection
  const messageHistory = useRef<Map<string, ChatMessage[]>>(new Map());
  const joinHistory = useRef<number[]>([]);

  // Check for spam
  const checkSpam = useCallback((message: ChatMessage): string[] => {
    const flags: string[] = [];
    
    if (!settings.spamFilter.enabled) return flags;

    const userHistory = messageHistory.current.get(message.user) || [];
    
    // Check message interval
    if (userHistory.length > 0) {
      const lastMessage = userHistory[userHistory.length - 1];
      const timeDiff = (message.timestamp - lastMessage.timestamp) / 1000;
      
      if (timeDiff < settings.spamFilter.minInterval) {
        flags.push('fast_messaging');
      }
    }

    // Check for repeated messages
    const recentMessages = userHistory.slice(-settings.spamFilter.maxRepeats);
    const repeats = recentMessages.filter(m => m.message === message.message).length;
    if (repeats >= settings.spamFilter.maxRepeats - 1) {
      flags.push('repeated_message');
    }

    // Check caps percentage
    const capsCount = (message.message.match(/[A-Z]/g) || []).length;
    const letterCount = (message.message.match(/[a-zA-Z]/g) || []).length;
    if (letterCount > 0) {
      const capsPercentage = (capsCount / letterCount) * 100;
      if (capsPercentage > settings.spamFilter.capsThreshold) {
        flags.push('excessive_caps');
      }
    }

    // Check emote count (simplified - would need actual emote detection)
    const emotePattern = /:\w+:/g;
    const emoteCount = (message.message.match(emotePattern) || []).length;
    if (emoteCount > settings.spamFilter.emoteLimit) {
      flags.push('emote_spam');
    }

    // Update history
    userHistory.push(message);
    if (userHistory.length > 10) userHistory.shift();
    messageHistory.current.set(message.user, userHistory);

    return flags;
  }, [settings.spamFilter]);

  // Check for links
  const checkLinks = useCallback((message: string): boolean => {
    if (!settings.linkPolicy.enabled) return false;

    const linkPattern = /https?:\/\/[^\s]+|www\.[^\s]+|\w+\.\w{2,}/gi;
    const links = message.match(linkPattern);

    if (!links) return false;

    if (settings.linkPolicy.blockAll) {
      // Check if any link is in whitelist
      return !links.some(link => 
        settings.linkPolicy.whitelist.some(allowed => 
          link.toLowerCase().includes(allowed.toLowerCase())
        )
      );
    }

    return false;
  }, [settings.linkPolicy]);

  // Check for banned words
  const checkBannedWords = useCallback((message: string): boolean => {
    if (!settings.bannedWords.enabled) return false;

    const lowerMessage = message.toLowerCase();

    // Check exact words
    if (settings.bannedWords.words.some(word => 
      lowerMessage.includes(word.toLowerCase())
    )) {
      return true;
    }

    // Check regex patterns
    try {
      return settings.bannedWords.regexPatterns.some(pattern => {
        const regex = new RegExp(pattern, 'gi');
        return regex.test(message);
      });
    } catch (e) {
      console.error('Invalid regex pattern:', e);
      return false;
    }
  }, [settings.bannedWords]);

  // Simulate toxicity check (would use actual API in production)
  const checkToxicity = useCallback((message: string): number => {
    if (!settings.toxicityFilter.enabled) return 0;

    // Simplified toxicity scoring
    const toxicWords = ['hate', 'stupid', 'dumb', 'idiot', 'trash'];
    const lowerMessage = message.toLowerCase();
    
    let score = 0;
    toxicWords.forEach(word => {
      if (lowerMessage.includes(word)) {
        score += 0.2;
      }
    });

    // Check for all caps (aggressive)
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.7) score += 0.3;

    // Check for excessive punctuation
    if (message.match(/[!?]{3,}/)) score += 0.2;

    return Math.min(score, 1);
  }, [settings.toxicityFilter.enabled]);

  // Check for raid
  const checkRaid = useCallback(() => {
    if (!settings.raidGuard.enabled) return false;

    const now = Date.now();
    const recentJoins = joinHistory.current.filter(
      time => now - time < 60000 // Last minute
    );

    if (recentJoins.length > settings.raidGuard.threshold) {
      setIsRaidMode(true);
      return true;
    }

    return false;
  }, [settings.raidGuard]);

  // Process message
  const processMessage = useCallback((message: ChatMessage): ModAction | null => {
    const flags: string[] = [];

    // Check spam
    const spamFlags = checkSpam(message);
    flags.push(...spamFlags);

    // Check links
    if (checkLinks(message.message)) {
      flags.push('contains_link');
    }

    // Check banned words
    if (checkBannedWords(message.message)) {
      flags.push('banned_word');
    }

    // Check toxicity
    const toxicityScore = checkToxicity(message.message);
    if (toxicityScore > settings.toxicityFilter.threshold) {
      flags.push('toxic_content');
    }

    // Determine action
    if (flags.length > 0) {
      let actionType: ModAction['type'] = 'warn';
      let reason = flags.join(', ');

      if (flags.includes('banned_word') || flags.includes('toxic_content')) {
        actionType = settings.toxicityFilter.action === 'ban' ? 'ban' : 'timeout';
      } else if (flags.includes('contains_link')) {
        actionType = 'delete';
      } else if (spamFlags.length > 2) {
        actionType = 'timeout';
      }

      const action: ModAction = {
        id: Date.now().toString(),
        type: actionType,
        user: message.user,
        reason: reason,
        moderator: 'AutoMod',
        timestamp: Date.now()
      };

      return action;
    }

    return null;
  }, [checkSpam, checkLinks, checkBannedWords, checkToxicity, settings.toxicityFilter]);

  // Add user join (for raid detection)
  const addUserJoin = useCallback(() => {
    joinHistory.current.push(Date.now());
    
    // Keep only last 2 minutes of history
    const cutoff = Date.now() - 120000;
    joinHistory.current = joinHistory.current.filter(time => time > cutoff);

    // Check for raid
    if (checkRaid()) {
      const action: ModAction = {
        id: Date.now().toString(),
        type: 'warn',
        user: 'System',
        reason: 'Raid detected! Activating protection mode.',
        moderator: 'RaidGuard',
        timestamp: Date.now()
      };
      
      setModActions(prev => [action, ...prev].slice(0, 100));
      
      // Apply raid protection
      if (settings.raidGuard.action === 'slowMode') {
        setSlowModeDelay(10);
      } else if (settings.raidGuard.action === 'lockdown') {
        setSlowModeDelay(30);
      }
    }
  }, [checkRaid, settings.raidGuard.action]);

  // Queue management
  const addToQueue = useCallback((item: Omit<QueueItem, 'id' | 'timestamp'>) => {
    const newItem: QueueItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    setQueue(prev => [...prev, newItem]);
  }, []);

  const approveQueueItem = useCallback((id: string) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, approved: true } : item
    ));
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearQueue = useCallback((type?: 'question' | 'giveaway') => {
    if (type) {
      setQueue(prev => prev.filter(item => item.type !== type));
    } else {
      setQueue([]);
    }
  }, []);

  // Giveaway winner selection
  const drawGiveawayWinner = useCallback(() => {
    const entries = queue.filter(item => item.type === 'giveaway' && !item.approved);
    if (entries.length === 0) return null;

    const winner = entries[Math.floor(Math.random() * entries.length)];
    approveQueueItem(winner.id);
    
    const action: ModAction = {
      id: Date.now().toString(),
      type: 'warn',
      user: winner.user,
      reason: '🎉 Won the giveaway!',
      moderator: 'System',
      timestamp: Date.now()
    };
    
    setModActions(prev => [action, ...prev].slice(0, 100));
    return winner;
  }, [queue, approveQueueItem]);

  // Add manual mod action
  const addModAction = useCallback((action: Omit<ModAction, 'id' | 'timestamp'>) => {
    const newAction: ModAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    setModActions(prev => [newAction, ...prev].slice(0, 100));
  }, []);

  // Update settings
  const updateSettings = useCallback((updates: Partial<ModSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Apply preset
  const applyPreset = useCallback((preset: Partial<ModSettings>) => {
    setSettings(prev => ({ ...prev, ...preset }));
  }, []);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Export current settings
  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  // Import settings
  const importSettings = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      setSettings(imported);
      return true;
    } catch (e) {
      console.error('Failed to import settings:', e);
      return false;
    }
  }, []);

  // Get statistics
  const getStats = useCallback(() => {
    const last24h = Date.now() - 86400000;
    const recentActions = modActions.filter(a => a.timestamp > last24h);
    
    return {
      totalActions: modActions.length,
      last24hActions: recentActions.length,
      timeouts: recentActions.filter(a => a.type === 'timeout').length,
      bans: recentActions.filter(a => a.type === 'ban').length,
      warnings: recentActions.filter(a => a.type === 'warn').length,
      deletions: recentActions.filter(a => a.type === 'delete').length,
      queueSize: queue.length,
      questionsInQueue: queue.filter(q => q.type === 'question').length,
      giveawayEntries: queue.filter(q => q.type === 'giveaway').length,
      isRaidMode,
      slowModeDelay
    };
  }, [modActions, queue, isRaidMode, slowModeDelay]);

  // Cleanup old data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 3600000; // 1 hour
      
      // Clean old mod actions
      setModActions(prev => prev.filter(a => a.timestamp > cutoff));
      
      // Clean old queue items
      setQueue(prev => prev.filter(q => q.timestamp > cutoff || q.approved));
      
      // Reset raid mode if no recent activity
      if (isRaidMode) {
        const recentJoins = joinHistory.current.filter(
          time => Date.now() - time < 120000
        );
        if (recentJoins.length < 10) {
          setIsRaidMode(false);
          setSlowModeDelay(0);
        }
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [isRaidMode]);

  return {
    // Settings
    settings,
    updateSettings,
    applyPreset,
    resetSettings,
    exportSettings,
    importSettings,
    
    // Message processing
    processMessage,
    checkSpam,
    checkLinks,
    checkBannedWords,
    checkToxicity,
    
    // Raid protection
    addUserJoin,
    isRaidMode,
    slowModeDelay,
    
    // Queue management
    queue,
    addToQueue,
    approveQueueItem,
    removeFromQueue,
    clearQueue,
    drawGiveawayWinner,
    
    // Mod actions
    modActions,
    addModAction,
    
    // Statistics
    getStats
  };
}