// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTheme } from '../contexts/ThemeContext';

import ViewerStats from '../components/dashboard/ViewerStats';
import FollowerStats from '../components/dashboard/FollowerStats';
import CoinStats from '../components/dashboard/CoinStats';
import TikTokStats from '../components/dashboard/TikTokStats';
import SentimentGraph from '../components/dashboard/SentimentGraph';
import ProAnalytics from '../components/analytics/ProAnalytics';
import ViewerGraph from '../components/dashboard/ViewerGraph';
import FollowerTrend from '../components/dashboard/FollowerTrend';
import SessionTimeline from '../components/dashboard/SessionTimeline';
import HeatmapStats from '../components/dashboard/HeatmapStats';
import RewatchStats from '../components/dashboard/RewatchStats';
import ChatPeakGraph from '../components/dashboard/ChatPeakGraph';
import BoostMoments from '../components/dashboard/BoostMoments';

import SpotifyNowPlayingCard from '../spotify/SpotifyNowPlayingCard';
import SpotifyControls from '../spotify/SpotifyControls';
import SpotifyPlaylistPicker from '../spotify/SpotifyPlaylistPicker';

import "./DashboardPage.css";



const TICK_MS = 230;

const REDUCE_MOTION = true;



interface Particle { id:number; x:number; y:number; z:number; speed:number; size:number; color:string; phase:number; }

interface NeuralConnection { id:number; x1:number; y1:number; x2:number; y2:number; active:boolean; delay:number; }

interface DataStreamBar { id:number; value:number; target:number; speed:number; }



