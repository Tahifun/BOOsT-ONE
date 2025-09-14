import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import {
  Play,
  Pause,
  Check,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Sparkles,
  Zap,
  TrendingUp,
  Star,
  Heart,
  Flame,
  Tag,
  MoreVertical,
  Share2,
  CheckCircle,
  Info,
  Film,
} from 'lucide-react';
import ScoreIndicator from './ScoreIndicator';
import { AISuggestion, FeedbackData } from './AIAssistant';

interface SuggestionCardProps {
  suggestion: AISuggestion;
  onApply: () => void;
  onFeedback: (feedback: FeedbackData) => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  batchMode?: boolean;
  expanded?: boolean;
  showPreview?: boolean;
  collaborators?: Collaborator[];
}

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onApply,
  onFeedback,
  selected = false,
  onSelect,
  batchMode = false,
  expanded: initialExpanded = false,
  showPreview = true,
  collaborators = [],
}) => {
  // State
  const [expanded, setExpanded] = useState(initialExpanded);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values
  const scale = useSpring(1, { stiffness: 300, damping: 30 });
  const glow = useMotionValue(0);

  // Effects
  useEffect(() => {
    if (isHovered) {
      scale.set(1.02);
      glow.set(1);
    } else {
      scale.set(1);
      glow.set(0);
    }
  }, [isHovered, scale, glow]);

  useEffect(() => {
    if (suggestion.feedback) {
      setFeedbackGiven(
        suggestion.feedback.rating === 'positive'
          ? 'positive'
          : suggestion.feedback.rating === 'negative'
          ? 'negative'
          : null
      );
    }
  }, [suggestion.feedback]);

  // Pause video on unmount
  useEffect(() => {
    return () => {
      videoRef.current?.pause();
    };
  }, []);

  // Handlers
  const handleApply = () => {
    onApply();

    // Auto-positive feedback when applied
    if (!feedbackGiven) {
      const feedback: FeedbackData = {
        rating: 'positive',
        useful: true,
        accurate: true,
        applied: true,
        timestamp: new Date(),
      };
      onFeedback(feedback);
      setFeedbackGiven('positive');
    }
  };

  const handleFeedback = (rating: 'positive' | 'negative') => {
    const feedback: FeedbackData = {
      rating,
      useful: rating === 'positive',
      accurate: rating === 'positive',
      applied: suggestion.applied,
      comment: comment || undefined,
      timestamp: new Date(),
    };

    onFeedback(feedback);
    setFeedbackGiven(rating);
    setShowFeedback(false);
    setComment('');
  };

  const handleShare = async () => {
    const shareData = {
      title: suggestion.title,
      text: suggestion.description,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        // @ts-expect-error: web share API detection
        await navigator.share(shareData);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(
          `${suggestion.title}\n${suggestion.description}\n${shareData.url}`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore share errors (user canceled, etc.)
    }
  };

  const togglePreview = async () => {
    const el = videoRef.current;
    if (!el) return;

    try {
      if (isPlaying) {
        el.pause();
        setIsPlaying(false);
      } else {
        const p = el.play();
        if (p && typeof (p as Promise<void>).then === 'function') {
          await p;
        }
        setIsPlaying(true);
      }
    } catch {
      // Autoplay might be blocked â€” ignore.
    }
  };

  // Type-specific icons
  const getTypeIcon = () => {
    const icons: Partial<Record<AISuggestion['type'], React.ReactNode>> = {
      highlight: <Star />,
      'emotional-peak': <Heart />,
      'action-sequence': <Zap />,
      'dialogue-important': <MessageSquare />,
      'music-sync': <Music />,
      'chat-reaction': <MessageSquare />,
      'scene-change': <Film />,
      'viral-potential': <Flame />,
      climax: <TrendingUp />,
      'tutorial-step': <Info />,
    };

    return icons[suggestion.type] ?? <Sparkles />;
  };

  // Priority colors
  const getPriorityColor = () => {
    const colors: Record<NonNullable<AISuggestion['priority']>, string> = {
      critical: '#ff0000',
      high: '#ff6600',
      medium: '#ffaa00',
      low: '#00aa00',
    };
    return colors[suggestion.priority] || '#666666';
  };

  // Format timestamp
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      ref={cardRef}
      style={{
        scale,
        position: 'relative',
        background: suggestion.applied
          ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(0, 255, 0, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        border: `1px solid ${
          selected ? '#ffaa00' : suggestion.applied ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'
        }`,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: batchMode ? 'pointer' : 'default',
        boxShadow: selected
          ? '0 0 30px rgba(255, 170, 0, 0.3)'
          : suggestion.applied
          ? '0 0 20px rgba(0, 255, 0, 0.2)'
          : '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => batchMode && onSelect?.(!selected)}
      onKeyDown={(e) => {
        if (!batchMode) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(!selected);
        }
      }}
      role={batchMode ? 'button' : undefined}
      aria-pressed={batchMode ? selected : undefined}
      tabIndex={batchMode ? 0 : -1}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      {/* Quantum Glow Effect */}
      <motion.div
        style={{
          position: 'absolute',
          inset: -1,
          background: `radial-gradient(circle at 50% 50%, rgba(138, 43, 226, ${glow.get()}) 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Batch Selection Checkbox */}
      {batchMode && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 10,
          }}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              border: `2px solid ${selected ? '#ffaa00' : 'rgba(255, 255, 255, 0.3)'}`,
              background: selected ? '#ffaa00' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(!selected);
            }}
            aria-label={selected ? 'Deselect suggestion' : 'Select suggestion'}
            role="checkbox"
            aria-checked={selected}
          >
            {selected && <Check size={16} color="black" aria-hidden="true" />}
          </motion.div>
        </div>
      )}

      {/* Applied Badge */}
      {suggestion.applied && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '4px 8px',
            background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.8) 0%, rgba(0, 255, 0, 0.6) 100%)',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: '600',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 10,
          }}
        >
          <CheckCircle size={12} aria-hidden="true" />
          APPLIED
        </div>
      )}

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Preview Section */}
        {showPreview && suggestion.thumbnail && (
          <div
            style={{
              position: 'relative',
              height: '180px',
              background: 'black',
              overflow: 'hidden',
            }}
          >
            {suggestion.thumbnail.endsWith('.mp4') ? (
              <video
                ref={videoRef}
                src={suggestion.thumbnail}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loop
                muted
              />
            ) : (
              <img
                src={suggestion.thumbnail}
                alt={suggestion.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            )}

            {/* Play Button Overlay */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePreview}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.7)',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
              }}
              aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </motion.button>

            {/* Time Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                padding: '4px 8px',
                background: 'rgba(0, 0, 0, 0.8)',
                borderRadius: '4px',
                fontSize: '11px',
                color: 'white',
                fontFamily: 'monospace',
              }}
            >
              {formatTime(suggestion.timestamp)} - {formatTime(suggestion.timestamp + suggestion.duration)}
            </div>

            {/* Priority Indicator */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: batchMode ? '45px' : '10px',
                width: '4px',
                height: '30px',
                background: getPriorityColor(),
                borderRadius: '2px',
                boxShadow: `0 0 10px ${getPriorityColor()}`,
              }}
            />
          </div>
        )}

        {/* Card Body */}
        <div style={{ padding: '15px' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            {/* Score Indicator */}
            <ScoreIndicator score={suggestion.score} size="medium" showLabel={false} animated={isHovered} />

            {/* Title and Type */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}
              >
                <div style={{ color: '#8a2be2', display: 'flex', alignItems: 'center' }}>{getTypeIcon()}</div>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'white',
                    margin: 0,
                  }}
                >
                  {suggestion.title}
                </h3>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <span
                  style={{
                    padding: '2px 6px',
                    background: 'rgba(138, 43, 226, 0.2)',
                    borderRadius: '4px',
                    color: '#8a2be2',
                  }}
                >
                  {suggestion.type.replace('-', ' ')}
                </span>
                <span>â€¢</span>
                <span>{Math.round(suggestion.confidence * 100)}% confidence</span>
              </div>
            </div>

            {/* Menu */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails((v) => !v);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                padding: '4px',
              }}
              aria-label="Toggle details"
            >
              <MoreVertical size={16} />
            </motion.button>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.5',
              marginBottom: '12px',
            }}
          >
            {suggestion.description}
          </p>

          {/* Reason */}
          <div
            style={{
              padding: '8px',
              background: 'rgba(0, 255, 204, 0.1)',
              borderLeft: '3px solid #00ffcc',
              borderRadius: '4px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: '#00ffcc',
                marginBottom: '4px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Info size={12} />
              AI Reasoning
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>{suggestion.reason}</div>
          </div>

          {/* Tags */}
          {!!suggestion.tags?.length && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '12px',
              }}
            >
              {suggestion.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '2px 8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Expanded Details */}
          <AnimatePresence>
            {(expanded || showDetails) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  {suggestion.metadata.audioLevel !== undefined && (
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Audio Level:</span>
                      <span style={{ marginLeft: '6px', color: 'white' }}>
                        {Math.round(suggestion.metadata.audioLevel * 100)}%
                      </span>
                    </div>
                  )}
                  {suggestion.metadata.motionScore !== undefined && (
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Motion:</span>
                      <span style={{ marginLeft: '6px', color: 'white' }}>
                        {Math.round(suggestion.metadata.motionScore * 100)}%
                      </span>
                    </div>
                  )}
                  {suggestion.metadata.chatActivity !== undefined && (
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Chat Activity:</span>
                      <span style={{ marginLeft: '6px', color: 'white' }}>
                        {Math.round(suggestion.metadata.chatActivity * 100)}%
                      </span>
                    </div>
                  )}
                  {suggestion.metadata.viewerEngagement !== undefined && (
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Engagement:</span>
                      <span style={{ marginLeft: '6px', color: 'white' }}>
                        {Math.round(suggestion.metadata.viewerEngagement * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Neural Signature */}
                {suggestion.neuralSignature && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '8px',
                      background: 'rgba(138, 43, 226, 0.1)',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      color: 'rgba(138, 43, 226, 0.8)',
                    }}
                  >
                    Neural Pattern: {suggestion.neuralSignature.cluster}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '15px',
            }}
          >
            {!suggestion.applied ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApply();
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'linear-gradient(135deg, #00ffcc 0%, #00aaff 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'black',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                aria-label="Apply as clip"
              >
                <Zap size={14} />
                Apply as Clip
              </motion.button>
            ) : (
              <div
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(0, 255, 0, 0.1)',
                  border: '1px solid rgba(0, 255, 0, 0.3)',
                  borderRadius: '8px',
                  color: '#00ff00',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                aria-live="polite"
              >
                <CheckCircle size={14} />
                Applied
              </div>
            )}

            {/* Feedback Buttons */}
            {!feedbackGiven && !showFeedback && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFeedback('positive');
                  }}
                  style={{
                    padding: '10px',
                    background: 'rgba(0, 255, 0, 0.1)',
                    border: '1px solid rgba(0, 255, 0, 0.3)',
                    borderRadius: '8px',
                    color: '#00ff00',
                    cursor: 'pointer',
                  }}
                  aria-label="Mark suggestion as useful"
                >
                  <ThumbsUp size={14} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFeedback(true);
                  }}
                  style={{
                    padding: '10px',
                    background: 'rgba(255, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 0, 0, 0.3)',
                    borderRadius: '8px',
                    color: '#ff4444',
                    cursor: 'pointer',
                  }}
                  aria-label="Give negative feedback"
                >
                  <ThumbsDown size={14} />
                </motion.button>
              </>
            )}

            {feedbackGiven && (
              <div
                style={{
                  padding: '10px',
                  background: feedbackGiven === 'positive' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                  border: `1px solid ${
                    feedbackGiven === 'positive' ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'
                  }`,
                  borderRadius: '8px',
                  color: feedbackGiven === 'positive' ? '#00ff00' : '#ff4444',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                aria-live="polite"
              >
                {feedbackGiven === 'positive' ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                Feedback sent
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              style={{
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
              }}
              aria-label="Share suggestion"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
            </motion.button>
          </div>

          {/* Feedback Form */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'rgba(255, 0, 0, 0.05)',
                  border: '1px solid rgba(255, 0, 0, 0.2)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '8px',
                  }}
                >
                  What was wrong with this suggestion?
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional feedback..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '12px',
                    resize: 'vertical',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '8px',
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFeedback('negative')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'rgba(255, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 0, 0, 0.4)',
                      borderRadius: '4px',
                      color: '#ff4444',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                    aria-label="Send negative feedback"
                  >
                    Send Feedback
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowFeedback(false);
                      setComment('');
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collaborator Avatars */}
        {collaborators.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              display: 'flex',
            }}
          >
            {collaborators.slice(0, 3).map((collab, i) => (
              <div
                key={collab.id}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: collab.color,
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                  marginLeft: i > 0 ? '-8px' as unknown as number : 0, // negative overlap
                  zIndex: 3 - i,
                }}
                title={collab.name}
                aria-label={collab.name}
              >
                {collab.avatar ? (
                  <img
                    src={collab.avatar}
                    alt={collab.name}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                ) : (
                  collab.name[0]
                )}
              </div>
            ))}
            {collaborators.length > 3 && (
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white',
                  marginLeft: '-8px',
                }}
                aria-label={`+${collaborators.length - 3} more`}
              >
                +{collaborators.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Simple Music icon if not provided by lucide-react
const Music: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

export default SuggestionCard;

