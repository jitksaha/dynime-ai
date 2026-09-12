import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import {
    Shield,
    Sparkles,
    Cpu,
    Zap,
    Clock,
    Activity,
    Sliders,
    CheckCircle2,
    XCircle,
    RotateCw,
    ExternalLink,
    Key,
    Database,
} from 'lucide-react';

interface ProviderSetting {
    id: number;
    provider: string;
    display_name: string;
    default_model: string;
    is_active: boolean;
    is_default: boolean;
    masked_api_key: string | null;
    has_key: boolean;
    temperature: number;
    max_tokens: number;
}

interface Stats {
    total_conversations: number;
    total_messages: number;
    active_providers: number;
    avg_latency_ms: number;
    total_tokens: number;
}

interface AuditLog {
    id: number;
    provider: string | null;
    model: string | null;
    capability: string;
    tokens_used: number | null;
    latency_ms: number | null;
    status: string;
    error_message: string | null;
    created_at: string;
    user?: { name: string; email: string };
}

interface Props {
    settings: ProviderSetting[];
    stats: Stats;
    recent_logs: AuditLog[];
}

export default function AdminIndex({ settings: initialSettings, stats, recent_logs }: Props) {
    const [settings, setSettings] = useState<ProviderSetting[]>(initialSettings);
    const [testingId, setTestingId] = useState<number | null>(null);

    const handleToggle = async (id: number) => {
        try {
            const res = await axios.post(`/admin/providers/${id}/toggle`);
            setSettings(
                settings.map((s) => (s.id === id ? { ...s, is_active: res.data.is_active } : s))
            );
            toast.success(res.data.message);
        } catch (e) {
            toast.error('Failed to toggle provider.');
        }
    };

    const handleTestConnection = async (id: number) => {
        setTestingId(id);
        try {
            const res = await axios.post(`/admin/providers/${id}/test`);
            if (res.data.success) {
                toast.success(res.data.message || `Connected in ${res.data.latency_ms}ms!`);
            } else {
                toast.error(res.data.error || 'Connection failed.');
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Connection test error.');
        } finally {
            setTestingId(null);
        }
    };

    return (
        <AppLayout>
            <Head title="Admin Dashboard - Dynime AI" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                                AI Orchestration & Engine Management
                            </h1>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#635bff]/10 dark:bg-[#635bff]/20 text-[#635bff] dark:text-[#9bb1ff]">
                                Enterprise Admin
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Control multi-model routing, monitor provider health, test latency, and configure capability fallbacks.
                        </p>
                    </div>

                    <Link href="/admin/settings">
                        <Button className="rounded-lg text-xs bg-[#635bff] hover:bg-[#5465ff] text-white flex items-center gap-2">
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Configure API Keys & Models</span>
                        </Button>
                    </Link>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Active Providers</span>
                            <Cpu className="w-4 h-4 text-[#635bff]" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                            {settings.filter((s) => s.is_active).length} / {settings.length}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">Engines available for failover</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Avg Latency (TTFT)</span>
                            <Clock className="w-4 h-4 text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                            {stats.avg_latency_ms} <span className="text-xs font-normal text-slate-400">ms</span>
                        </p>
                        <p className="text-[11px] text-emerald-500 mt-1">⚡ Fast-response pipeline</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Total Discussions</span>
                            <Database className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                            {stats.total_conversations}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">{stats.total_messages} messages recorded</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Tokens Processed</span>
                            <Activity className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                            {stats.total_tokens.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">Prompt & output tokens</p>
                    </div>
                </div>

                {/* Provider Grid Cards */}
                <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
                        Configured AI Providers & Status
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {settings.map((item) => (
                            <div
                                key={item.id}
                                className={`p-4 rounded-xl border transition-all ${
                                    item.is_active
                                        ? 'border-[#635bff]/25 dark:border-[#635bff]/30 bg-white dark:bg-slate-900 shadow-sm'
                                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-75'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-[#635bff]/10 dark:bg-[#635bff]/20 text-[#635bff] dark:text-[#9bb1ff] flex items-center justify-center font-bold text-xs">
                                            {item.display_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-xs text-slate-900 dark:text-white">
                                                {item.display_name}
                                            </p>
                                            <p className="text-[10px] text-slate-400">Model: {item.default_model}</p>
                                        </div>
                                    </div>

                                    {/* Active Toggle Switch */}
                                    <button
                                        type="button"
                                        onClick={() => handleToggle(item.id)}
                                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            item.is_active ? 'bg-[#635bff]' : 'bg-slate-300 dark:bg-slate-700'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                item.is_active ? 'translate-x-4' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                    <div className="flex items-center justify-between">
                                        <span>API Key Status:</span>
                                        {item.has_key ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                                                <Key className="w-3 h-3" /> {item.masked_api_key}
                                            </span>
                                        ) : (
                                            <span className="text-rose-500 font-medium">Not Configured</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Temperature:</span>
                                        <span className="font-mono text-slate-800 dark:text-slate-200">{item.temperature}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-2 flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={testingId === item.id || !item.has_key}
                                        onClick={() => handleTestConnection(item.id)}
                                        className="flex-1 rounded-lg text-xs h-7 border-slate-200 dark:border-slate-800"
                                    >
                                        {testingId === item.id ? (
                                            <RotateCw className="w-3 h-3 animate-spin mr-1 text-[#635bff]" />
                                        ) : (
                                            <Zap className="w-3 h-3 mr-1 text-amber-500" />
                                        )}
                                        <span>Test Connection</span>
                                    </Button>

                                    <Link href="/admin/settings">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-lg text-xs h-7 px-2 text-slate-500 hover:text-[#635bff]"
                                            title="Edit Provider"
                                        >
                                            <Sliders className="w-3.5 h-3.5" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Audit & Execution Logs Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                Real-Time AI Execution & Routing Logs
                            </h3>
                            <p className="text-[11px] text-slate-400">Audit trail of all synthesized completions</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="p-3">Time</th>
                                    <th className="p-3">User</th>
                                    <th className="p-3">Provider & Model</th>
                                    <th className="p-3">Capability</th>
                                    <th className="p-3">Tokens</th>
                                    <th className="p-3">Latency</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {recent_logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-slate-400">
                                            No execution logs recorded yet. Start a discussion in Chat!
                                        </td>
                                    </tr>
                                ) : (
                                    recent_logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="p-3 whitespace-nowrap text-slate-500">
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </td>
                                            <td className="p-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                                                {log.user?.name || 'User'}
                                            </td>
                                            <td className="p-3 whitespace-nowrap">
                                                <span className="font-mono text-[#635bff] dark:text-[#788bff]">
                                                    {log.provider || 'orchestrator'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 ml-1">
                                                    ({log.model || 'auto'})
                                                </span>
                                            </td>
                                            <td className="p-3 whitespace-nowrap">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                                    {log.capability}
                                                </span>
                                            </td>
                                            <td className="p-3 whitespace-nowrap font-mono">{log.tokens_used || '—'}</td>
                                            <td className="p-3 whitespace-nowrap font-mono">{log.latency_ms ? `${log.latency_ms}ms` : '—'}</td>
                                            <td className="p-3 whitespace-nowrap">
                                                {log.status === 'success' ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Success
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-rose-500 font-medium" title={log.error_message || 'Failed'}>
                                                        <XCircle className="w-3.5 h-3.5" /> Failed
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
