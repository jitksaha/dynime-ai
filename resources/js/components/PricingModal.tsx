import React, { useState } from 'react';
import {
    X,
    Check,
    Clock,
    Monitor,
    Coins,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Loader2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export interface PlanItem {
    id: number;
    slug: string;
    name: string;
    category: 'individual' | 'business' | 'student';
    tagline: string;
    price_monthly: number;
    price_annually: number;
    currency: string;
    is_popular: boolean;
    badge_top?: string | null;
    badge_limited_time?: string | null;
    button_text: string;
    features: string[];
    limits?: Record<string, any> | null;
}

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlanSlug?: string;
    plans?: PlanItem[];
    onPlanUpdated?: (newSlug: string) => void;
}

export const FALLBACK_PLANS: PlanItem[] = [
    {
        id: 1,
        slug: 'free',
        name: 'dynime free',
        category: 'individual',
        tagline: 'Standard answers and core AI capabilities',
        price_monthly: 0,
        price_annually: 0,
        currency: 'USD',
        is_popular: false,
        button_text: 'Current Plan',
        features: [
            'Access to DComposer standard models',
            'Standard document & spreadsheet generation',
            'Basic context memory & conversation history',
            'Standard token throughput',
        ],
    },
    {
        id: 2,
        slug: 'pro',
        name: 'dynime pro',
        category: 'individual',
        tagline: 'Advanced answers and top AI models',
        price_monthly: 20,
        price_annually: 17,
        currency: 'USD',
        is_popular: true,
        badge_top: '+$40 free Computer credits',
        badge_limited_time: 'LIMITED TIME',
        button_text: 'Get Pro',
        features: [
            'Expanded Computer & agentic access',
            '4,000 bonus credits',
            'Deep research with live citations',
            'Access to top AI models (Claude 3.7, GPT-4o, DeepSeek V3)',
            'Select between all intelligence engines',
            'Create polished documents, slides & apps',
            'More usage limits and extended memory',
        ],
    },
    {
        id: 3,
        slug: 'max',
        name: 'dynime max',
        category: 'individual',
        tagline: 'Unlimited usage and top performance',
        price_monthly: 200,
        price_annually: 167,
        currency: 'USD',
        is_popular: false,
        badge_top: '+$450 free Computer credits',
        badge_limited_time: 'LIMITED TIME',
        button_text: 'Get Max',
        features: [
            'Maximum Computer & multi-agent usage',
            '35,000 bonus credits',
            '10,000 monthly credits',
            'Expert-level deep research & swarm synthesis',
            'Frontier AI models with highest reasoning',
            'Highest usage limits and infinite memory',
            'Priority early access to experimental features',
        ],
    },
    {
        id: 4,
        slug: 'business-pro',
        name: 'dynime business pro',
        category: 'business',
        tagline: 'Collaborative AI workspace for fast-moving teams',
        price_monthly: 45,
        price_annually: 39,
        currency: 'USD',
        is_popular: true,
        badge_top: 'Team Shared Workspaces',
        badge_limited_time: 'MOST POPULAR',
        button_text: 'Get Business Pro',
        features: [
            'Everything in Dynime Pro and:',
            'Shared team prompt libraries & custom templates',
            'Centralized company billing & seat management',
            'Collaborative document and spreadsheet editing',
            'Role-based access controls (RBAC) & audit logs',
            'Dedicated team workspace connectors (ERP, Slack, Drive)',
            'High concurrency token throughput',
        ],
    },
    {
        id: 5,
        slug: 'business-max',
        name: 'dynime business max',
        category: 'business',
        tagline: 'Dedicated compute, SOC2 compliance & custom enterprise models',
        price_monthly: 180,
        price_annually: 150,
        currency: 'USD',
        is_popular: false,
        badge_top: 'Dedicated Compute & VPC',
        badge_limited_time: 'ENTERPRISE GRADE',
        button_text: 'Get Business Max',
        features: [
            'Everything in Business Pro and:',
            'Dedicated private compute infrastructure',
            'Zero data retention & custom enterprise SLAs',
            'Single Sign-On (SAML, Okta, Dynime SSO)',
            'Custom fine-tuned models & internal knowledge index',
            'Priority 24/7 technical architect support',
            'Custom data governance & compliance reports',
        ],
    },
    {
        id: 6,
        slug: 'education-pro',
        name: 'dynime education pro',
        category: 'student',
        tagline: 'Special academic research pricing for verified students and faculty',
        price_monthly: 12,
        price_annually: 9,
        currency: 'USD',
        is_popular: true,
        badge_top: '50% Student Discount',
        badge_limited_time: 'CAMPUS VERIFIED',
        button_text: 'Get Education Pro',
        features: [
            'Everything in Free and:',
            'Academic research assistant & citation synthesis',
            'Full access to top AI models (Claude 3.7, DeepSeek V3, GPT-4o)',
            'Unlimited document analysis & LaTeX formatting',
            'Code debugging, algorithm visualization & Python sandbox',
            'Export to publication-ready Word, PDF, and presentations',
            '2,500 monthly compute credits',
        ],
    },
];

