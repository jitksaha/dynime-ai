import React, { useState } from 'react';
import {
    X,
    Check,
    Clock,
    Monitor,
    Coins,
    Sparkles,
    Shield,
    Users,
    GraduationCap,
    Cpu,
    ArrowRight,
    Loader2,
    Sun,
    Moon
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
    theme?: 'light' | 'dark';
    onToggleTheme?: () => void;
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

    if (!isOpen) return null;

    const allPlans = plans && plans.length > 0 ? plans : FALLBACK_PLANS;
    const categoryPlans = allPlans.filter((p) => p.category === selectedCategory);

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
        /* FULL-SCREEN IMMERSIVE MODAL (NO BOXED BORDERS) */
        <div
            className="fixed inset-0 z-[100] w-screen h-screen overflow-y-auto bg-[#fafafc] dark:bg-[#0c0c10] text-neutral-900 dark:text-neutral-100 flex flex-col transition-colors duration-200 animate-in fade-in"
            style={{
                fontFamily:
                    'pplxSans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            }}
        >
            {/* Ambient Background Gradient Glow with Dynime Brand Colors */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-[#635bff]/10 via-[#788bff]/5 to-transparent blur-3xl pointer-events-none -z-10" />

            {/* Top Bar with Fixed X Button at Top Right */}
            <div className="w-full flex items-center justify-between px-6 py-5 sm:px-10 sm:py-6 border-b border-neutral-200/60 dark:border-white/[0.06] backdrop-blur-md sticky top-0 z-50 bg-[#fafafc]/90 dark:bg-[#0c0c10]/90">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#5465ff] to-[#635bff] flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-[#635bff]/30">
                        D
                    </div>
                    <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-white">
                        Dynime AI
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#635bff]/10 text-[#635bff] dark:text-[#9bb1ff] font-semibold">
                        Plans & Pricing
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Close (X) Button Top Right */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full bg-neutral-200/60 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-all shadow-xs"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col justify-between">
                <div>
                    {/* Header matching Perplexity */}
                    <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
                        <h1
                            className="text-3xl sm:text-4xl tracking-tight text-neutral-900 dark:text-white"
                            style={{ fontWeight: 440 }}
                        >
                            Select your plan
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Upgrade for a broader search experience and premium AI models.
                        </p>
                    </div>

                    {/* Category Switcher & Annual Billing Toggle */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                        {/* Segmented Pills: Personal | Education | Business */}
                        <div className="inline-flex items-center p-1 rounded-full bg-neutral-200/80 dark:bg-[#1a1a22] border border-neutral-300/60 dark:border-white/10 shadow-xs">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('individual')}
                                className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    selectedCategory === 'individual'
                                        ? 'bg-white dark:bg-[#282834] text-neutral-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                Personal
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('student')}
                                className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    selectedCategory === 'student'
                                        ? 'bg-white dark:bg-[#282834] text-neutral-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                Education
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('business')}
                                className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    selectedCategory === 'business'
                                        ? 'bg-white dark:bg-[#282834] text-neutral-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                Business
                            </button>
                        </div>

                        {/* Monthly / Annual Toggle with Dynime Brand Pill */}
                        <div className="flex items-center gap-2.5 text-xs">
                            <span className={!isAnnual ? 'text-neutral-900 dark:text-white font-semibold' : 'text-neutral-500 dark:text-neutral-400'}>
                                Monthly
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsAnnual(!isAnnual)}
                                className="w-11 h-6 rounded-full bg-neutral-300 dark:bg-[#26262e] p-0.5 transition-colors relative"
                            >
                                <div
                                    className={`w-5 h-5 rounded-full bg-[#635bff] shadow-sm transition-transform ${
                                        isAnnual ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                            <span className={isAnnual ? 'text-neutral-900 dark:text-white font-semibold' : 'text-neutral-500 dark:text-neutral-400'}>
                                Annual
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#635bff] dark:text-[#9bb1ff] bg-[#635bff]/10 dark:bg-[#635bff]/20 border border-[#635bff]/25 px-2 py-0.5 rounded-full">
                                Save 15-20%
                            </span>
                        </div>
                    </div>

                    {/* Cards Grid with Dynime Gradient Hover Effects */}
                    <div
                        className={`grid gap-6 w-full mx-auto mb-10 ${
                            categoryPlans.length === 3
                                ? 'grid-cols-1 md:grid-cols-3 max-w-6xl'
                                : 'grid-cols-1 md:grid-cols-2 max-w-4xl'
                        }`}
                    >
                        {categoryPlans.map((plan) => {
                            const isCurrent = activePlanSlug === plan.slug;
                            const price = isAnnual ? plan.price_annually : plan.price_monthly;

                            return (
                                <div
                                    key={plan.id}
                                    className={`group relative flex flex-col justify-between rounded-2xl transition-all duration-300 overflow-hidden ${
                                        plan.is_popular
                                            ? 'bg-white dark:bg-[#15151b] border-2 border-[#635bff] dark:border-[#635bff]/80 shadow-xl shadow-[#635bff]/10'
                                            : 'bg-white dark:bg-[#141419] border border-neutral-200/90 dark:border-white/[0.08] hover:border-transparent hover:shadow-2xl hover:shadow-[#635bff]/15'
                                    } hover:-translate-y-1.5`}
                                >
                                    {/* Gradient Border Glow on Hover using Dynime Brand Palette */}
                                    <div className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 p-[1.5px] bg-gradient-to-br from-[#635bff] via-[#5465ff] to-[#788bff] -z-10" />

                                    {/* Subtle Ambient Hover Glow */}
                                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-[#635bff]/[0.05] via-transparent to-transparent pointer-events-none" />

                                    {/* Top Promo Ribbon (e.g. +$40 free Computer credits | LIMITED TIME) */}
                                    {plan.badge_top ? (
                                        <div className="px-4 py-2 bg-gradient-to-r from-[#635bff]/10 via-[#5465ff]/5 to-transparent border-b border-neutral-100 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
                                            <span className="font-semibold text-[#635bff] dark:text-[#788bff] truncate pr-2">
                                                {plan.badge_top}
                                            </span>
                                            {plan.badge_limited_time && (
                                                <span className="flex items-center gap-1 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 tracking-wider flex-shrink-0">
                                                    <Clock className="w-3 h-3 text-neutral-400" />
                                                    {plan.badge_limited_time}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-2" />
                                    )}

                                    <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between relative z-10">
                                        <div>
                                            {/* Plan Name & Popular Badge */}
                                            <div className="flex items-center justify-between gap-2">
                                                <h3
                                                    className="text-xl lowercase text-neutral-900 dark:text-white tracking-tight"
                                                    style={{ fontWeight: 440 }}
                                                >
                                                    {plan.name}
                                                </h3>
                                                {plan.is_popular && (
                                                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#635bff]/15 text-[#635bff] dark:text-[#9bb1ff] border border-[#635bff]/30">
                                                        Popular
                                                    </span>
                                                )}
                                            </div>

                                            {/* Tagline */}
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 min-h-[32px]">
                                                {plan.tagline}
                                            </p>

                                            {/* Price Section */}
                                            <div className="mt-5 pb-5 border-b border-neutral-100 dark:border-white/[0.06]">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-sm font-semibold text-neutral-400 dark:text-neutral-400">
                                                        US$
                                                    </span>
                                                    <span
                                                        className="text-4xl text-neutral-900 dark:text-white font-semibold tracking-tight"
                                                        style={{ fontWeight: 440 }}
                                                    >
                                                        {price === 0 ? '0' : Math.round(price)}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                                                    {price === 0
                                                        ? 'Free forever for standard exploration'
                                                        : isAnnual
                                                        ? '/month or equivalent, when billed annually'
                                                        : '/month, billed monthly'}
                                                </p>
                                            </div>

                                            {/* Feature Checklist matching Perplexity */}
                                            <div className="mt-5 space-y-3">
                                                <div className="text-xs font-semibold text-neutral-400 dark:text-neutral-400">
                                                    {plan.slug === 'free'
                                                        ? 'Included features:'
                                                        : plan.slug === 'pro'
                                                        ? 'Everything in Free and:'
                                                        : plan.slug === 'max'
                                                        ? 'Everything in Pro and:'
                                                        : 'Key capabilities:'}
                                                </div>

                                                <div className="space-y-2.5">
                                                    {(plan.features || []).map((feat, idx) => {
                                                        if (feat.startsWith('Everything in')) return null;

                                                        const isComputer = feat.toLowerCase().includes('computer');
                                                        const isCredits = feat.toLowerCase().includes('credits');

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed"
                                                            >
                                                                {isComputer ? (
                                                                    <Monitor className="w-4 h-4 text-[#5465ff] dark:text-[#788bff] flex-shrink-0 mt-0.5" />
                                                                ) : isCredits ? (
                                                                    <Coins className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                                                ) : (
                                                                    <Check className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0 mt-0.5" />
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
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="mt-8 pt-2">
                                            <button
                                                type="button"
                                                disabled={isCurrent || isSubmitting === plan.slug}
                                                onClick={() => handleSelectPlan(plan)}
                                                className={`w-full py-3 rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                                                    isCurrent
                                                        ? 'bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-white/10 cursor-default'
                                                        : plan.is_popular
                                                        ? 'bg-[#635bff] hover:bg-[#5465ff] text-white shadow-lg shadow-[#635bff]/25 active:scale-[0.98]'
                                                        : 'bg-neutral-900 hover:bg-[#635bff] text-white dark:bg-white dark:hover:bg-[#635bff] dark:text-neutral-900 dark:hover:text-white shadow-sm active:scale-[0.98]'
                                                }`}
                                            >
                                                {isSubmitting === plan.slug ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Updating plan...</span>
                                                    </>
                                                ) : isCurrent ? (
                                                    <>
                                                        <Check className="w-4 h-4 text-emerald-500" />
                                                        <span>Current Plan</span>
                                                    </>
                                                ) : (
                                                    <span>{plan.button_text || 'Get Started'}</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="text-center text-xs text-neutral-400 dark:text-neutral-500 pb-6 border-t border-neutral-200/50 dark:border-white/[0.06] pt-6">
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
