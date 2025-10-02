// src/hooks/useFeature.ts
import { useMemo } from "react";
import { useSubscription, Tier } from '../contexts/SubscriptionContext';

export type FeatureName =
  | "overlay_upload"
  | "clip_boost"
  | "leaderboard"
  | "moderation"
  | "recording"
  | "transcoding"
  | "bot_commands"
  | "giveaways"
  | "polls"
  | "advanced_audio"
  | "panic_button"
  | "stats_export"
  | "view_stream"
  | "basic_chat"
  | "afk_detection"
  | "auto_moderation"
  | "auto_shoutout"
  | "bot_api_service"
  | "bot_manager_page"
  | "bot_settings"
  | "bot_tab_nav"
  | "community_goals"
  | "sound_trigger"
  | "support_ladder"
  | "timer_messages"
  | "welcome_messages"
  | "boost_moments"
  | "chat_peak_graph"
  | "coin_stats"
  | "follower_stats"
  | "follower_ftrend"
  | "follower_trend"
  | "heatmap_stats"
  | "rewatch_stats"
  | "sentiment_graph"
  | "session_timeline"
  | "spotify_now_playing"
  | "tiktok_stats"
  | "viewer_graph"
  | "viewer_stats"
  | "duel_game"
  | "game_tab_nav"
  | "mini_games_page"
  | "quiz_game"
  | "random_number_game"
  | "rock_paper_scissors_game"
  | "slots_game"
  | "wheel_game"
  | "audio_level_meter"
  | "audio_player"
  | "camera_preview"
  | "camera_selector"
  | "chat_box"
  | "chat_input_bar"
  | "chat_overlay"
  | "connection_indicator"
  | "gift_counter"
  | "go_live_checklist"
  | "livestream_panel"
  | "poll_widget"
  | "video_cam_selector"
  | "video_player"
  | "ai_highlight_suggestions"
  | "clip_manager"
  | "live_clip_requests"
  | "media_gallery"
  | "media_impact_stats"
  | "screenshot_manager"
  | "soundboard_manager"
  | "overlay_card"
  | "overlay_category_filter"
  | "overlay_editor"
  | "overlay_gallery"
  | "overlay_preview_modal"
  | "overlay_upload_form"
  | "overlay_widget_selector"
  | "bot_stats_panel"
  | "bot_stats_service"
  | "game_stats_service"
  | "stats_dashboard"
  | "user_game_stats"
  | "brand_connect_buttons"
  | "feature_gate"
  | "login_experience"
  | "protected_route"
  | "sidebar"
  | "tiktok_integration"
  | "world_globe"
  | "pro_analytics"
  | "sse_stream"
  | "studio_mode"
  | "scenes_unlimited"
  | "scene_transitions"
  | "encoder_tuning"
  | "resolution_1080p"
  | "chat_search"
  | "chat_pin"
  | "chat_export"
  | "moderation_roles"
  | "moderation_logs"
  | "overlay_import"
  | "overlay_unlimited"
  | "overlay_custom_css"
  | "branding_assets"
  | "sponsor_slots"
  | "goals_multiple"
  | "chain_goals"
  | "hype_train"
  | "timer_automations"
  | "polls_advanced"
  | "points_system"
  | "rewards"
  | "requests_queue"
  | "tts"
  | "soundboard"
  | "automation_rules"
  | "analytics_export"
  | "analytics_deep"
  | "webhooks"
  | "discord_notify"
  | "obs_virtual_cam"
  | "cloud_sync"
  | "themes_full";

type CanonicalFeatureName = Exclude<FeatureName, "follower_ftrend">;

const NORMALIZE_FEATURE_KEY: Partial<Record<FeatureName, CanonicalFeatureName>> = {
  follower_ftrend: "follower_trend",
};

function isCanonical(name: FeatureName): name is CanonicalFeatureName {
  return name !== "follower_ftrend";
}

export function normalizeFeature(name: FeatureName): CanonicalFeatureName {
  if (isCanonical(name)) return name;
  return NORMALIZE_FEATURE_KEY[name] ?? "follower_trend";
}

