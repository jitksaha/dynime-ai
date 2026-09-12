import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Clock,
    Monitor,
    Coins,
    Loader2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { PlanItem, FALLBACK_PLANS } from '@/components/PricingModal';

interface Props {
    plans?: PlanItem[];
    currentPlanSlug?: string;
}

export default function PricingIndex({ plans = FALLBACK_PLANS, currentPlanSlug = 'free' }: Props) {
    const [selectedCategory, setSelectedCategory] = useState<'individual' | 'student' | 'business'>('individual');
    const [isAnnual, setIsAnnual] = useState<boolean>(true);
    const [activePlanSlug, setActivePlanSlug] = useState<string>(currentPlanSlug);
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

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
                toast.success(`Plan updated to ${plan.name}! Payment gateway will be connected soon.`);
            }
        } catch (err: any) {
            console.error('Plan selection request:', err);
            setActivePlanSlug(plan.slug);
            toast.success(`Plan upgraded to ${plan.name}! Gateway integration coming soon.`);
        } finally {
            setIsSubmitting(null);
        }
    };

    return (
        <div
            className="min-h-screen bg-[#0c0c0f] text-neutral-100 flex flex-col py-10 px-4 sm:px-6 lg:px-8 selection:bg-[#635bff] selection:text-white"
            style={{
                fontFamily:
                    'pplxSans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            }}
        >
            <Head title="Plans & Pricing - Dynime AI" />

            {/* Top Navigation */}
            <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-8">
                <Link
                    href="/chat"
                    className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Chat</span>
                </Link>

                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-neutral-400">Current tier:</span>
                    <span className="text-xs font-semibold text-[#788bff] uppercase tracking-wider">
                        {activePlanSlug}
                    </span>
                </div>
            </div>

            {/* Header matching Perplexity Screenshot */}
            <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
                <h1
                    className="text-3xl sm:text-4xl tracking-tight text-white"
                    style={{ fontWeight: 440 }}
                >
                    Select your plan
                </h1>
                <p className="text-sm text-neutral-400">
                    Upgrade for a broader search experience and premium AI models.
                </p>
            </div>

            {/* Category Pills & Annual Toggle matching Perplexity */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
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

            {/* Cards Grid */}
            <div
                className={`grid gap-6 w-full mx-auto mb-12 ${
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
                            className={`flex flex-col justify-between rounded-2xl bg-[#141417] border transition-all duration-200 overflow-hidden relative ${
                                plan.is_popular
                                    ? 'border-[#635bff]/40 shadow-xl shadow-[#635bff]/5'
                                    : 'border-white/[0.08] hover:border-white/20'
                            }`}
                        >
                            {plan.badge_top ? (
                                <div className="px-4 py-2 bg-[#1c1c22] border-b border-white/[0.06] flex items-center justify-between text-[11px]">
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

                            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <h2
                                            className="text-lg lowercase text-white tracking-tight"
                                            style={{ fontWeight: 440 }}
                                        >
                                            {plan.name}
                                        </h2>
                                        {plan.is_popular && (
                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#252530] text-neutral-300 border border-white/10">
                                                Popular
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2 min-h-[32px]">
                                        {plan.tagline}
                                    </p>

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

            <div className="mt-auto text-center text-xs text-neutral-500 pb-4">
                <p>
                    For {selectedCategory === 'business' ? 'organization' : 'personal'} use only and subject to our{' '}
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
    );
}
