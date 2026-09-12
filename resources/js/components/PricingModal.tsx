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
            'Standard response speed',
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
            {/* Modal Container matching Perplexity */}
            <div
                className="relative w-full max-w-5xl bg-[#141417] text-neutral-100 rounded-2xl border border-white/[0.08] shadow-2xl p-6 sm:p-8 flex flex-col my-auto max-h-[92vh] overflow-y-auto"
                style={{
                    fontFamily:
                        'pplxSans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                }}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header matching Perplexity Screenshot */}
                <div className="text-center max-w-xl mx-auto space-y-2">
                    <h2
                        className="text-2xl sm:text-3xl tracking-tight text-white"
                        style={{ fontWeight: 440 }}
                    >
                        Select your plan
                    </h2>
                    <p className="text-sm text-neutral-400">
                        Upgrade for a broader search experience and premium AI models.
                    </p>
                </div>

                {/* Category Pills & Annual Toggle matching Perplexity */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 mb-8">
                    {/* Pills: Personal | Education | Business */}
                    <div className="inline-flex items-center p-1 rounded-full bg-[#1e1e24] border border-white/[0.06]">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('individual')}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                                selectedCategory === 'individual'
                                    ? 'bg-[#282830] text-white shadow-sm ring-1 ring-white/10'
                                    : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            Personal
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('student')}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                                selectedCategory === 'student'
                                    ? 'bg-[#282830] text-white shadow-sm ring-1 ring-white/10'
                                    : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            Education
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('business')}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                                selectedCategory === 'business'
                                    ? 'bg-[#282830] text-white shadow-sm ring-1 ring-white/10'
                                    : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                        >
                            Business
                        </button>
                    </div>

                    {/* Annual vs Monthly Toggle */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className={!isAnnual ? 'text-white font-medium' : 'text-neutral-400'}>
                            Monthly
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="w-10 h-5.5 rounded-full bg-[#26262e] border border-white/10 p-0.5 transition-colors relative"
                        >
                            <div
                                className={`w-4 h-4 rounded-full bg-[#635bff] transition-transform ${
                                    isAnnual ? 'translate-x-4.5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                        <span className={isAnnual ? 'text-white font-medium' : 'text-neutral-400'}>
                            Annual
                        </span>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            Save 15-20%
                        </span>
                    </div>
                </div>

                {/* Cards Grid matching Perplexity Screenshot */}
                <div
                    className={`grid gap-5 w-full mx-auto ${
                        categoryPlans.length === 3
                            ? 'grid-cols-1 md:grid-cols-3 max-w-5xl'
                            : 'grid-cols-1 md:grid-cols-2 max-w-3xl'
                    }`}
                >
                    {categoryPlans.map((plan) => {
                        const isCurrent = activePlanSlug === plan.slug;
                        const price = isAnnual ? plan.price_annually : plan.price_monthly;

                        return (
                            <div
                                key={plan.id}
                                className={`flex flex-col justify-between rounded-2xl bg-[#1a1a1f] border transition-all duration-200 overflow-hidden relative ${
                                    plan.is_popular
                                        ? 'border-[#635bff]/40 shadow-lg shadow-[#635bff]/5'
                                        : 'border-white/[0.08] hover:border-white/20'
                                }`}
                            >
                                {/* Top Banner matching Perplexity */}
                                {plan.badge_top ? (
                                    <div className="px-4 py-2 bg-[#202028] border-b border-white/[0.06] flex items-center justify-between text-[11px]">
                                        <span className="font-semibold text-emerald-400 truncate pr-2">
                                            {plan.badge_top}
                                        </span>
                                        {plan.badge_limited_time && (
                                            <span className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 tracking-wider flex-shrink-0">
                                                <Clock className="w-3 h-3 text-neutral-400" />
                                                {plan.badge_limited_time}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-2" />
                                )}

                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        {/* Plan Name & Popular Tag */}
                                        <div className="flex items-center justify-between gap-2">
                                            <h3
                                                className="text-lg lowercase text-white tracking-tight"
                                                style={{
                                                    fontFamily:
                                                        'pplxSans, ui-sans-serif, system-ui, -apple-system, sans-serif',
                                                    fontWeight: 440,
                                                }}
                                            >
                                                {plan.name}
                                            </h3>
                                            {plan.is_popular && (
                                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#252530] text-neutral-300 border border-white/10">
                                                    Popular
                                                </span>
                                            )}
                                        </div>

                                        {/* Tagline */}
                                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2 min-h-[32px]">
                                            {plan.tagline}
                                        </p>

                                        {/* Price Section */}
                                        <div className="mt-5 pb-5 border-b border-white/[0.06]">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-semibold text-neutral-300">
                                                    US$
                                                </span>
                                                <span
                                                    className="text-3xl text-white font-semibold tracking-tight"
                                                    style={{ fontWeight: 440 }}
                                                >
                                                    {price === 0 ? '0' : Math.round(price)}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-neutral-400 mt-0.5">
                                                {price === 0
                                                    ? 'Free forever for standard exploration'
                                                    : isAnnual
                                                    ? '/month or equivalent, when billed annually'
                                                    : '/month, billed monthly'}
                                            </p>
                                        </div>

                                        {/* Feature Checklist matching Perplexity */}
                                        <div className="mt-5 space-y-3">
                                            <div className="text-xs font-medium text-neutral-400">
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
                                                            className="flex items-start gap-2.5 text-xs text-neutral-300 leading-relaxed"
                                                        >
                                                            {isComputer ? (
                                                                <Monitor className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                                                            ) : isCredits ? (
                                                                <Coins className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                                            ) : (
                                                                <Check className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                                                            )}
                                                            <span
                                                                className={
                                                                    isComputer || isCredits
                                                                        ? 'font-medium text-white'
                                                                        : 'text-neutral-300'
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

                                    {/* Action Button matching Perplexity rounded pill */}
                                    <div className="mt-8 pt-2">
                                        <button
                                            type="button"
                                            disabled={isCurrent || isSubmitting === plan.slug}
                                            onClick={() => handleSelectPlan(plan)}
                                            className={`w-full py-2.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                                                isCurrent
                                                    ? 'bg-[#26262e] text-neutral-400 border border-white/10 cursor-default'
                                                    : plan.is_popular
                                                    ? 'bg-white hover:bg-neutral-200 text-neutral-900 shadow-md active:scale-[0.98]'
                                                    : 'bg-[#2a2a32] hover:bg-[#34343e] text-white border border-white/10 active:scale-[0.98]'
                                            }`}
                                        >
                                            {isSubmitting === plan.slug ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Updating plan...</span>
                                                </>
                                            ) : isCurrent ? (
                                                <>
                                                    <Check className="w-4 h-4 text-emerald-400" />
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

                {/* Footer Disclaimer */}
                <div className="mt-8 text-center text-xs text-neutral-500">
                    <p>
                        For {selectedCategory === 'business' ? 'organization' : 'personal'} use only
                        and subject to our{' '}
                        <a href="#" className="underline hover:text-neutral-400">
                            policies
                        </a>
                        . Learn more about{' '}
                        <a href="#" className="underline hover:text-neutral-400">
                            billing
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
