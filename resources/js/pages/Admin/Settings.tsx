import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import {
    ArrowLeft,
    Save,
    Key,
    Sliders,
    Zap,
    RotateCw,
    Shield,
    Eye,
    EyeOff,
    CheckCircle2,
} from 'lucide-react';

interface ProviderSetting {
    id: number;
    provider: string;
    display_name: string;
    default_model: string;
    available_models: Record<string, { name: string; type: string }> | null;
    capabilities: string[] | null;
    is_active: boolean;
    is_default: boolean;
    masked_api_key: string | null;
    base_url: string | null;
    temperature: number;
    max_tokens: number;
    system_prompt: string | null;
    has_key: boolean;
}

interface Props {
    settings: ProviderSetting[];
}

export default function AdminSettings({ settings }: Props) {
    const [selectedProviderId, setSelectedProviderId] = useState<number>(settings[0]?.id || 1);
    const [formData, setFormData] = useState<Record<number, any>>(() => {
        const initial: Record<number, any> = {};
        settings.forEach((s) => {
            initial[s.id] = {
                default_model: s.default_model,
                api_key: '',
                base_url: s.base_url || '',
                temperature: s.temperature,
                max_tokens: s.max_tokens,
                system_prompt: s.system_prompt || '',
                is_active: s.is_active,
            };
        });
        return initial;
    });

    const [showKey, setShowKey] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const currentSetting = settings.find((s) => s.id === selectedProviderId) || settings[0];
    const currentForm = formData[selectedProviderId] || {};

    const handleFieldChange = (field: string, val: any) => {
        setFormData({
            ...formData,
            [selectedProviderId]: {
                ...currentForm,
                [field]: val,
            },
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await router.put(`/admin/providers/${selectedProviderId}`, currentForm, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Saved settings for ${currentSetting.display_name}.`);
                    // clear entered raw api_key field after save for security
                    handleFieldChange('api_key', '');
                },
                onError: (err) => {
                    toast.error('Failed to update provider settings.');
                },
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        try {
            const res = await axios.post(`/admin/providers/${selectedProviderId}/test`, {
                api_key: currentForm.api_key || undefined,
                default_model: currentForm.default_model,
                base_url: currentForm.base_url || undefined,
            });

            if (res.data.success) {
                toast.success(res.data.message || `Connected in ${res.data.latency_ms}ms!`);
            } else {
                toast.error(res.data.error || 'Connection failed.');
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Connection test error.');
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <AppLayout>
            <Head title="AI Engine Providers - Dynime AI" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <Link href="/admin">
                            <Button variant="ghost" size="sm" className="rounded-lg text-slate-500 hover:text-slate-900">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                <span>Overview</span>
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                                AI Provider Configuration & Encrypted Keys
                            </h1>
                            <p className="text-xs text-slate-500">
                                Secure AES-256 encrypted credential management for all underlying LLM engines.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings Layout: Left Navigation, Right Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Left Provider Tabs */}
                    <div className="space-y-1">
                        {settings.map((item) => {
                            const isSelected = item.id === selectedProviderId;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedProviderId(item.id);
                                        setShowKey(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                                        isSelected
                                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                        <span>{item.display_name}</span>
                                    </div>
                                    {item.has_key && (
                                        <span
                                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                                isSelected ? 'bg-purple-700 text-purple-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}
                                        >
                                            Active
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Form Card */}
                    <div className="md:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        {currentSetting.display_name} Engine Setup
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Provider Identifier: <code className="text-purple-600">{currentSetting.provider}</code>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isTesting}
                                        onClick={handleTest}
                                        className="rounded-lg text-xs h-8"
                                    >
                                        {isTesting ? (
                                            <RotateCw className="w-3.5 h-3.5 animate-spin mr-1.5 text-purple-600" />
                                        ) : (
                                            <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                                        )}
                                        <span>Ping & Test Latency</span>
                                    </Button>

                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isSaving}
                                        className="rounded-lg text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        <Save className="w-3.5 h-3.5 mr-1.5" />
                                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                                    </Button>
                                </div>
                            </div>

                            {/* API Key */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                    <span>API Key (AES-256 Encrypted)</span>
                                    {currentSetting.has_key && (
                                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                                            Current stored key: {currentSetting.masked_api_key}
                                        </span>
                                    )}
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showKey ? 'text' : 'password'}
                                        placeholder={currentSetting.has_key ? 'Enter new key to replace current key...' : 'sk-...'}
                                        value={currentForm.api_key}
                                        onChange={(e) => handleFieldChange('api_key', e.target.value)}
                                        className="pr-10 rounded-lg text-xs font-mono h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Model Select */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        Default Model
                                    </Label>
                                    <Input
                                        type="text"
                                        value={currentForm.default_model}
                                        onChange={(e) => handleFieldChange('default_model', e.target.value)}
                                        placeholder="e.g. gpt-4o or claude-3-7-sonnet"
                                        className="rounded-lg text-xs h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    />
                                    {currentSetting.available_models && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {Object.keys(currentSetting.available_models).map((m) => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => handleFieldChange('default_model', m)}
                                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-colors ${
                                                        currentForm.default_model === m
                                                            ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-400 text-purple-700 dark:text-purple-300'
                                                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                                                    }`}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        Custom Base URL (Optional)
                                    </Label>
                                    <Input
                                        type="text"
                                        value={currentForm.base_url}
                                        onChange={(e) => handleFieldChange('base_url', e.target.value)}
                                        placeholder="Default endpoint URL"
                                        className="rounded-lg text-xs h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    />
                                </div>
                            </div>

                            {/* Temperature & Max Tokens */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <Label className="font-semibold text-slate-800 dark:text-slate-200">Temperature</Label>
                                        <span className="font-mono text-purple-600">{currentForm.temperature}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1.5"
                                        step="0.05"
                                        value={currentForm.temperature}
                                        onChange={(e) => handleFieldChange('temperature', parseFloat(e.target.value))}
                                        className="w-full accent-purple-600"
                                    />
                                    <p className="text-[10px] text-slate-400">Lower for analytical precision, higher for creativity.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        Max Output Tokens
                                    </Label>
                                    <Input
                                        type="number"
                                        value={currentForm.max_tokens}
                                        onChange={(e) => handleFieldChange('max_tokens', parseInt(e.target.value))}
                                        className="rounded-lg text-xs h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                    />
                                </div>
                            </div>

                            {/* System Prompt Instructions */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    Provider-Specific Persona / System Prompt (Optional)
                                </Label>
                                <textarea
                                    rows={3}
                                    value={currentForm.system_prompt}
                                    onChange={(e) => handleFieldChange('system_prompt', e.target.value)}
                                    placeholder="Enter additional directives to prepend for this model..."
                                    className="w-full rounded-lg text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
