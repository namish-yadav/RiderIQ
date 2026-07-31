"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  
  --pill-bg-1: rgba(255, 255, 255, 0.05);
  --pill-bg-2: rgba(255, 255, 255, 0.02);
  --pill-shadow: rgba(0, 0, 0, 0.5);
  --pill-highlight: rgba(255, 255, 255, 0.12);
  --pill-inset-shadow: rgba(0, 0, 0, 0.8);
  --pill-border: rgba(255, 255, 255, 0.1);
  
  --pill-bg-1-hover: rgba(255, 255, 255, 0.12);
  --pill-bg-2-hover: rgba(255, 255, 255, 0.05);
  --pill-border-hover: rgba(6, 182, 212, 0.4);
  --pill-shadow-hover: rgba(6, 182, 212, 0.2);
  --pill-highlight-hover: rgba(255, 255, 255, 0.25);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.9; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.6)); }
  15%, 45% { transform: scale(1.25); filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.9)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 35s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

.footer-bg-grid {
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    rgba(6, 182, 212, 0.18) 0%, 
    rgba(124, 58, 237, 0.15) 40%, 
    transparent 70%
  );
}

.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 10px 30px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 
      0 20px 40px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: #ffffff;
}

.footer-giant-bg-text {
  font-size: 24vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.07);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 65%);
  -webkit-background-clip: text;
  background-clip: text;
}

.footer-text-glow {
  background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.4) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 25px rgba(6, 182, 212, 0.25));
}
`;

export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & 
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };

        element.addEventListener("mousemove", handleMouseMove as any);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as any);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as any).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>RIDE SMARTER</span> <span className="text-cyan-400">✦</span>
    <span>RIDE FURTHER</span> <span className="text-purple-400">✦</span>
    <span>SMART ROUTE INTELLIGENCE</span> <span className="text-cyan-400">✦</span>
    <span>FUEL & SERVICE TRACKING</span> <span className="text-purple-400">✦</span>
    <span>LEAN ANGLE TELEMETRY</span> <span className="text-cyan-400">✦</span>
    <span>BUILT FOR RIDERS</span> <span className="text-purple-400">✦</span>
  </div>
);

export function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 85%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 50%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      
      <div
        ref={wrapperRef}
        className="relative min-h-[100vh] md:min-h-[85vh] w-full"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <footer className="relative md:fixed md:bottom-0 md:left-0 flex min-h-[100vh] md:min-h-[85vh] w-full flex-col justify-between overflow-hidden bg-black text-white cinematic-footer-wrapper py-6 md:py-0">
          
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[90px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute -bottom-[2vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none uppercase"
          >
            RIDER IQ
          </div>

          <div className="relative md:absolute top-0 md:top-10 left-0 w-full overflow-hidden border-y border-white/10 bg-black/70 backdrop-blur-md py-3 md:py-4 z-10 md:-rotate-1 md:scale-105 shadow-2xl my-3 md:my-0">
            <div className="flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-extrabold tracking-[0.3em] text-neutral-400 uppercase">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 md:px-6 my-6 md:mt-20 w-full max-w-5xl mx-auto text-center">
            <div className="text-cyan-400 font-mono text-[10px] md:text-xs uppercase tracking-widest mb-3 border border-cyan-500/30 px-3 py-1 rounded-full bg-cyan-950/30 backdrop-blur-sm inline-block mx-auto">
              EARLY ACCESS
            </div>
            
            <h2
              ref={headingRef}
              className="text-3xl sm:text-4xl md:text-7xl font-black footer-text-glow tracking-tighter mb-4 md:mb-6 text-center leading-tight sm:leading-none"
            >
              Ready for the next ride.
            </h2>

            <p className="text-neutral-400 max-w-lg mx-auto text-xs sm:text-sm md:text-base mb-6 md:mb-8 text-center px-2">
              RiderIQ is engineered for riders who demand precision, telemetry, and intelligent route insights.
            </p>

            <div ref={linksRef} className="flex flex-col items-center justify-center gap-5 md:gap-6 w-full max-w-full my-4 md:my-0">
              {/* 1. Download Button */}
              <div className="flex flex-wrap justify-center items-center gap-4 w-full text-center">
                <MagneticButton
                  as="a"
                  href="https://github.com/namish-yadav/rideiq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-glass-pill px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-white font-bold text-xs sm:text-sm md:text-base flex items-center justify-center gap-2.5 bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-400 shadow-xl shadow-cyan-500/10 min-h-[44px] mx-auto text-center"
                >
                  <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download App / GitHub Repo</span>
                </MagneticButton>
              </div>

              {/* 2. Credits (Social Links) */}
              <div className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-3 w-full text-center">
                <MagneticButton
                  as="a"
                  href="https://instagram.com/nam7sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-glass-pill px-4 sm:px-5 py-2.5 rounded-full text-neutral-300 font-medium text-xs md:text-sm hover:text-white flex items-center justify-center gap-2 min-h-[44px] text-center"
                >
                  <span>Instagram</span>
                  <span className="text-cyan-400 text-xs">@nam7sh</span>
                </MagneticButton>

                <MagneticButton
                  as="a"
                  href="https://github.com/namish-yadav"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-glass-pill px-4 sm:px-5 py-2.5 rounded-full text-neutral-300 font-medium text-xs md:text-sm hover:text-white flex items-center justify-center gap-2 min-h-[44px] text-center"
                >
                  <span>GitHub</span>
                  <span className="text-cyan-400 text-xs">namish-yadav</span>
                </MagneticButton>

                <MagneticButton
                  as="a"
                  href="https://www.linkedin.com/in/namish-yadav-639769408/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-glass-pill px-4 sm:px-5 py-2.5 rounded-full text-neutral-300 font-medium text-xs md:text-sm hover:text-white flex items-center justify-center gap-2 min-h-[44px] text-center"
                >
                  <span>LinkedIn</span>
                  <span className="text-cyan-400 text-xs">Namish Yadav</span>
                </MagneticButton>
              </div>
            </div>
          </div>

          <div className="relative z-20 w-full pt-4 pb-6 px-4 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-center">
            <div className="text-neutral-400 text-[10px] sm:text-[11px] md:text-xs font-semibold tracking-wider uppercase order-2 md:order-1 flex items-center justify-center gap-2 flex-wrap">
              <span className="font-extrabold text-white">RIDER IQ</span>
              <span>•</span>
              <span>© 2026 RiderIQ</span>
              <span>•</span>
              <span className="text-neutral-400">Built for the ride.</span>
            </div>

            <div className="footer-glass-pill px-4 sm:px-5 py-2 rounded-full flex items-center justify-center gap-2 order-1 md:order-2 cursor-default border-white/10 mx-auto md:mx-0">
              <span className="text-neutral-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Designed & Built</span>
              <span className="animate-footer-heartbeat text-xs md:text-sm text-cyan-400">⚡</span>
              <span className="text-neutral-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">for Riders</span>
            </div>

            <MagneticButton
              as="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="w-11 h-11 rounded-full footer-glass-pill flex items-center justify-center text-neutral-400 hover:text-white group order-3 mx-auto md:mx-0"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}