const DashboardPage: React.FC = () => {

  const { currentUser } = useAuth();

  const { isPro } = useSubscription();

  const { theme } = useTheme();

  const location = useLocation();



  const neuralConnections = useMemo<NeuralConnection[]>(

    () => Array.from({ length: 20 }, (_, i) => ({

      id: i, x1: Math.random()*100, y1: Math.random()*100, x2: Math.random()*100, y2: Math.random()*100,

      active: Math.random() > 0.5, delay: Math.random()*2

    })), []

  );



  const [dataStream, setDataStream] = useState<DataStreamBar[]>(

    () => Array.from({ length: 30 }, (_, i) => ({

      id: i, value: Math.random()*100, target: Math.random()*100, speed: 0.08 + Math.random()*0.08

    }))

  );



  useEffect(() => {

    const t = setInterval(() => {

      setDataStream(prev => prev.map(b => {

        if (Math.random() < 0.02) return { ...b, target: Math.random()*100 };

        const next = b.value + (b.target - b.value) * b.speed;

        return { ...b, value: next };

      }));

    }, TICK_MS);

    return () => clearInterval(t);

  }, []);



  useEffect(() => {

    const q = new URLSearchParams(location.search);

    if (q.get("spotify") === "1") {

      setTimeout(() => {

        document.getElementById("spotify-card")?.scrollIntoView({ behavior: "smooth", block: "center" });

      }, 250);

    }

  }, [location.search]);



  const useCounter = (end: number, duration: number = 2000) => {

    const [count, setCount] = useState(0);

    useEffect(() => {

      let start = 0; const inc = end / (duration / 16);

      const timer = setInterval(() => {

        start += inc; if (start >= end) { setCount(end); clearInterval(timer); }

        else { setCount(Math.floor(start)); }

      }, 16);

      return () => clearInterval(timer);

    }, [end, duration]);

    return count;

  };



  const liveViewers = useCounter(12847, 3000);

  const totalFollowers = useCounter(48293, 3000);

  const streamRevenue = useCounter(3847, 3000);

  const chatActivity = useCounter(94, 2000);



  // --- Holographic Card (mit className) ---

  interface HolographicCardProps {

    children: React.ReactNode;

    title: string;

    icon: string;

    delay?: number;

    pro?: boolean;

    className?: string;

  }

  const HolographicCard: React.FC<HolographicCardProps> = ({

    children, title, icon, delay = 0, pro = false, className = ""

  }) => {

    const [isHovered, setIsHovered] = useState(false);

    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {

      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();

      const x = (e.clientX - rect.left) / rect.width;

      const y = (e.clientY - rect.top) / rect.height;

      cardRef.current.style.setProperty("--mouse-x", x.toString());

      cardRef.current.style.setProperty("--mouse-y", y.toString());

    };

    return (

      <div

        ref={cardRef}

        className={`holographic-card ${isHovered ? "active" : ""} ${pro ? "pro-card" : ""} ${className}`}

        onMouseEnter={() => setIsHovered(true)}

        onMouseLeave={() => setIsHovered(false)}

        onMouseMove={REDUCE_MOTION ? undefined : handleMouseMove}

        style={{ animationDelay: `${delay}ms` }}

      >

        <div className="card-glow" />

        <div className="card-border" />

        <div className="card-content">

          <div className="card-header">

            <span className="card-icon">{icon}</span>

            <h3>{title}</h3>

            {pro && <span className="pro-badge">PRO</span>}

          </div>

          <div className="card-body">{children}</div>

        </div>

        <div className="card-particles" />

      </div>

    );

  };



  const Orb: React.FC<{ value:string; label:string; color:string; }> = ({ value, label, color }) => (

    <div className="quantum-orb">

      <div className="orb-container">

        <div className="orb-core" style={{ ["--orb-color" as any]: color } as React.CSSProperties}>

          <div className="orb-value">{value}</div>

        </div>

        <div className="orb-rings">

          {[...Array(3)].map((_, i) => <div key={i} className="orb-ring" style={{ ["--ring-delay" as any]: `${i*0.3}s` }} />)}

        </div>

      </div>

      <div className="orb-label">{label}</div>

    </div>

  );



  return (

    <div className={`epic-dashboard ${theme === "epic" ? "theme-epic" : ""}`}>

      {/* Header */}

      <div className="dashboard-header">

        <div className="header-content">

          <div className="welcome-section">

            <h1 className="glitch-text" data-text="COMMAND CENTER">COMMAND CENTER</h1>

            <div className="user-status">

              <div className="status-indicator" />

              <span>SYSTEM ONLINE</span>

              <span className="divider">|</span>

              <span>{currentUser?.displayName || "STREAMER"}</span>

              {isPro && <span className="pro-indicator">PRO</span>}

            </div>

          </div>

          <Link to="/overlay/editor" className="overlay-editor-button">

            <span className="button-bg" />

            <span className="button-text">ï¿½YZï¿½ OVERLAY EDITOR</span>

            <span className="button-glow" />

          </Link>

        </div>



        <div className="live-stats-bar">

          <Orb value={liveViewers.toLocaleString()} label="LIVE VIEWERS" color="#00ffff" />

          <Orb value={totalFollowers.toLocaleString()} label="FOLLOWERS" color="#a855f7" />

          <Orb value={`$${streamRevenue.toLocaleString()}`} label="REVENUE" color="#10b981" />

          <Orb value={`${chatActivity}%`} label="CHAT ACTIVITY" color="#ec4899" />

        </div>

      </div>



      {/* Content */}

      <div className="dashboard-grid">

        <div className="grid-section additional-stats">

          <HolographicCard title="SPOTIFY" icon="ï¿½YZï¿½" delay={0} className="spotify-card">

            <div id="spotify-card">

              <div className="spotify-controls-row">

                <SpotifyControls />

              </div>

              <div className="spotify-playlist">

                <SpotifyPlaylistPicker />

              </div>

              <div className="spotify-nowplaying">

                <SpotifyNowPlayingCard />

              </div>

            </div>

          </HolographicCard>



          <HolographicCard title="BOOST MOMENTS" icon="ï¿½sï¿½" delay={100}>

            <BoostMoments />

          </HolographicCard>

        </div>



        <div className="grid-section primary-stats">

          <HolographicCard title="VIEWER ANALYTICS" icon="ï¿½Y'ï¿½" delay={200}><ViewerStats /></HolographicCard>

          <HolographicCard title="FOLLOWER MATRIX" icon="ï¿½Y'ï¿½" delay={300}><FollowerStats /></HolographicCard>

          <HolographicCard title="REVENUE STREAM" icon="ï¿½Y'Z" delay={400}><CoinStats /></HolographicCard>

        </div>



        <div className="grid-section social-stats">
            <HolographicCard title="TIKTOK NEURAL NET" icon="📱" delay={500}><TikTokStats /></HolographicCard>

          <HolographicCard title="SENTIMENT ANALYSIS" icon="💬" delay={600}><SentimentGraph /></HolographicCard>

          <HolographicCard title="PRO ANALYTICS" icon="ï¿½Ys?" delay={700} pro><ProAnalytics /></HolographicCard>

        </div>



        <div className="grid-section advanced-stats">

          <HolographicCard title="VIEWER TIMELINE" icon="ï¿½Y"S" delay={800}><ViewerGraph /></HolographicCard>

          <HolographicCard title="GROWTH TRAJECTORY" icon="ï¿½Y"^" delay={900}><FollowerTrend /></HolographicCard>

          <HolographicCard title="SESSION MATRIX" icon="â°" delay={1000}><SessionTimeline /></HolographicCard>

        </div>



        <div className="grid-section engagement-stats">

          <HolographicCard title="HEAT SIGNATURE" icon="ï¿½Y"ï¿½" delay={1100}><HeatmapStats /></HolographicCard>

          <HolographicCard title="REPLAY VALUE" icon="ï¿½Y""" delay={1200}><RewatchStats /></HolographicCard>

          <HolographicCard title="CHAT VELOCITY" icon="ï¿½Y'ï¿½" delay={1300}><ChatPeakGraph /></HolographicCard>

        </div>

      </div>



      {/* Data Stream (unverÃ¤ndert) */}

      <div className="data-stream-container">

        <div className="stream-header">

          <span className="stream-title">LIVE DATA STREAM</span>

          <span className="stream-status">RECEIVING...</span>

        </div>

        <div className="data-stream">

          {dataStream.map((b, i) => (

            <div

              key={b.id}

              className="data-bar"

              style={{

                transform: `scaleY(${Math.max(0.02, b.value / 100)})`,

                transformOrigin: "bottom",

                ["--delay" as any]: `${i * 0.05}s`,

                ["--color" as any]: b.value > 70 ? "#00ffff" : b.value > 40 ? "#a855f7" : "#ec4899",

              } as React.CSSProperties}

            />

          ))}

        </div>

      </div>

    </div>

  );

};



export default DashboardPage;


