import { useState, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/Accordion';
import { Instagram, Twitter, Mail, ArrowRight } from 'lucide-react';
import { RxDiscordLogo } from "react-icons/rx";
import Tooltip from '../components/Tooltip';
import { supabase } from '../lib/supabase';

// Assets
import bgImage from '../assets/images/hero-bg-2.png';
import logoFull from '../assets/images/logo_full.png';
import giftBoxGif from '../assets/images/gift.gif';
import successAnimation from '../assets/images/success1.apng';

gsap.registerPlugin(useGSAP);


const ComingSoon = () => {
    // Refs for GSAP
    const containerRef = useRef<HTMLDivElement>(null);
    const leftColRef = useRef<HTMLDivElement>(null);
    const rightColRef = useRef<HTMLDivElement>(null);
    const modalOverlayRef = useRef<HTMLDivElement>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);
    const discordBtnRef = useRef<HTMLDivElement>(null);


    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focused, setFocused] = useState(false);
    const [subscribeStatus, setSubscribeStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Gift modal & claim tracking
    const [modalOpen, setModalOpen] = useState(false);
    const [claimMessage, setClaimMessage] = useState('');
    const [claimError, setClaimError] = useState('');


    // New state for gift email
    const [giftEmail, setGiftEmail] = useState('');

    // GSAP Intro Animation
    useGSAP(() => {
        // Hero Content Stagger
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // 1. Title Reveal (Slide Up)
        const isMobile = window.innerWidth < 768;

        tl.to('.title-line', {
            y: 0,
            duration: isMobile ? 0.8 : 1.2,
            stagger: isMobile ? 0.1 : 0.15,
            ease: "power4.out"
        })
            // 2. Hero Content Fade In
            .fromTo('.hero-content',
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, stagger: isMobile ? 0.05 : 0.1 },
                isMobile ? "-=0.4" : "-=0.8"
            );

        // 3. Right Column Entrance (Staggered Children)
        if (rightColRef.current) {
            tl.fromTo('.right-content',
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power2.out" },
                "-=0.6"
            );
        }

        // 4. Parallax Effect (Mouse Move)
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            // Disable on touch devices to save performance and prevent weirdness
            if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;

            const { clientX, clientY } = e;
            const moveX = (clientX - window.innerWidth / 2) * 0.01;
            const moveY = (clientY - window.innerHeight / 2) * 0.01;

            gsap.to('.parallax-bg', {
                x: moveX,
                y: moveY,
                duration: 1,
                ease: "power1.out"
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };

    }, { scope: containerRef });

    // GSAP Floating Animation (Ambient)
    useGSAP(() => {
        gsap.to('.gift-float', {
            y: -4,
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }, []);

    // GSAP Modal Animation
    useGSAP(() => {
        if (modalOpen) {
            gsap.fromTo(modalOverlayRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3 }
            );
            gsap.fromTo(modalContentRef.current,
                { scale: 0.9, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
            );
        }
    }, [modalOpen]);

    const handleGiftClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setModalOpen(true);
        setClaimMessage('');
        setGiftEmail('');
        setClaimError('');
    };

    const handleCloseModal = () => {
        gsap.to(modalContentRef.current, {
            scale: 0.9,
            opacity: 0,
            duration: 0.2,
            onComplete: () => setModalOpen(false)
        });
        gsap.to(modalOverlayRef.current, { opacity: 0, duration: 0.2 });
    };

    const openLink = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleClaimGift = async () => {
        setClaimError('');
        if (!giftEmail || !giftEmail.includes('@')) {
            setClaimError("Please enter a valid email address.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (!supabase) {
                console.warn("Supabase client not initialized.");
                await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
                setClaimMessage("Supabase not linked. But you would have secured your spot!");
                return;
            }

            // 1. Insert into Supabase eligible_for_gift table
            const { error } = await supabase
                .from('eligible_for_gift')
                .insert([{ email: giftEmail }]);

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    setClaimError("You have already claimed this reward!");
                } else {
                    throw error;
                }
            } else {
                setClaimMessage("An email with a gift box containing a redeem code has been sent. Check your spam folder if needed.");
                localStorage.setItem('gift_claimed', '1');
            }

        } catch (err) {
            console.error("Error claiming gift:", err);
            setClaimMessage('Something went wrong — try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubscribeStatus(null);

        if (email && email.includes('@')) {
            setIsSubmitting(true);

            try {
                if (!supabase) {
                    console.warn("Supabase client not initialized. Check your .env credentials.");
                    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
                    setSubscribeStatus({ type: 'success', message: "Supabase not configured. Email would be saved: " + email });
                    setEmail('');
                    setFocused(false);
                    return;
                }

                // 1. Insert into Supabase
                const { error } = await supabase
                    .from('subscribers')
                    .insert([{ email }]);

                if (error) {
                    if (error.code === '23505') { // Unique constraint violation
                        setSubscribeStatus({ type: 'error', message: "You are already on the waitlist!" });
                        setIsSubmitting(false);
                        return;
                    }
                    throw error;
                }

                // 2. Success Feedback
                setEmail('');
                setFocused(false);
                setSubscribeStatus({ type: 'success', message: "You've been added! Please check your inbox (and spam folder) for confirmation." });

            } catch (err) {
                console.error("Error subscribing:", err);
                setSubscribeStatus({ type: 'error', message: "Something went wrong. Please try again later." });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const socials = [
        { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/rivalioo/', tooltip: 'Go to our Instagram' },
        { name: 'Discord', icon: RxDiscordLogo, url: 'https://discord.gg/D5u5Ey682U', tooltip: 'Join the community server' },
        { name: 'Twitter', icon: Twitter, url: 'https://x.com/rivalioo', tooltip: 'Get to know us more on X' },

    ];

    return (

        <div ref={containerRef} className="bg-[#0B0E14] min-h-screen w-full font-sans text-white relative flex flex-col lg:pt-0 touch-pan-y">

            {/* Background */}
            <div className="fixed inset-0 z-0 parallax-bg scale-105">
                <img src={bgImage} alt="Bg" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0B0E14_120%)]"></div>
            </div>

            {/* MAIN CONTENT (Split Layout) */}
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-6 relative z-10 flex flex-col justify-start lg:justify-center pt-0 lg:pt-0 lg:py-4">

                {/* Top Logo */}
                <div className="w-full flex justify-center mb-3 lg:mb-1 mt-2 lg:mt-0">
                    <img src={logoFull} alt="RIVALLIO" className="h-16 md:h-18 lg:h-20 object-contain opacity-90 drop-shadow-2xl" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 w-full items-start lg:items-center pb-6 lg:pb-0">

                    {/* LEFT COLUMN: Hero & Form */}
                    <div
                        ref={leftColRef}
                        className="flex flex-col items-center lg:items-start text-center lg:text-left"
                    >
                        {/* Status Badge */}
                        <div className="hero-content opacity-0">
                            <Tooltip text="System Status: Online & Stable" position="right">
                                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#13161C]/95 lg:bg-[#13161C]/80 border border-white/5 mb-4 lg:mb-6 backdrop-blur-none lg:backdrop-blur-md shadow-2xl group cursor-default hover:border-[#2FE9A9]/30 transition-colors will-change-transform">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2FE9A9] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2FE9A9]"></span>
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2FE9A9] text-shadow-sm group-hover:text-white transition-colors">Coming soon</span>
                                </div>
                            </Tooltip>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-oswald font-bold leading-[0.9] tracking-tight uppercase mb-4 lg:mb-5 drop-shadow-2xl flex flex-col items-center lg:items-start">
                            <div className="overflow-hidden">
                                <span className="block text-white title-line translate-y-full">Dominate</span>
                            </div>
                            <div className="overflow-hidden">
                                <span className="block text-transparent bg-clip-text bg-gradient-to-b from-[#2FE9A9] via-emerald-400 to-emerald-900 title-line translate-y-full">The Arena</span>
                            </div>
                        </h1>

                        <div className="w-full max-w-lg mb-4 lg:mb-5 hero-content opacity-0">
                            <div className="relative p-4 lg:p-5 rounded-xl bg-[#13161C]/90 lg:bg-[#13161C]/50 backdrop-blur-none lg:backdrop-blur-xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden group hover:border-[#2FE9A9]/20 transition-all duration-500 will-change-transform">
                                {/* Decorational glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#2FE9A9]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-[#2FE9A9]/10 transition-colors duration-500"></div>

                                <p className="text-gray-400 text-xs md:text-sm leading-relaxed font-medium relative z-10">
                                    Sign up to enter Rivalioo competitive battlegrounds, earn credits from your wins, and redeem them for exciting rewards. <br className="hidden md:block" />
                                    Leave your email to get early access to events, offers, and our official launch.
                                </p>
                            </div>
                        </div>

                        {/* Premium Email Form */}
                        <div className="w-full max-w-md relative mb-2 lg:mb-8 hero-content opacity-0">
                            <div className={`relative group`}>
                                <div className={`absolute -inset-0.5 bg-gradient-to-r from-[#2FE9A9]/30 to-blue-500/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000 ${focused ? 'opacity-100 duration-200' : ''}`}></div>

                                <form
                                    onSubmit={handleSubscribe}
                                    className={`relative flex items-center bg-[#0B0E14] lg:bg-[#0B0E14]/80 backdrop-blur-none lg:backdrop-blur-xl rounded-xl border transition-all duration-300 ${focused
                                        ? 'border-[#2FE9A9] shadow-[0_0_20px_rgba(47,233,169,0.1)]'
                                        : 'border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <Mail
                                        className={`absolute left-5 transition-colors duration-300 ${focused ? 'text-[#2FE9A9]' : 'text-gray-600'}`}
                                        size={20}
                                    />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (subscribeStatus) setSubscribeStatus(null);
                                        }}
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}
                                        disabled={isSubmitting}
                                        placeholder="Enter your email"
                                        className="w-full bg-transparent border-none py-4 lg:py-5 pl-14 pr-20 sm:pr-32 text-sm font-medium text-white placeholder-gray-500 focus:ring-0 focus:outline-none tracking-wide disabled:opacity-50"
                                    />
                                    <div className="absolute right-0 top-0 bottom-0 flex h-full p-1">
                                        <Tooltip text="Join the priority waitlist" position="bottom">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className={`h-full px-8 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${isSubmitting
                                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                                    : 'bg-[#2FE9A9] text-black hover:shadow-[0_0_20px_rgba(47,233,169,0.5)] hover:brightness-110'
                                                    }`}
                                            >
                                                {isSubmitting ? (
                                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <span className="hidden sm:inline">SEND</span>
                                                        <ArrowRight size={16} className="rotate-0 group-hover:-rotate-45 transition-all duration-500 ease-out" />
                                                    </>
                                                )}
                                            </button>
                                        </Tooltip>
                                    </div>
                                </form>
                            </div>

                            {/* Subscribe Status Message */}
                            {subscribeStatus && (
                                <div
                                    className={`relative mt-3 lg:absolute lg:-bottom-10 lg:mt-0 lg:left-0 text-[11px] font-bold uppercase tracking-wide flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300 ${subscribeStatus.type === 'success' ? 'text-[#2FE9A9]' : 'text-red-500'}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${subscribeStatus.type === 'success' ? 'bg-[#2FE9A9]' : 'bg-red-500'} animate-pulse`}></span>
                                    {subscribeStatus.message}
                                </div>
                            )}
                        </div>

                        {/* Mobile Action Buttons (Grid Layout) */}

                        <div className="w-full grid grid-cols-2 gap-3 mt-4 lg:hidden hero-content opacity-0">
                            {/* Gift Button (Mobile Compact) */}
                            <button
                                onClick={handleGiftClick}
                                className="group relative flex flex-row items-center justify-between px-3 py-3 bg-gradient-to-r from-[#2FE9A9]/15 to-[#2FE9A9]/10 border border-[#2FE9A9]/50 rounded-xl transition-all duration-300 active:scale-95"
                            >
                                <div className="gift-float relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#2FE9A9] text-black shadow-lg shadow-[#2FE9A9]/30 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent"></div>
                                    <img src={giftBoxGif} alt="Gift Box" className="w-5 h-5 object-contain relative z-10" />
                                </div>
                                <span className="text-[10px] font-bold text-white tracking-widest uppercase flex-1 text-left ml-3">OPEN FREE GIFT</span>
                                <ArrowRight size={14} className="text-[#2FE9A9]/80 -rotate-45" />
                            </button>

                            {/* Discord Button (Mobile Compact) */}
                            <button
                                onClick={() => openLink('https://discord.gg/D5u5Ey682U')}
                                className="relative flex flex-row items-center justify-between px-3 py-3 bg-gradient-to-r from-[#5865F2]/15 to-[#5865F2]/10 border border-[#5865F2]/20 rounded-xl transition-all duration-300 active:scale-95"
                            >
                                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                                    <RxDiscordLogo size={18} className="relative z-10" />
                                </div>
                                <span className="text-[10px] font-bold text-white tracking-widest uppercase flex-1 text-left ml-3">JOIN OUR DISCORD</span>
                                <ArrowRight size={14} className="text-[#5865F2]/80 -rotate-45" />
                            </button>
                        </div>

                        {/* Discord Call-to-Action (Desktop Only) */}
                        <div className="hidden lg:flex items-center gap-6 mt-4 hero-content opacity-0">
                            <div
                                ref={discordBtnRef}
                                onClick={() => openLink('https://discord.gg/D5u5Ey682U')}
                                role="button"
                                tabIndex={0}
                                className="relative flex items-center justify-between gap-6 px-2 pr-6 py-2 bg-gradient-to-r from-[#5865F2]/10 to-[#5865F2]/5 border border-[#5865F2]/20 hover:border-[#5865F2]/50 hover:bg-[#5865F2]/15 rounded-[24px] transition-all duration-500 group w-full max-w-[320px] shadow-[0_4px_24px_-8px_rgba(88,101,242,0.2)] hover:shadow-[0_8px_32px_-8px_rgba(88,101,242,0.4)] cursor-pointer"
                            >
                                {/* Left Side: Icon Container */}
                                <div className="relative flex items-center justify-center w-14 h-14 rounded-[20px] bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/30 lg:group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                                    {/* Shine effect inside icon */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <RxDiscordLogo size={28} className="relative z-10" />
                                </div>

                                {/* Center: Text */}
                                <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                                    <span className="text-[10px] font-bold text-[#5865F2]/80 uppercase tracking-widest">Official Server</span>
                                    <span className="text-lg font-bold text-white tracking-wide truncate">JOIN DISCORD</span>
                                </div>

                                {/* Right Side: Action Icon */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#5865F2] border-[#5865F2] lg:bg-white/5 border lg:border-white/10 lg:group-hover:bg-[#5865F2] lg:group-hover:border-[#5865F2] transition-colors duration-300">
                                    <ArrowRight size={18} className="text-white -rotate-45 lg:text-gray-400 -rotate-45 lg:rotate-0 lg:group-hover:text-white lg:group-hover:-rotate-45 transition-all duration-500 ease-out" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FAQ & Socials */}
                    <div
                        ref={rightColRef}
                        className="flex flex-col items-center lg:items-end w-full mt-6 lg:mt-0"
                    >
                        {/* FAQ ACCORDION */}
                        <div className="w-full max-w-md mb-6 lg:mb-8 text-left right-content opacity-0">
                            <h4 className="flex items-center gap-3 text-xs font-bold uppercase text-[#2FE9A9] mb-3 lg:mb-4 tracking-widest px-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2FE9A9] animate-pulse"></span>
                                Platform Intel (FAQ)
                            </h4>
                            <Accordion type="single" collapsible className="w-full space-y-2 lg:space-y-3">
                                {[
                                    {
                                        title: 'What is Rivalioo and how do I start playing?',
                                        content:
                                            'Rivalioo is an esports tournament platform for free and paid tournaments in BGMI, Free Fire, Valorant, and CODM. Simply sign up, click "Battle Now," select a game, register your team, compete, and earn credits! redeem them for products in our marketplace or use them for premium events.',
                                    },
                                    {
                                        title: 'How do I earn credits and what can I do with them?',
                                        content:
                                            'Compete in our tournaments and matches to earn credits based on your performance. Use these credits in our marketplace to purchase In-game Digital Currency ,Gaming Gear, Vouchers, and exclusive products. You can also spend them to participate in premium tournaments with bigger prize pools.',
                                    },
                                    {
                                        title: 'What are subscription tiers and why should I upgrade?',
                                        content:
                                            'Rivalioo offers multiple subscription tiers that enhance your earnings and unlock exclusive benefits like unlimited tournament entries, special events, and premium rewards. Upgrade to unlock faster progression and access to VIP tournaments.',
                                    },
                                ].map((item, index) => (
                                    <AccordionItem
                                        key={index}
                                        value={`item-${index + 1}`}
                                        className="border border-white/5 bg-[#13161C]/50 rounded-xl overflow-hidden transition-all duration-300 data-[state=open]:border-[#2FE9A9]/30 data-[state=open]:shadow-[0_0_20px_rgba(47,233,169,0.05)]"
                                    >
                                        <AccordionTrigger className="px-4 lg:px-5 py-3 lg:py-4 text-gray-300 hover:text-white text-[10px] lg:text-xs font-bold uppercase tracking-widest hover:no-underline text-left transition-colors data-[state=open]:text-[#2FE9A9]">
                                            {item.title}
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 lg:px-5 pb-4 lg:pb-5 text-gray-400 text-[10px] lg:text-xs leading-relaxed">
                                            {item.content}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>

                        {/* Social Icons (Aligned with Accordion) */}
                        <div className="w-full max-w-md flex justify-center lg:justify-start gap-4 right-content opacity-0">
                            {socials.map((social) => (
                                <Tooltip key={social.name} text={social.tooltip} position="top">
                                    <div
                                        onClick={() => openLink(social.url)}
                                        role="button"
                                        tabIndex={0}
                                        className="group relative flex items-center justify-center h-12 lg:h-11 rounded-xl lg:rounded-full border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden cursor-pointer
                                            w-12 bg-[#13161C]/50 border-white/10 text-gray-400
                                            hover:bg-[#2FE9A9]/10 hover:border-[#2FE9A9]/50 hover:text-[#2FE9A9]
                                            lg:w-11 lg:bg-[#13161C]/80 lg:border-white/5 lg:text-gray-400
                                            lg:hover:w-[5rem] lg:hover:border-[#2FE9A9]/30 lg:hover:text-[#2FE9A9] lg:hover:bg-[#2FE9A9]/10"
                                    >
                                        <div className="absolute lg:left-0 top-0 w-full lg:w-11 h-full flex items-center justify-center z-10">
                                            <social.icon size={20} className="transition-colors duration-500" />
                                        </div>

                                        <div className="hidden lg:flex absolute right-0 top-0 h-full w-10 items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                                            opacity-0 group-hover:opacity-100">
                                            <ArrowRight size={16} className="-rotate-45" />
                                        </div>
                                    </div>
                                </Tooltip>
                            ))}
                        </div>

                        {/* Gift Button Section (Aligned with Socials) - Desktop Only */}
                        <div className="w-full max-w-md hidden lg:flex justify-start mt-4 lg:mt-6 right-content opacity-0">
                            <Tooltip text="Claim Your Welcome Gift" position="bottom">
                                <button
                                    onClick={handleGiftClick}
                                    className="group relative flex items-center justify-between gap-5 px-2 pr-6 py-2 bg-gradient-to-r from-[#2FE9A9]/10 to-[#2FE9A9]/8 border border-[#2FE9A9]/20 hover:border-[#2FE9A9]/20 hover:bg-[#2FE9A9]/15 rounded-[24px] transition-all duration-500 w-full max-w-[340px] shadow-[0_4px_24px_-8px_rgba(47,233,169,0.2)] hover:shadow-[0_0_20px_rgba(47,233,169,0.2)]"
                                >
                                    {/* Left Side: Icon Container */}
                                    <div className="relative flex items-center justify-center w-14 h-14 rounded-[20px] bg-[#2FE9A9] text-black shadow-lg shadow-[#2FE9A9]/30 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                                        {/* Shine effect inside icon */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        {/* Gift Box GIF */}
                                        <img src={giftBoxGif} alt="Gift Box" className="w-10 h-10 object-contain relative z-10" />
                                    </div>

                                    {/* Center: Text */}
                                    <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0 text-left">
                                        <span className="text-lg font-bold text-white tracking-wide truncate">Claim Exclusive Gift</span>
                                    </div>

                                    {/* Right Side: Action Icon */}
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 group-hover:bg-[#2FE9A9] group-hover:border-[#2FE9A9] transition-colors duration-300">
                                        <ArrowRight size={18} className="text-gray-400 group-hover:text-black -rotate-0 group-hover:-rotate-45 transition-all duration-500 ease-out" />
                                    </div>
                                </button>
                            </Tooltip>
                        </div>

                    </div>

                </div>
            </div>

            {/* Gift Modal */}

            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        ref={modalOverlayRef}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm lg:backdrop-blur-md opacity-0"
                        onClick={handleCloseModal}
                    />

                    <div
                        ref={modalContentRef}
                        className="relative z-[101] w-full max-w-[360px] bg-[#0B0d0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center text-center p-8 opacity-0 scale-90"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
                        >
                            <span className="text-xl leading-none">&times;</span>
                        </button>

                        {/* Top Icon/Graphic */}
                        <div className="mb-4 relative">
                            <div className="absolute inset-0 bg-[#2FE9A9]/20 blur-[30px] rounded-full"></div>
                            <div className="relative z-10 w-20 h-20 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                <img src={giftBoxGif} alt="Gift" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(47,233,169,0.3)]" />
                            </div>
                        </div>

                        {!claimMessage ? (
                            <>
                                <h3 className="text-2xl font-oswald font-bold text-white uppercase leading-none mb-3">
                                    Exclusive <span className="text-[#2FE9A9]">Launch Offer</span>
                                </h3>
                                <p className="text-[11px] text-gray-400 mb-6 leading-relaxed max-w-[280px] font-medium">
                                    Enter your email to get your exclusive <span className="text-white">launch-week discount code</span> for Rivalioo subscription plans. <br /><br />
                                    <span className="text-white/60 text-[10px]">The code will be sent to your inbox and can be used to buy your first-week subscription and Credits at a lower price.</span>
                                </p>

                                {/* Validation Error */}
                                {claimError && (
                                    <span className="text-red-500 text-[10px] font-bold uppercase mb-4 bg-red-500/10 px-3 py-1 rounded border border-red-500/20 animate-pulse w-full">
                                        {claimError}
                                    </span>
                                )}

                                <div className="w-full relative group">
                                    <input
                                        type="email"
                                        placeholder="Enter your email address"
                                        className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-3 px-4 text-white text-xs font-medium placeholder:text-gray-600 focus:outline-none focus:border-[#2FE9A9]/50 transition-all text-center tracking-wide"
                                        value={giftEmail}
                                        onChange={(e) => {
                                            setGiftEmail(e.target.value);
                                            if (claimError) setClaimError('');
                                        }}
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        onClick={handleClaimGift}
                                        disabled={isSubmitting}
                                        className="w-full mt-3 bg-[#2FE9A9] hover:bg-[#2FE9A9]/90 text-black font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(47,233,169,0.2)] hover:shadow-[0_0_25px_rgba(47,233,169,0.4)] flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                CLAIM NOW <ArrowRight size={14} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-4 animate-in fade-in duration-300">
                                <div className="w-12 h-12 rounded-full bg-[#ffffff]/50 text-[#2FE9A9] flex items-center justify-center mb-3 border border-[#2FE9A9]/20">
                                    <img src={successAnimation} alt="Success" className="w-12 h-12 object-contain" />
                                </div>
                                <h3 className="text-xl font-bold text-white font-oswald uppercase mb-2">Sent!</h3>
                                <p className="text-xs text-gray-400 max-w-[220px]">
                                    An email with a gift box containing a redeem code has been sent. Please check your spam folder if it's not in your inbox.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Copyright Footer */}
            <div className="relative z-20 w-full py-2 lg:py-3 flex flex-row items-center justify-center gap-3 lg:gap-4 text-gray-800 text-[9px] lg:text-[10px] uppercase font-bold tracking-widest pointer-events-none mt-4 lg:mt-6">
                <img src={logoFull} alt="RIVALIOO" className="h-3 lg:h-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 pointer-events-auto" />
                <span className='text-white/30'>© {new Date().getFullYear()} Rivalioo. All rights reserved.</span>
            </div>

        </div>
    );
};

export default ComingSoon;