const FEATURE_MIN_TIER: Partial<Record<CanonicalFeatureName, Tier>> = {
  // FREE
  view_stream: "FREE",
  basic_chat: "FREE",
  afk_detection: "FREE",
  moderation: "FREE",
  auto_shoutout: "FREE",
  bot_api_service: "FREE",
  bot_manager_page: "FREE",
  bot_settings: "FREE",
  bot_tab_nav: "FREE",
  community_goals: "FREE",
  sound_trigger: "FREE",
  support_ladder: "FREE",
  timer_messages: "FREE",
  welcome_messages: "FREE",
  boost_moments: "FREE",
  chat_peak_graph: "FREE",
  coin_stats: "FREE",
  follower_stats: "FREE",
  follower_trend: "FREE",
  heatmap_stats: "FREE",
  rewatch_stats: "FREE",
  sentiment_graph: "FREE",
  session_timeline: "FREE",
  spotify_now_playing: "FREE",
  tiktok_stats: "FREE",
  viewer_graph: "FREE",
  viewer_stats: "FREE",
  duel_game: "FREE",
  game_tab_nav: "FREE",
  mini_games_page: "PRO",
  quiz_game: "FREE",
  random_number_game: "FREE",
  rock_paper_scissors_game: "FREE",
  slots_game: "FREE",
  wheel_game: "FREE",
  audio_level_meter: "FREE",
  audio_player: "FREE",
  camera_preview: "FREE",
  camera_selector: "FREE",
  chat_box: "FREE",
  chat_input_bar: "FREE",
  chat_overlay: "FREE",
  connection_indicator: "FREE",
  gift_counter: "FREE",
  go_live_checklist: "FREE",
  livestream_panel: "FREE",
  poll_widget: "FREE",
  video_cam_selector: "FREE",
  video_player: "FREE",
  ai_highlight_suggestions: "FREE",
  clip_manager: "FREE",
  live_clip_requests: "FREE",
  media_gallery: "FREE",
  media_impact_stats: "FREE",
  screenshot_manager: "FREE",
  soundboard_manager: "FREE",
  overlay_card: "FREE",
  overlay_category_filter: "FREE",
  overlay_gallery: "FREE",
  overlay_preview_modal: "FREE",
  overlay_upload_form: "FREE",
  overlay_widget_selector: "FREE",
  overlay_upload: "FREE",
  bot_stats_panel: "FREE",
  bot_stats_service: "FREE",
  game_stats_service: "FREE",
  stats_dashboard: "FREE",
  user_game_stats: "FREE",
  brand_connect_buttons: "FREE",
  feature_gate: "FREE",
  login_experience: "FREE",
  protected_route: "FREE",
  sidebar: "FREE",
  tiktok_integration: "FREE",
  world_globe: "FREE",
  panic_button: "FREE",
  // PRO
  clip_boost: "PRO",
  leaderboard: "PRO",
  auto_moderation: "PRO",
  recording: "PRO",
  transcoding: "PRO",
  bot_commands: "PRO",
  giveaways: "PRO",
  polls: "PRO",
  advanced_audio: "PRO",
  stats_export: "PRO",
  pro_analytics: "PRO",
  sse_stream: "PRO",
  studio_mode: "PRO",
  scenes_unlimited: "PRO",
  scene_transitions: "PRO",
  encoder_tuning: "PRO",
  resolution_1080p: "PRO",
  chat_search: "PRO",
  chat_pin: "PRO",
  chat_export: "PRO",
  moderation_roles: "PRO",
  moderation_logs: "PRO",
  overlay_editor: "PRO",
  overlay_unlimited: "PRO",
  overlay_custom_css: "PRO",
  overlay_import: "PRO",
  branding_assets: "PRO",
  sponsor_slots: "PRO",
  polls_advanced: "PRO",
  points_system: "PRO",
  rewards: "PRO",
  requests_queue: "PRO",
  goals_multiple: "PRO",
  chain_goals: "PRO",
  hype_train: "PRO",
  timer_automations: "PRO",
  tts: "PRO",
  soundboard: "PRO",
  automation_rules: "PRO",
  analytics_export: "PRO",
  analytics_deep: "PRO",
  webhooks: "PRO",
  discord_notify: "PRO",
  obs_virtual_cam: "PRO",
  cloud_sync: "PRO",
  themes_full: "PRO",
};

export function useIsProFeatureEnabled(name: FeatureName): boolean {
  const { role, tier, active } = useSubscription();
  return useMemo(() => {
    if (role === "SUPERUSER") return true;
    const key = normalizeFeature(name);
    const required = FEATURE_MIN_TIER[key] ?? "FREE";
    if (required === "FREE") return true;
    return active && (tier === "PRO" || tier === "ENTERPRISE");
  }, [role, tier, active, name]);
}

export default function useFeature(name: FeatureName): boolean {
  const { role, tier, active } = useSubscription();
  return useMemo(() => {
    if (role === "SUPERUSER") return true;
    const key = normalizeFeature(name);
    const required = FEATURE_MIN_TIER[key] ?? "FREE";
    if (required === "FREE") return true;
    return active && (tier === "PRO" || tier === "ENTERPRISE");
  }, [role, tier, active, name]);
}

export const FEATURE_MIN_TIER_KEYS = Object.keys(FEATURE_MIN_TIER) as (keyof typeof FEATURE_MIN_TIER)[];
export const FEATURE_ALIAS_MAP = NORMALIZE_FEATURE_KEY;

