"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  
  // Interactive hooks for authentication and mobile menu
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("admin@sturvixa.ai");
  const [password, setPassword] = useState("********");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic sandbox demo registration states
  const [modalMode, setModalMode] = useState<"login" | "demo">("login");
  const [demoName, setDemoName] = useState("");
  const [demoEmail, setDemoEmail] = useState("");
  const [demoCompany, setDemoCompany] = useState("");
  const [demoMessage, setDemoMessage] = useState("");
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // Stateful authentication gate hooks
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/console/dashboard");

  // Read active session state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("is_authenticated");
      if (auth === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Intercept all secure dashboard transitions
  const handleConsoleNavigate = (e: React.MouseEvent<HTMLElement> | null, path: string, mode: "login" | "demo" = "login") => {
    if (isAuthenticated) {
      if (e) e.preventDefault();
      router.push(path);
      return;
    }
    if (e) e.preventDefault();
    setRedirectPath(path);
    setModalMode(mode);
    setDemoSubmitted(false);
    setAuthError("");
    setShowLoginModal(true);
  };

  // Handles Mock Demo Request Submit
  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoName || !demoEmail || !demoCompany) {
      setAuthError("Name, Email, and Company are required.");
      return;
    }

    setIsLoading(true);
    setAuthError("");

    // Simulate sending demo request
    setTimeout(() => {
      setIsLoading(false);
      setDemoSubmitted(true);
      
      // Auto redirect to dashboard after showing success animation
      setTimeout(() => {
        sessionStorage.setItem("is_authenticated", "true");
        setIsAuthenticated(true);
        setShowLoginModal(false);
        setDemoSubmitted(false);
        router.push(redirectPath);
      }, 2200);
    }, 1200);
  };

  // Canvas and mouse movement refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroSectionRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  // Particle logic in useEffect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const heroSection = heroSectionRef.current;
    if (!heroSection) return;

    let particles: Particle[] = [];
    let animationFrameId: number;
    const mouse = { x: 0, y: 0, active: false };
    
    const particleCount = 60;
    const connectionDistance = 150;
    const repulsionRadius = 150;

    class Particle {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      vx: number = 0;
      vy: number = 0;

      constructor() {
        this.init();
      }

      init() {
        if (!canvas) return;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
      }

      update() {
        if (!canvas) return;
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off bounds
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Mouse repulsion
        if (mouse.active) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < repulsionRadius) {
            const force = (repulsionRadius - distance) / repulsionRadius;
            this.x += (dx / (distance || 1)) * force * 4;
            this.y += (dy / (distance || 1)) * force * 4;
          }
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = "rgba(195, 192, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const initParticles = () => {
      canvas.width = heroSection.offsetWidth;
      canvas.height = heroSection.offsetHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.strokeStyle = `rgba(195, 192, 255, ${0.08 * (1 - distance / connectionDistance)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    // Events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = heroSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouse.x = x;
      mouse.y = y;
      mouse.active = true;

      const glow = glowRef.current;
      if (glow) {
        glow.style.left = `${x}px`;
        glow.style.top = `${y}px`;
        glow.style.opacity = "1";
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      const glow = glowRef.current;
      if (glow) {
        glow.style.opacity = "0";
      }
    };

    const handleResize = () => {
      initParticles();
    };

    heroSection.addEventListener("mousemove", handleMouseMove);
    heroSection.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    initParticles();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      heroSection.removeEventListener("mousemove", handleMouseMove);
      heroSection.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Intersection Observer for scroll reveal effect
  useEffect(() => {
    const revealElements = document.querySelectorAll(".reveal");
    const observerOptions = {
      threshold: 0.05,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, observerOptions);

    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Handles Mock Sign In
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Email and password are required.");
      return;
    }

    setIsLoading(true);
    setAuthError("");

    // Simulate authenticating
    setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem("is_authenticated", "true");
      setIsAuthenticated(true);
      setShowLoginModal(false);
      router.push(redirectPath);
    }, 1200);
  };

  return (
    <div className="flex min-w-0 flex-col flex-1 bg-background text-on-surface select-none relative">
      
      {/* Crystalline Noise Overlay */}
      <div className="crystalline absolute inset-0 z-10 pointer-events-none opacity-[0.02]"></div>

      {/* Top Header Navigation matching high fidelity dashboard mockup */}
      <header className="bg-surface/60 backdrop-blur-xl border-b border-white/10 flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 sticky top-0 z-50">
        <div className="flex min-w-0 items-center gap-md">
          {/* Hamburger button for mobile landing page */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-white/5 flex items-center justify-center cursor-pointer"
            title="Open Navigation"
          >
            <span className="material-symbols-outlined text-headline-md">menu</span>
          </button>

          <Link 
            href="/"
            className="min-w-0 flex items-center gap-2 text-xl sm:text-headline-md font-headline-md font-bold text-primary tracking-normal cursor-pointer whitespace-nowrap"
          >
            <svg className="w-8 h-8 shrink-0" viewBox="110 70 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="headerLogoPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#CBD5E1" />
                  <stop offset="100%" stopColor="#F8FAFC" />
                </linearGradient>
                <linearGradient id="headerLogoAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0D9488" />
                  <stop offset="100%" stopColor="#2DD4BF" />
                </linearGradient>
              </defs>
              <g transform="translate(140, 80)">
                <path d="M0 40 C 0 10, 30 0, 60 0 L 120 0 L 120 30 L 60 30 C 45 30, 40 35, 40 45 L 40 70 L 10 70 L 10 40 Z" fill="url(#headerLogoPrimaryGrad)" />
                <path d="M120 120 C 120 150, 90 160, 60 160 L 0 160 L 0 130 L 60 130 C 75 130, 80 125, 80 115 L 80 90 L 110 90 L 110 120 Z" fill="url(#headerLogoPrimaryGrad)" />
                <rect x="35" y="75" width="50" height="10" rx="5" fill="url(#headerLogoAccentGrad)" />
              </g>
            </svg>
            <span>Sturvixa AI</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-md">
          <Link href="/console/dashboard" onClick={(e) => handleConsoleNavigate(e, "/console/dashboard")} className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 text-label-md font-label-md cursor-pointer">Dashboard</Link>
          <Link href="/console/analytics" onClick={(e) => handleConsoleNavigate(e, "/console/analytics")} className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 text-label-md font-label-md cursor-pointer">Analytics</Link>
          <Link href="/console/models" onClick={(e) => handleConsoleNavigate(e, "/console/models")} className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 text-label-md font-label-md cursor-pointer">Models</Link>
          <Link href="/console/datasets" onClick={(e) => handleConsoleNavigate(e, "/console/datasets")} className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 text-label-md font-label-md cursor-pointer">Datasets</Link>
        </nav>
        
        <div className="flex shrink-0 items-center gap-base">
          <Link href="/console/dashboard" onClick={(e) => handleConsoleNavigate(e, "/console/dashboard")} className="p-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center">
            <span className="material-symbols-outlined">search</span>
          </Link>
          <Link href="/console/dashboard" onClick={(e) => handleConsoleNavigate(e, "/console/dashboard")} className="p-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center">
            <span className="material-symbols-outlined">notifications</span>
          </Link>
          <Link href="/console/dashboard" onClick={(e) => handleConsoleNavigate(e, "/console/dashboard")} className="p-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center">
            <span className="material-symbols-outlined">settings</span>
          </Link>
          <Link href="/console/dashboard" onClick={(e) => handleConsoleNavigate(e, "/console/dashboard")} className="flex items-center ml-base">
            <img 
              alt="User profile" 
              className="w-8 h-8 rounded-full border border-white/10 cursor-pointer hover:border-primary/50 transition-colors" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKb4D59AeMNGbOL032mPxK0vVdxSz3C-BAQkZg1IW6z-mTn-JiAVB4GThQVbkHDfR6gLAfnQvGHonowy3N4UIexa0wc2CAeDDYmfIPRinZ1h9CtcrWxQfH0FmGyHfAxUZY8hWr8IjRITDwIrB1-CWq6V6GeDHGWDN-B4Ia1nzST-VVbY6x_SkF6xzi-Xu6BLLTncNeUabjsAMTvECYM5n6ukxHAznCJMQ6mX94IQGgBxbx4tZkWlcHZg7p25SK_vErbA4nfvLOOilO"
            />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section 
          ref={heroSectionRef} 
          className="relative min-h-[760px] lg:min-h-[900px] flex flex-col items-center justify-center pt-xl pb-lg px-margin-mobile md:px-margin-desktop overflow-hidden" 
          id="hero"
        >
          {/* Shifting radial color backdrops */}
          <div className="hero-gradient z-0"></div>
          <canvas ref={canvasRef} id="hero-canvas" className="z-0 pointer-events-none absolute inset-0 w-full h-full"></canvas>
          <div ref={glowRef} className="mouse-glow" id="hero-glow"></div>
          
          <div className="z-10 text-center w-full max-w-4xl mx-auto space-y-md relative reveal active">
            {/* Pill Container */}
            <div className="inline-flex items-center gap-xs px-base py-1 bg-surface-container-high border border-white/10 rounded-full mb-base">
              <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                <span className="material-symbols-outlined text-[15px] text-primary">verified_user</span>
                <span className="tracking-widest">v4.0 Enterprise Intelligence Now Live</span>
                <span className="text-primary font-bold">&gt;</span>
              </span>
            </div>
            
            {/* Bold Headline */}
            <h1 className="text-headline-xl font-headline-xl text-on-surface max-w-3xl mx-auto leading-tight text-balance">
              Ask Your Data <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">Anything</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-body-lg font-body-lg text-outline w-full max-w-2xl mx-auto leading-relaxed text-pretty">
              The first enterprise-grade generative AI platform that turns complex datasets into actionable executive insights with human-level reasoning.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 w-full max-w-2xl mx-auto">
              <Link 
                href="/console/dashboard"
                onClick={(e) => handleConsoleNavigate(e, "/console/dashboard")}
                className="inline-flex h-14 w-full min-w-[220px] items-center justify-center sm:w-auto px-8 whitespace-nowrap bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-container font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform shimmer overflow-hidden relative cursor-pointer text-center">
                Start Free Trial
              </Link>
              <button 
                onClick={(e) => handleConsoleNavigate(e, "/console/dashboard", "demo")}
                className="inline-flex h-14 w-full min-w-[220px] items-center justify-center sm:w-auto px-8 whitespace-nowrap border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-white/5 transition-colors relative overflow-hidden group cursor-pointer"
              >
                <span className="relative z-10">Book Demo</span>
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>

          {/* Interactive Console Mockup */}
          <Link 
            href="/console/dashboard"
            onClick={(e) => handleConsoleNavigate(e, "/console/dashboard")}
            className="block relative mt-xl w-full max-w-6xl mx-auto glass-panel rounded-2xl p-xs md:p-base shadow-2xl float-anim cursor-pointer hover:border-primary/30 transition-all duration-300 z-20 reveal active overflow-hidden"
          >
            <div className="crystalline absolute inset-0 rounded-2xl"></div>
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-white/5 flex flex-col lg:flex-row aspect-auto min-h-[420px] lg:aspect-[21/9]">
              
              {/* Sidebar Mockup */}
              <div className="hidden md:flex w-16 border-r border-white/5 flex-col items-center py-md space-y-md">
                <div className="w-8 h-8 bg-primary/30 border border-primary/50 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-primary rounded-sm"></div>
                </div>
                <div className="w-6 h-6 bg-surface-variant/40 rounded"></div>
                <div className="w-6 h-6 bg-surface-variant/40 rounded"></div>
                <div className="w-6 h-6 bg-surface-variant/40 rounded"></div>
              </div>
              
              {/* Center Dashboard View */}
              <div className="min-w-0 flex-1 p-md space-y-md overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-md">
                    <div className="h-6 w-48 bg-surface-variant/30 rounded-full flex items-center px-3">
                      <div className="h-1.5 w-24 bg-outline/25 rounded-full"></div>
                    </div>
                    <div className="h-8 w-8 bg-surface-variant/40 rounded-full"></div>
                  </div>
                  
                  {/* KPI Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm sm:gap-md">
                    <div className="h-32 bg-surface-container/50 border border-white/5 rounded-xl p-sm flex flex-col justify-between">
                      <div className="space-y-xs">
                        <div className="h-3 w-12 bg-surface-variant/40 rounded"></div>
                        <div className="h-2 w-8 bg-outline/20 rounded"></div>
                      </div>
                      <div className="h-8 w-full bg-primary/20 border border-primary/30 rounded-lg flex items-center px-sm">
                        <div className="h-2 w-16 bg-primary/60 rounded-full"></div>
                      </div>
                    </div>
                    <div className="h-32 bg-surface-container/50 border border-white/5 rounded-xl p-sm flex flex-col justify-between">
                      <div className="space-y-xs">
                        <div className="h-3 w-12 bg-surface-variant/40 rounded"></div>
                        <div className="h-2 w-8 bg-outline/20 rounded"></div>
                      </div>
                      <div className="h-8 w-full bg-secondary/20 border border-secondary/30 rounded-lg flex items-center px-sm">
                        <div className="h-2 w-16 bg-secondary/60 rounded-full"></div>
                      </div>
                    </div>
                    <div className="h-32 bg-surface-container/50 border border-white/5 rounded-xl p-sm flex flex-col justify-between">
                      <div className="space-y-xs">
                        <div className="h-3 w-12 bg-surface-variant/40 rounded"></div>
                        <div className="h-2 w-8 bg-outline/20 rounded"></div>
                      </div>
                      <div className="h-8 w-full bg-tertiary/20 border border-tertiary/30 rounded-lg flex items-center px-sm">
                        <div className="h-2 w-16 bg-tertiary/60 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* SVG Visual Line Chart */}
                <div className="h-44 bg-surface-container/40 rounded-xl border border-white/5 relative overflow-hidden flex flex-col justify-between p-sm">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-28 bg-surface-variant/30 rounded"></div>
                    <div className="flex gap-xs">
                      <div className="h-2 w-6 bg-primary/30 rounded-full"></div>
                      <div className="h-2 w-6 bg-secondary/30 rounded-full"></div>
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-28 flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="primary-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="secondary-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M 0 60 Q 100 20 200 70 T 400 40 T 500 60 L 500 100 L 0 100 Z" 
                        fill="url(#secondary-grad)" 
                      />
                      <path 
                        d="M 0 60 Q 100 20 200 70 T 400 40 T 500 60" 
                        fill="none" 
                        stroke="var(--color-secondary)" 
                        strokeWidth="1.5" 
                        opacity="0.4"
                      />
                      <path 
                        d="M 0 80 Q 120 40 240 85 T 450 35 T 500 50 L 500 100 L 0 100 Z" 
                        fill="url(#primary-grad)" 
                      />
                      <path 
                        d="M 0 80 Q 120 40 240 85 T 450 35 T 500 50" 
                        fill="none" 
                        stroke="var(--color-primary)" 
                        strokeWidth="2" 
                      />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Right Side AI Copilot */}
              <div className="hidden lg:flex lg:w-80 lg:border-l border-t lg:border-t-0 border-white/5 bg-surface-container-low/40 p-md flex-col justify-between">
                <div>
                  <div className="text-label-sm font-label-sm text-primary mb-md flex items-center gap-xs font-bold tracking-widest">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    AI CO-PILOT
                  </div>
                  <div className="space-y-md flex flex-col">
                    <div className="bg-surface-variant/40 p-sm rounded-xl text-xs text-outline border border-white/5 max-w-[85%] self-start">
                      What were the key drivers for Q3 revenue growth?
                    </div>
                    <div className="bg-primary-container/10 p-sm rounded-xl text-xs text-on-primary-container border border-primary/20 max-w-[90%] self-end">
                      The <span className="text-primary font-bold">14% growth</span> in Q3 was primarily driven by the expansion of the APAC market...
                    </div>
                  </div>
                </div>
                <div className="h-10 bg-surface-container rounded-full border border-white/10 flex items-center px-sm gap-sm">
                  <div className="flex-1 text-[10px] text-outline">Type a command...</div>
                  <span className="material-symbols-outlined text-sm text-primary">send</span>
                </div>
              </div>

            </div>
          </Link>
        </section>

        {/* Customer Logos Section */}
        <section className="py-12 border-y border-white/5 bg-surface-container-lowest/30 overflow-hidden">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
            <p className="text-center text-[11px] tracking-[0.25em] uppercase text-white/35 mb-8 font-semibold">
              Trusted By Fortune 500 Innovators
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 items-center justify-items-center gap-x-8 gap-y-6 text-white/60">
              {[
                ["architecture", "VECTOR"],
                ["token", "QUANTUM"],
                ["cloud_done", "STRATUS"],
                ["account_tree", "NEXUS"],
                ["grain", "SYNAPSE"],
              ].map(([icon, label]) => (
                <div key={label} className="enterprise-logo flex items-center gap-2 text-sm font-bold tracking-[0.18em]">
                  <span className="material-symbols-outlined text-[20px] text-primary/80">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-xl px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
          <div className="mb-lg text-center reveal">
            <h2 className="text-headline-lg font-headline-lg text-on-surface mb-base">Precision Intelligence Infrastructure</h2>
            <p className="text-body-md font-body-md text-outline max-w-2xl mx-auto">Eliminate guesswork with features designed for high-velocity decision making.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            
            {/* Bento Card 1 (Advanced AI Analytics) */}
            <Link 
              href="/console/analytics"
              onClick={(e) => handleConsoleNavigate(e, "/console/analytics")}
              className="md:col-span-8 glass-panel rounded-2xl p-md md:p-lg flex min-w-0 flex-col md:flex-row gap-lg group hover:border-primary/30 transition-all reveal cursor-pointer"
            >
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-10 pointer-events-none"></div>
              <div className="min-w-0 flex-1 space-y-md flex flex-col justify-between">
                <div className="space-y-md">
                  <span className="p-base bg-primary/10 text-primary rounded-xl inline-flex material-symbols-outlined">
                    monitoring
                  </span>
                  <h3 className="text-headline-md font-headline-md">Advanced AI Analytics</h3>
                  <p className="text-body-md text-outline">
                    Our proprietary neural engine identifies patterns and anomalies across trillion-row datasets in milliseconds, delivering ready-to-present visualizations automatically.
                  </p>
                </div>
                <ul className="space-y-sm text-label-md text-on-surface-variant pt-base">
                  <li className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary text-body-md">check_circle</span>
                    Predictive modeling &amp; trend forecasting
                  </li>
                  <li className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary text-body-md">check_circle</span>
                    Anomaly detection &amp; threat mapping
                  </li>
                </ul>
              </div>
              <div className="flex-1 relative min-h-[200px] bg-surface-container rounded-xl overflow-hidden border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent z-10 pointer-events-none"></div>
                <img 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaOTxrbuRXodGa7amgqtcJH4YYMrMOjsW10Y98jXW-dNSo-zyymiNEFxsr7Ixrcusq9lFbFsHgdutKHbmb1or6ULKBv-cVLSBPnPrK49xaibkH0-zlFl-5CtBAZcLK0uX3tDWaMIHUvq-y7pHBsz5xQvs0gPkkwhzeDBbc_sle-HsTllTBqE95ijlO8DXrnNTl_PA_RAt_EOGyl0UiDnI1n2a988iVhwFeXgJhQNwbXe5-wGspCmmag1QEspAazKXpCBjbenmZ_FfA"
                  alt="Holographic digital wave structure"
                />
              </div>
            </Link>

            {/* Bento Card 2 (Natural Language Querying) */}
            <Link 
              href="/console/copilot"
              onClick={(e) => handleConsoleNavigate(e, "/console/copilot")}
              className="md:col-span-4 glass-panel rounded-2xl p-md md:p-lg flex min-w-0 flex-col justify-between gap-md group hover:border-secondary/30 transition-all reveal cursor-pointer"
            >
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-10 pointer-events-none"></div>
              <div className="space-y-md">
                <span className="p-base bg-secondary/10 text-secondary rounded-xl inline-flex w-fit material-symbols-outlined">
                  forum
                </span>
                <h3 className="text-headline-md font-headline-md">Natural Language Querying</h3>
                <p className="text-body-md text-outline">
                  No SQL required. Ask questions in plain English and receive instant, structured data responses formatted for your specific business context.
                </p>
              </div>
              <div className="pt-md border-t border-white/5 flex items-center justify-between">
                <span className="text-label-sm font-label-sm text-secondary uppercase tracking-widest font-bold">LEARN MORE</span>
                <span className="material-symbols-outlined text-secondary font-bold">arrow_forward</span>
              </div>
            </Link>

            {/* Bento Card 3 (Bento-Style Builder) */}
            <Link 
              href="/console/dashboard"
              onClick={(e) => handleConsoleNavigate(e, "/console/dashboard")}
              className="md:col-span-4 glass-panel rounded-2xl p-md md:p-lg flex min-w-0 flex-col justify-between gap-md group hover:border-tertiary/30 transition-all reveal cursor-pointer"
            >
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-10 pointer-events-none"></div>
              <div className="space-y-md">
                <span className="p-base bg-tertiary/10 text-tertiary rounded-xl inline-flex w-fit material-symbols-outlined">
                  dashboard_customize
                </span>
                <h3 className="text-headline-md font-headline-md">Bento-Style Builder</h3>
                <p className="text-body-md text-outline">
                  Build sophisticated executive dashboards in minutes using our intuitive drag-and-drop bento grid interface with intelligent placement.
                </p>
              </div>
              <div className="mt-auto h-24 bg-surface-container rounded-lg overflow-hidden flex items-end px-xs gap-xs border border-white/5">
                <div className="flex-1 h-[30%] bg-tertiary/30 rounded-t float-anim"></div>
                <div className="flex-1 h-[60%] bg-tertiary/30 rounded-t float-anim-delay"></div>
                <div className="flex-1 h-[90%] bg-tertiary/30 rounded-t float-anim"></div>
                <div className="flex-1 h-[50%] bg-tertiary/30 rounded-t float-anim-delay"></div>
              </div>
            </Link>

            {/* Bento Card 4 (Interoperability) */}
            <Link 
              href="/console/datasets"
              onClick={(e) => handleConsoleNavigate(e, "/console/datasets")}
              className="md:col-span-8 glass-panel rounded-2xl p-md md:p-lg flex min-w-0 flex-col justify-between gap-md group hover:border-primary/30 transition-all reveal cursor-pointer text-center md:text-left"
            >
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-10 pointer-events-none"></div>
              <div className="space-y-md">
                <h3 className="text-headline-md font-headline-md">Unmatched Enterprise Interoperability</h3>
                <p className="w-full max-w-3xl text-lg leading-8 text-gray-400 text-pretty">
                  Connect to your entire stack with 200+ native connectors including Snowflake, AWS, Salesforce, and SAP. No migrations needed-Sturvixa reads data at the source.
                </p>
              </div>
              <div className="flex justify-center md:justify-start gap-md pt-base">
                <div className="p-md bg-surface-container rounded-xl border border-white/5 hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-headline-md">database</span>
                </div>
                <div className="p-md bg-surface-container rounded-xl border border-white/5 hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-headline-md">cloud</span>
                </div>
                <div className="p-md bg-surface-container rounded-xl border border-white/5 hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-headline-md">hub</span>
                </div>
                <div className="p-md bg-surface-container rounded-xl border border-white/5 hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-headline-md">integration_instructions</span>
                </div>
              </div>
            </Link>

          </div>
        </section>

        {/* Scalable Intelligence Tiers (Pricing) */}
        <section id="pricing" className="py-xl px-margin-mobile md:px-margin-desktop bg-surface-container-lowest/30 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-lg reveal">
              <h2 className="text-headline-lg font-headline-lg text-on-surface">Scalable Intelligence Tiers</h2>
              <p className="text-body-md font-body-md text-outline mt-2">Transparent pricing for organizations at every stage of AI maturity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              
              {/* Startup Plan */}
              <div className="glass-panel p-6 md:p-8 rounded-2xl flex min-h-[540px] flex-col justify-between gap-6 border border-white/5 reveal">
                <div className="space-y-md">
                  <div className="space-y-xs">
                    <p className="text-label-sm font-label-sm text-outline uppercase tracking-widest">Startup</p>
                    <h3 className="text-headline-md font-headline-md">
                      $499<span className="text-body-md text-outline font-normal">/mo</span>
                    </h3>
                  </div>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">For small teams getting started with automated reporting.</p>
                  <ul className="space-y-sm text-label-md text-on-surface-variant font-medium pt-md border-t border-white/5">
                    <li className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-body-md">done</span> 5 Data Connectors
                    </li>
                    <li className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-body-md">done</span> 1,000 AI Queries/mo
                    </li>
                    <li className="flex items-center gap-sm text-outline/40">
                      <span className="material-symbols-outlined text-body-md">close</span> Custom Training
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={(e) => handleConsoleNavigate(e, "/console/dashboard", "login")}
                  className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-lg border border-outline-variant text-on-surface hover:border-primary/45 hover:bg-white/5 transition-all font-semibold cursor-pointer"
                >
                  Get Started
                </button>
              </div>

              {/* Growth Plan (Popular Featured tier) */}
              <div className="relative flex min-h-[540px] flex-col justify-between gap-6 rounded-2xl border border-primary/45 bg-primary/10 backdrop-blur-xl p-6 pt-8 md:p-8 md:pt-10 shadow-2xl overflow-visible">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-primary text-on-primary text-[10px] font-bold rounded-full uppercase tracking-wider border border-white/20 shadow-lg whitespace-nowrap">
                  Most Popular
                </div>
                <div className="crystalline absolute inset-0 rounded-2xl"></div>
                
                <div className="space-y-md">
                  <div className="space-y-xs">
                    <p className="text-label-sm font-label-sm text-primary uppercase tracking-widest">Growth</p>
                    <h3 className="text-headline-md font-headline-md">
                      $1,299<span className="text-body-md text-outline font-normal">/mo</span>
                    </h3>
                  </div>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">For high-growth companies requiring deep analytics.</p>
                  <ul className="space-y-sm text-label-md text-on-surface-variant font-medium pt-md border-t border-primary/20">
                    <li className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-body-md">done</span> 50 Data Connectors
                    </li>
                    <li className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-body-md">done</span> Unlimited AI Queries
                    </li>
                    <li className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-body-md">done</span> Predictor API Access
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={(e) => handleConsoleNavigate(e, "/console/dashboard", "login")}
                  className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap bg-primary text-on-primary rounded-lg shadow-lg hover:brightness-110 transition-all font-bold shimmer relative overflow-hidden cursor-pointer"
                >
                  Start Free Trial
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="glass-panel p-6 md:p-8 rounded-2xl flex min-h-[540px] flex-col justify-between gap-6 border border-white/5 reveal">
                <div className="space-y-md">
                  <div className="space-y-xs">
                    <p className="text-label-sm font-label-sm text-outline uppercase tracking-widest">Enterprise</p>
                    <h3 className="text-headline-md font-headline-md">Custom</h3>
                  </div>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">Bespoke infrastructure for global scale and security.</p>
                  <ul className="space-y-sm text-label-md text-on-surface-variant font-medium pt-md border-t border-white/5">
                    <li className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-body-md">done</span> Private Cloud Deploy
                    </li>
                    <li className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-body-md">done</span> Custom LLM Training
                    </li>
                    <li className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-body-md">done</span> 24/7 Priority Support
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={(e) => handleConsoleNavigate(e, "/console/dashboard", "demo")}
                  className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-lg border border-outline-variant text-on-surface hover:border-primary/45 hover:bg-white/5 transition-all font-semibold cursor-pointer"
                >
                  Contact Sales
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* Executive Testimonial Quote */}
        <section className="py-xl px-margin-desktop text-center relative overflow-hidden">
          <div className="max-w-3xl mx-auto glass-panel p-xl rounded-[2rem] border-white/10 relative reveal">
            <span className="text-[120px] font-serif font-bold text-primary/10 absolute -top-16 left-1/2 -translate-x-1/2 select-none">&quot;</span>
            
            <p className="text-headline-md italic font-light text-on-surface mb-lg leading-relaxed relative z-10">
              &quot;Sturvixa AI didn&apos;t just give us a dashboard; they gave us a board member who never sleeps. Our decision velocity has increased by 4x since implementation.&quot;
            </p>
            <div className="flex flex-col items-center gap-base relative z-10">
              <img 
                alt="Dayamay Das headshot" 
                className="w-16 h-16 rounded-full border-2 border-primary object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBliHfxAgSkrnilnO_mr2EtqlHRD1NNnmQf1XOfHu_menIuZ6VUT7m4fJhWcGiDmi0PxZjbk_Ok4fXib1IepMeQBecyJy9-gX_c7njIDlkw9LhcibNMURIhl0yrsCzbuddGiqdBinoPPMGKORP7ZrmQObCcb4W8SE8-FYwg_qcjYdVeVAk4SCx4FmgI8ou132nzpXX8imzivIiWqy0vQgqkulPEhCC_VNlBiDpxhxXGrlQhyt1loQ5dNa4kiOFcTPJVZhb79XW1OE0G"
              />
              <div>
                <p className="font-bold text-on-surface text-body-md">Dayamay Das</p>
                <p className="text-label-sm text-outline uppercase tracking-wider">Chief Data Officer, Global Logistics Corp</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer conforming strictly to mockup navigation items */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant w-full py-lg px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-md z-30">
        <div className="flex flex-col items-center md:items-start gap-xs text-center md:text-left">
          <span className="text-label-md font-bold text-on-surface">Sturvixa AI</span>
          <p className="text-label-sm font-label-sm text-outline">(c) 2026 Sturvixa AI. Visionary Reliability.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-md">
          <a className="text-label-sm font-label-sm text-outline hover:text-on-surface opacity-80 hover:opacity-100 transition-colors" href="#">Privacy Policy</a>
          <a className="text-label-sm font-label-sm text-outline hover:text-on-surface opacity-80 hover:opacity-100 transition-colors" href="#">Terms of Service</a>
          <a className="text-label-sm font-label-sm text-outline hover:text-on-surface opacity-80 hover:opacity-100 transition-colors" href="#">Security</a>
          <a className="text-label-sm font-label-sm text-outline hover:text-on-surface opacity-80 hover:opacity-100 transition-colors" href="#">Status</a>
        </div>
        <div className="flex gap-md">
          <a className="text-outline hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
          <a className="text-outline hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">alternate_email</span></a>
        </div>
      </footer>

      {/* STATEFUL AUTHENTICATION & DEMO REQUEST MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-50 animate-fade-in">
          <div className="glass-panel w-full max-w-[640px] sm:max-w-[560px] max-h-[calc(100vh-2rem)] overflow-y-auto p-6 sm:p-8 rounded-2xl shadow-2xl relative border-primary/20">
            <div className="crystalline absolute inset-0 rounded-2xl"></div>
            
            <button 
              onClick={() => {
                setShowLoginModal(false);
                setDemoSubmitted(false);
              }}
              className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors p-1 cursor-pointer z-20"
              title="Close Dialog"
            >
              <span className="material-symbols-outlined text-body-lg">close</span>
            </button>

            {demoSubmitted ? (
              <div className="text-center py-lg space-y-md animate-fade-in relative z-10">
                <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center mx-auto text-primary animate-bounce">
                  <span className="material-symbols-outlined text-headline-lg font-bold">verified</span>
                </div>
                <div className="space-y-xs">
                  <h3 className="text-headline-md font-bold text-on-surface">Request Transmitted!</h3>
                  <p className="text-label-sm text-outline px-sm leading-relaxed">
                    Demo credentials generated. Node access authorization is pending review. Redirecting to your sandbox console environment...
                  </p>
                </div>
                <div className="flex items-center justify-center gap-xs text-primary font-bold text-label-sm animate-pulse">
                  <span className="material-symbols-outlined animate-spin text-label-md">sync</span>
                  Initializing Secure Connection...
                </div>
              </div>
            ) : (
              <>
                {/* Tab Switcher */}
                <div className="flex min-w-0 bg-surface-container rounded-lg p-1 border border-white/5 select-none text-label-sm font-bold mb-6 relative z-10">
                  <button 
                    onClick={() => {
                      setModalMode("login");
                      setAuthError("");
                    }}
                    className={`flex-1 min-w-0 px-3 py-2 rounded-md transition-all cursor-pointer text-center whitespace-nowrap ${
                      modalMode === "login" ? "bg-surface-container-highest text-on-surface shadow-sm" : "text-outline hover:text-on-surface"
                    }`}
                  >
                    Console Sign In
                  </button>
                  <button 
                    onClick={() => {
                      setModalMode("demo");
                      setAuthError("");
                    }}
                    className={`flex-1 min-w-0 px-3 py-2 rounded-md transition-all cursor-pointer text-center whitespace-nowrap ${
                      modalMode === "demo" ? "bg-surface-container-highest text-on-surface shadow-sm" : "text-outline hover:text-on-surface"
                    }`}
                  >
                    Request Demo
                  </button>
                </div>

                {modalMode === "login" ? (
                  <>
                    <div className="text-center mb-6 space-y-2 relative z-10">
                      <span className="text-primary font-extrabold tracking-normal text-2xl sm:text-3xl">
                        Sturvixa <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Console</span>
                      </span>
                      <p className="text-sm text-outline">Enter credentials to access the enterprise intelligence suite.</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-5 relative z-10">
                      {authError && (
                        <div className="p-sm bg-error/10 border border-error/35 text-error text-label-sm rounded-lg">
                          {authError}
                        </div>
                      )}

                      <div className="space-y-xs">
                        <label className="text-label-sm text-outline font-bold">Email Address</label>
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full min-w-0 bg-surface-container border-b-2 border-outline-variant focus:border-primary px-4 py-3 text-base text-on-surface outline-none rounded-t-lg transition-colors"
                          placeholder="admin@sturvixa.ai"
                        />
                      </div>

                      <div className="space-y-xs">
                        <label className="text-label-sm text-outline font-bold">Access Token / Password</label>
                        <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full min-w-0 bg-surface-container border-b-2 border-outline-variant focus:border-primary px-4 py-3 text-base text-on-surface outline-none rounded-t-lg transition-colors"
                          placeholder="********"
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap mt-2 bg-gradient-to-r from-primary-container to-secondary-container text-on-primary-container font-extrabold rounded-xl shadow-lg hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-body-md">sync</span>
                            Authenticating Node...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-body-md">login</span>
                            Initiate Secure Connection
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-md pt-md border-t border-white/5 flex flex-col gap-sm text-center relative z-10">
                      <button 
                        onClick={() => {
                          setIsLoading(true);
                          setTimeout(() => {
                            setIsLoading(false);
                            sessionStorage.setItem("is_authenticated", "true");
                            setIsAuthenticated(true);
                            setShowLoginModal(false);
                            router.push(redirectPath);
                          }, 800);
                        }}
                        className="w-full py-2 bg-primary/10 border border-primary/20 text-primary font-bold rounded-lg text-label-sm hover:bg-primary/25 transition-all flex items-center justify-center gap-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-label-md">bolt</span>
                        Sign In as Demo Admin (Fast-track)
                      </button>
                      
                      <span className="text-[10px] text-outline opacity-60">
                        Connection protected by enterprise 256-bit elliptic-curve cryptography.
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-6 space-y-2 relative z-10">
                      <span className="text-secondary font-extrabold tracking-normal text-2xl sm:text-3xl">
                        Request <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Enterprise Demo</span>
                      </span>
                      <p className="text-sm text-outline">Schedule a live neural node workspace run with our solutions engineering team.</p>
                    </div>

                    <form onSubmit={handleDemoSubmit} className="space-y-4 relative z-10">
                      {authError && (
                        <div className="p-sm bg-error/10 border border-error/35 text-error text-label-sm rounded-lg">
                          {authError}
                        </div>
                      )}

                      <div className="space-y-xs">
                        <label className="text-label-sm text-outline font-bold">Full Name</label>
                        <input 
                          type="text" 
                          value={demoName}
                          onChange={(e) => setDemoName(e.target.value)}
                          className="w-full min-w-0 bg-surface-container border-b-2 border-outline-variant focus:border-secondary px-4 py-3 text-base text-on-surface outline-none rounded-t-lg transition-colors"
                          placeholder="Dayamay Das"
                          required
                        />
                      </div>

                      <div className="space-y-xs">
                        <label className="text-label-sm text-outline font-bold">Work Email</label>
                        <input 
                          type="email" 
                          value={demoEmail}
                          onChange={(e) => setDemoEmail(e.target.value)}
                          className="w-full min-w-0 bg-surface-container border-b-2 border-outline-variant focus:border-secondary px-4 py-3 text-base text-on-surface outline-none rounded-t-lg transition-colors"
                          placeholder="dayamay.das@logistics.corp"
                          required
                        />
                      </div>

                      <div className="space-y-xs">
                        <label className="text-label-sm text-outline font-bold">Company / Organization</label>
                        <input 
                          type="text" 
                          value={demoCompany}
                          onChange={(e) => setDemoCompany(e.target.value)}
                          className="w-full min-w-0 bg-surface-container border-b-2 border-outline-variant focus:border-secondary px-4 py-3 text-base text-on-surface outline-none rounded-t-lg transition-colors"
                          placeholder="Global Logistics Corp"
                          required
                        />
                      </div>

                      <div className="space-y-xs">
                        <label className="text-label-sm text-outline font-bold">Use Case Details (Optional)</label>
                        <input 
                          type="text" 
                          value={demoMessage}
                          onChange={(e) => setDemoMessage(e.target.value)}
                          className="w-full min-w-0 bg-surface-container border-b-2 border-outline-variant focus:border-secondary px-4 py-3 text-base text-on-surface outline-none rounded-t-lg transition-colors"
                          placeholder="Automating Q3 telemetry anomaly resolutions."
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap mt-2 bg-gradient-to-r from-secondary-container to-primary-container text-on-secondary-container font-extrabold rounded-xl shadow-lg hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <span className="material-symbols-outlined animate-spin text-body-md">sync</span>
                            Provisioning Workspace...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-body-md">auto_awesome</span>
                            Request Sandbox Access
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-md pt-md border-t border-white/5 text-center relative z-10">
                      <span className="text-[10px] text-outline opacity-60">
                        Demo workspace features fully simulated NeonDB tables &amp; telemetry streams.
                      </span>
                    </div>
                  </>
                )}
              </>
            )}

          </div>
        </div>
      )}

      {/* MOBILE NAV DRAWER (Glassmorphic) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          
          {/* Drawer Content */}
          <aside className="relative w-80 max-w-[85vw] h-full bg-[#13121bf2] backdrop-blur-2xl border-r border-white/10 p-md flex flex-col justify-between shadow-2xl animate-slide-in">
            <div className="space-y-lg flex flex-col h-full overflow-y-auto">
              <div className="flex justify-between items-center pb-sm border-b border-white/5">
                <span className="text-headline-md font-bold text-primary tracking-tight">
                  Sturvixa AI
                </span>
                
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-outline hover:text-primary transition-colors rounded-lg hover:bg-white/5 flex items-center justify-center cursor-pointer"
                  title="Close Navigation"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <nav className="flex flex-col gap-sm">
                <Link
                  href="/console/dashboard"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleConsoleNavigate(e, "/console/dashboard");
                  }}
                  className="w-full text-left p-md rounded-xl border border-white/0 hover:border-white/5 hover:bg-white/5 text-on-surface-variant hover:text-primary transition-all font-bold text-label-md cursor-pointer"
                >
                  Dashboard
                </Link>
                <Link
                  href="/console/analytics"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleConsoleNavigate(e, "/console/analytics");
                  }}
                  className="w-full text-left p-md rounded-xl border border-white/0 hover:border-white/5 hover:bg-white/5 text-on-surface-variant hover:text-primary transition-all font-bold text-label-md cursor-pointer"
                >
                  Analytics
                </Link>
                <Link
                  href="/console/models"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleConsoleNavigate(e, "/console/models");
                  }}
                  className="w-full text-left p-md rounded-xl border border-white/0 hover:border-white/5 hover:bg-white/5 text-on-surface-variant hover:text-primary transition-all font-bold text-label-md cursor-pointer"
                >
                  Models
                </Link>
                <Link
                  href="/console/datasets"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleConsoleNavigate(e, "/console/datasets");
                  }}
                  className="w-full text-left p-md rounded-xl border border-white/0 hover:border-white/5 hover:bg-white/5 text-on-surface-variant hover:text-primary transition-all font-bold text-label-md cursor-pointer"
                >
                  Datasets
                </Link>
              </nav>
            </div>

            <div className="p-md bg-surface-container-lowest border border-white/5 rounded-xl space-y-sm mt-auto">
              <span className="text-[10px] text-outline uppercase tracking-widest block font-bold">
                ENTERPRISE TELEMETRY NODE
              </span>
              <div className="flex justify-between items-center text-[10px] font-bold text-outline">
                <span>Frankfurt EU-1</span>
                <span className="text-emerald-400 font-extrabold flex items-center gap-xs">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Connected
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