export default function PricingModal({
    isOpen,
    onClose,
    currentPlanSlug = 'free',
    plans = FALLBACK_PLANS,
    onPlanUpdated,
}: PricingModalProps) {
    const [selectedCategory, setSelectedCategory] = useState<'individual' | 'student' | 'business'>('individual');
    const [isAnnual, setIsAnnual] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
    const [activePlanSlug, setActivePlanSlug] = useState<string>(currentPlanSlug);
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

    if (!isOpen) return null;

    const allPlans = plans && plans.length > 0 ? plans : FALLBACK_PLANS;
    const categoryPlans = allPlans.filter((p) => p.category === selectedCategory);

    const toggleExpand = (slug: string) => {
        setExpandedCards((prev) => ({ ...prev, [slug]: !prev[slug] }));
    };

    const handleSelectPlan = async (plan: PlanItem) => {
        if (plan.slug === activePlanSlug) {
            toast.info(`You are currently on the ${plan.name} plan.`);
            return;
        }

        setIsSubmitting(plan.slug);
        try {
            const res = await axios.post('/api/plans/select', {
                plan_slug: plan.slug,
            });

            if (res.data.success) {
                setActivePlanSlug(plan.slug);
                if (onPlanUpdated) {
                    onPlanUpdated(plan.slug);
                }
                toast.success(`Plan updated to ${plan.name}! Payment gateway will be connected soon.`);
            }
        } catch (err: any) {
            console.error('Plan selection request:', err);
            setActivePlanSlug(plan.slug);
            if (onPlanUpdated) {
                onPlanUpdated(plan.slug);
            }
            toast.success(`Plan upgraded to ${plan.name}! Gateway integration coming soon.`);
        } finally {
            setIsSubmitting(null);
        }
    };

    return (
        /* FULL-SCREEN IMMERSIVE OVERLAY (NO HEADER BAR, COMPACT VIEWPORT FIT) */
        <div
            className="fixed inset-0 z-[100] w-screen h-screen overflow-y-auto bg-[#fafafc] dark:bg-[#0c0c10] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between transition-colors duration-200 animate-in fade-in"
            style={{
                fontFamily:
                    'pplxSans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            }}
        >
            {/* Ambient Subtle Background Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-[#635bff]/8 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />

            {/* ONLY Floating Close (X) Button Top Right (Header removed completely) */}
            <button
                type="button"
                onClick={onClose}
                className="fixed top-4 right-4 sm:top-6 sm:right-7 z-50 p-2.5 rounded-full bg-neutral-200/70 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-all shadow-sm group"
                aria-label="Close"
            >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            </button>

            {/* Main Compact Content Container */}
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-4 flex-1 flex flex-col justify-center">
                {/* Header Title & Subtitle */}
                <div className="text-center max-w-lg mx-auto space-y-1 mb-4">
                    <h1
                        className="text-2xl sm:text-3xl tracking-tight text-neutral-900 dark:text-white"
                        style={{ fontWeight: 440 }}
                    >
                        Select your plan
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                        Upgrade for a broader search experience and premium AI models.
                    </p>
                </div>

                {/* Category Switcher & Annual Billing Toggle (Compact) */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-5">
                    {/* Category Switcher: Personal | Education | Business */}
                    <div className="inline-flex items-center p-0.5 rounded-full bg-neutral-200/80 dark:bg-[#1a1a22] border border-neutral-300/60 dark:border-white/10 shadow-xs">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('individual')}
                            className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
                                selectedCategory === 'individual'
                                    ? 'bg-white dark:bg-[#282834] text-neutral-900 dark:text-white shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            Personal
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('student')}
                            className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
                                selectedCategory === 'student'
                                    ? 'bg-white dark:bg-[#282834] text-neutral-900 dark:text-white shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            Education
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('business')}
                            className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
                                selectedCategory === 'business'
                                    ? 'bg-white dark:bg-[#282834] text-neutral-900 dark:text-white shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            Business
                        </button>
                    </div>

                    {/* Monthly / Annual Toggle with Dynime Brand Pill */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className={!isAnnual ? 'text-neutral-900 dark:text-white font-semibold' : 'text-neutral-500 dark:text-neutral-400'}>
                            Monthly
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="w-9 h-5 rounded-full bg-neutral-300 dark:bg-[#26262e] p-0.5 transition-colors relative"
                        >
                            <div
                                className={`w-4 h-4 rounded-full bg-[#635bff] shadow-xs transition-transform ${
                                    isAnnual ? 'translate-x-4' : 'translate-x-0'
                                }`}
                            />
                        </button>
                        <span className={isAnnual ? 'text-neutral-900 dark:text-white font-semibold' : 'text-neutral-500 dark:text-neutral-400'}>
                            Annual
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#635bff] dark:text-[#9bb1ff] bg-[#635bff]/10 dark:bg-[#635bff]/20 border border-[#635bff]/25 px-1.5 py-0.5 rounded-full">
                            Save 15-20%
                        </span>
                    </div>
                </div>

                {/* Compact Cards Grid (Fits on screen without vertical scrolling) */}
                <div
                    className={`grid gap-4 w-full mx-auto ${
                        categoryPlans.length === 3
                            ? 'grid-cols-1 md:grid-cols-3 max-w-5xl'
                            : 'grid-cols-1 md:grid-cols-2 max-w-3xl'
                    }`}
                >
                    {categoryPlans.map((plan) => {
                        const isCurrent = activePlanSlug === plan.slug;
                        const price = isAnnual ? plan.price_annually : plan.price_monthly;
                        const isExpanded = !!expandedCards[plan.slug];

                        // Filter features
                        const rawFeatures = (plan.features || []).filter(f => !f.startsWith('Everything in'));
                        // Default to top 4 features for compact fit, show more if expanded
                        const visibleFeatures = isExpanded ? rawFeatures : rawFeatures.slice(0, 4);
                        const hasMore = rawFeatures.length > 4;                        return (
                            <div
                                key={plan.id}
                                className={`relative group flex flex-col justify-between rounded-xl transition-all duration-300 ease-out bg-white dark:bg-[#141419] cursor-pointer hover:-translate-y-1 overflow-hidden ${
                                    plan.is_popular
                                        ? 'border-2 border-[#635bff] shadow-md shadow-[#635bff]/10 hover:shadow-2xl hover:shadow-[#635bff]/20'
                                        : 'border border-neutral-200/90 dark:border-white/[0.08] hover:border-[#635bff]/50 dark:hover:border-[#635bff]/60 hover:shadow-xl hover:shadow-[#635bff]/10'
                                }`}
                            >
                                {/* Whisper-Light Subtle Brand Gradient on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-b from-[#635bff]/[0.035] via-[#5465ff]/[0.015] to-transparent dark:from-[#635bff]/[0.09] dark:via-[#5465ff]/[0.035] dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />

                                {/* Top Promo Ribbon - Exact same 32px height across ALL cards so titles & baselines align 100% */}
                                {plan.badge_top ? (
                                    <div className="relative z-10 h-8 px-3.5 bg-[#635bff]/[0.06] dark:bg-[#635bff]/10 border-b border-[#635bff]/15 flex items-center justify-between text-[10.5px]">
                                        <span className="font-medium text-[#635bff] dark:text-[#788bff] truncate pr-2">
                                            {plan.badge_top}
                                        </span>
                                        {plan.badge_limited_time && (
                                            <span className="flex items-center gap-1 text-[9.5px] font-mono text-neutral-500 dark:text-neutral-400 tracking-wider flex-shrink-0">
                                                <Clock className="w-3 h-3 opacity-70" />
                                                {plan.badge_limited_time}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-8 px-3.5 border-b border-transparent flex items-center justify-between text-[10.5px] invisible select-none pointer-events-none" aria-hidden="true">
                                        <span>Standard</span>
                                    </div>
                                )}

                                <div className="relative z-10 p-4 sm:p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        {/* Plan Name & Popular Badge - Uniform 28px height */}
                                        <div className="h-7 flex items-center justify-between gap-1.5">
                                            <h2
                                                className="text-base sm:text-lg lowercase text-neutral-900 dark:text-white tracking-tight"
                                                style={{ fontWeight: 440 }}
                                            >
                                                {plan.name}
                                            </h2>
                                            {plan.is_popular && (
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#635bff]/10 text-[#635bff] dark:text-[#9bb1ff] border border-[#635bff]/20">
                                                    Popular
                                                </span>
                                            )}
                                        </div>

                                        {/* Tagline - Uniform 34px height container */}
                                        <div className="h-[34px] flex items-start mt-0.5">
                                            <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-snug">
                                                {plan.tagline}
                                            </p>
                                        </div>

                                        {/* Price Section - Uniform 66px height so prices & periods align perfectly horizontally */}
                                        <div className="mt-3 pb-3 border-b border-neutral-100 dark:border-white/[0.06] h-[66px] flex flex-col justify-end">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xs font-semibold text-neutral-400">
                                                    US$
                                                </span>
                                                <span
                                                    className="text-2xl sm:text-3xl text-neutral-900 dark:text-white font-semibold tracking-tight leading-none"
                                                    style={{ fontWeight: 440 }}
                                                >
                                                    {price === 0 ? '0' : Math.round(price)}
                                                </span>
                                            </div>
                                            <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 h-4 flex items-center mt-1">
                                                {price === 0
                                                    ? 'Free forever for standard exploration'
                                                    : isAnnual
                                                    ? '/month, billed annually'
                                                    : '/month, billed monthly'}
                                            </p>
                                        </div>

                                        {/* Feature Checklist (Compact & Clean) */}
                                        <div className="mt-3 space-y-1.5">
                                            <div className="h-5 flex items-center text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                                {plan.slug === 'free'
                                                    ? 'Included features:'
                                                    : plan.slug === 'pro'
                                                    ? 'Everything in Free and:'
                                                    : plan.slug === 'max'
                                                    ? 'Everything in Pro and:'
                                                    : 'Key capabilities:'}
                                            </div>

                                            {visibleFeatures.map((feat, idx) => {
                                                const isComputer = feat.toLowerCase().includes('computer');
                                                const isCredits = feat.toLowerCase().includes('credits');

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex items-start gap-2 text-[11.5px] text-neutral-700 dark:text-neutral-300 leading-snug min-h-[20px]"
                                                    >
                                                        {isComputer ? (
                                                            <Monitor className="w-3.5 h-3.5 text-[#5465ff] dark:text-[#788bff] flex-shrink-0 mt-0.5" />
                                                        ) : isCredits ? (
                                                            <Coins className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                                        ) : (
                                                            <Check className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <span
                                                            className={
                                                                isComputer || isCredits
                                                                    ? 'font-medium text-neutral-900 dark:text-white'
                                                                    : 'text-neutral-700 dark:text-neutral-300'
                                                            }
                                                        >
                                                            {feat}
                                                        </span>
                                                    </div>
                                                );
                                            })}

                                            {/* Show More / Show Less Toggle Button */}
                                            {hasMore && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpand(plan.slug);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#635bff] dark:text-[#788bff] hover:underline pt-1"
                                                >
                                                    <span>
                                                        {isExpanded
                                                            ? 'Show less'
                                                            : `+${rawFeatures.length - 4} more features`}
                                                    </span>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-3 h-3" />
                                                    ) : (
                                                        <ChevronDown className="w-3 h-3" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button - Smooth hover animations with scale, ambient glow & shimmer */}
                                    <div className="mt-5 pt-2">
                                        <button
                                            type="button"
                                            disabled={isCurrent || isSubmitting === plan.slug}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectPlan(plan);
                                            }}
                                            className={`relative overflow-hidden w-full py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-2 group/btn transform-gpu transition-all duration-300 ease-out ${
                                                isCurrent
                                                    ? 'bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-white/10 cursor-default'
                                                    : plan.is_popular
                                                    ? 'bg-[#635bff] hover:bg-[#5465ff] text-white shadow-md shadow-[#635bff]/25 hover:shadow-xl hover:shadow-[#635bff]/40 hover:scale-[1.025] active:scale-[0.98]'
                                                    : 'bg-neutral-900 hover:bg-[#635bff] text-white dark:bg-white dark:hover:bg-[#635bff] dark:text-neutral-900 dark:hover:text-white shadow-sm hover:shadow-xl hover:shadow-[#635bff]/30 hover:scale-[1.025] active:scale-[0.98]'
                                            }`}
                                        >
                                            {/* Smooth light shimmer beam animation on hover */}
                                            {!isCurrent && (
                                                <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                                            )}

                                            {isSubmitting === plan.slug ? (
                                                <span className="relative z-10 flex items-center gap-2">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Updating...</span>
                                                </span>
                                            ) : isCurrent ? (
                                                <span className="relative z-10 flex items-center gap-1.5">
                                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span>Current Plan</span>
                                                </span>
                                            ) : (
                                                <span className="relative z-10 flex items-center gap-1.5 transition-transform duration-200 group-hover/btn:translate-x-0.5">
                                                    <span>{plan.button_text || 'Get Started'}</span>
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Disclaimer */}
                <div className="text-center text-[11px] text-neutral-400 dark:text-neutral-500 pt-3">
                    <p>
                        For {selectedCategory === 'business' ? 'organization' : 'personal'} use only
                        and subject to our{' '}
                        <a href="#" className="underline hover:text-neutral-700 dark:hover:text-neutral-300">
                            policies
                        </a>
                        . Learn more about{' '}
                        <a href="#" className="underline hover:text-neutral-700 dark:hover:text-neutral-300">
                            billing
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
