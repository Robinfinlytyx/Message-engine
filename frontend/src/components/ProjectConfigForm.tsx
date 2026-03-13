'use client';

import { useState, useEffect } from 'react';
import { api, ProjectConfig, ProjectConfigInput } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    MessageSquare,
    Mail,
    Save,
    TestTube,
    CheckCircle2,
    XCircle,
    Loader2,
    Trash2,
    Eye,
    EyeOff,
    Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProjectConfigFormProps {
    projectId: string;
}

export default function ProjectConfigForm({ projectId }: ProjectConfigFormProps) {
    // Config state
    const [config, setConfig] = useState<ProjectConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Toast-like feedback
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // WhatsApp fields
    const [waEnabled, setWaEnabled] = useState(false);
    const [telinfyApiKey, setTelinfyApiKey] = useState('');
    const [whatsappBusinessId, setWhatsappBusinessId] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);

    // New Telinfy fields
    const [telinfyAccessId, setTelinfyAccessId] = useState('');
    const [showAccessId, setShowAccessId] = useState(false);
    const [telinfyPhoneNumberId, setTelinfyPhoneNumberId] = useState('');
    const [telinfyUserName, setTelinfyUserName] = useState('');
    const [telinfyBusinessAccountId, setTelinfyBusinessAccountId] = useState('');

    // Email fields
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState('465');
    const [smtpSecure, setSmtpSecure] = useState(true);
    const [smtpUser, setSmtpUser] = useState('');
    const [smtpPassword, setSmtpPassword] = useState('');
    const [showSmtpPassword, setShowSmtpPassword] = useState(false);
    const [defaultFromEmail, setDefaultFromEmail] = useState('');
    const [defaultFromName, setDefaultFromName] = useState('');

    // Test states
    const [testingWa, setTestingWa] = useState(false);
    const [waTestResult, setWaTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [testingEmail, setTestingEmail] = useState(false);
    const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        fetchConfig();
    }, [projectId]);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const result = await api.getProjectConfig(projectId);
            setConfig(result.data);
            if (result.data) {
                setWaEnabled(result.data.whatsappEnabled);
                setTelinfyApiKey(''); // API returns masked, don't prefill
                setWhatsappBusinessId(result.data.telinfyWhatsappBusinessId || '');
                setTelinfyAccessId(''); // Masked
                setTelinfyPhoneNumberId(result.data.telinfyPhoneNumberId || '');
                setTelinfyUserName(result.data.telinfyUserName || '');
                setTelinfyBusinessAccountId(result.data.telinfyBusinessAccountId || '');
                setEmailEnabled(result.data.emailEnabled);
                setSmtpHost(result.data.smtpHost || '');
                setSmtpPort(String(result.data.smtpPort || 465));
                setSmtpSecure(result.data.smtpSecure);
                setSmtpUser(result.data.smtpUser || '');
                setSmtpPassword(''); // API returns masked
                setDefaultFromEmail(result.data.defaultFromEmail || '');
                setDefaultFromName(result.data.defaultFromName || '');
            }
        } catch {
            showFeedback('error', 'Failed to load configuration');
        } finally {
            setLoading(false);
        }
    };

    const showFeedback = (type: 'success' | 'error', message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 4000);
    };

    const markChanged = () => {
        setHasUnsavedChanges(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const data: ProjectConfigInput = {};

            // Only send whatsapp config if enabled or has values
            data.whatsapp = {
                enabled: waEnabled,
                ...(telinfyApiKey && { telinfyApiKey }),
                ...(whatsappBusinessId && { telinfyWhatsappBusinessId: whatsappBusinessId }),
                ...(telinfyAccessId && { telinfyAccessId }),
                ...(telinfyPhoneNumberId && { telinfyPhoneNumberId }),
                ...(telinfyUserName && { telinfyUserName }),
                ...(telinfyBusinessAccountId && { telinfyBusinessAccountId }),
            };

            // Only send email config if enabled or has values
            data.email = {
                enabled: emailEnabled,
                ...(smtpHost && { smtpHost }),
                ...(smtpPort && { smtpPort: parseInt(smtpPort) }),
                smtpSecure,
                ...(smtpUser && { smtpUser }),
                ...(smtpPassword && { smtpPassword }),
                ...(defaultFromEmail && { defaultFromEmail }),
                ...(defaultFromName && { defaultFromName }),
            };

            await api.upsertProjectConfig(projectId, data);
            setHasUnsavedChanges(false);
            showFeedback('success', 'Configuration saved successfully');
            // Refresh to get updated (masked) values
            await fetchConfig();
        } catch {
            showFeedback('error', 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this configuration? The project will revert to global defaults.')) return;
        try {
            setDeleting(true);
            await api.deleteProjectConfig(projectId);
            setConfig(null);
            setWaEnabled(false);
            setTelinfyApiKey('');
            setWhatsappBusinessId('');
            setTelinfyAccessId('');
            setTelinfyPhoneNumberId('');
            setTelinfyUserName('');
            setTelinfyBusinessAccountId('');
            setEmailEnabled(false);
            setSmtpHost('');
            setSmtpPort('465');
            setSmtpSecure(true);
            setSmtpUser('');
            setSmtpPassword('');
            setDefaultFromEmail('');
            setDefaultFromName('');
            setHasUnsavedChanges(false);
            showFeedback('success', 'Configuration deleted. Using global defaults.');
        } catch {
            showFeedback('error', 'Failed to delete configuration');
        } finally {
            setDeleting(false);
        }
    };

    const handleTestWhatsApp = async () => {
        setTestingWa(true);
        setWaTestResult(null);
        try {
            const result = await api.testWhatsAppConfig(projectId);
            setWaTestResult(result);
        } catch (err) {
            setWaTestResult({ success: false, message: err instanceof Error ? err.message : 'Test failed' });
        } finally {
            setTestingWa(false);
        }
    };

    const handleTestEmail = async () => {
        setTestingEmail(true);
        setEmailTestResult(null);
        try {
            const result = await api.testEmailConfig(projectId);
            setEmailTestResult(result);
        } catch (err) {
            setEmailTestResult({ success: false, message: err instanceof Error ? err.message : 'Test failed' });
        } finally {
            setTestingEmail(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-48 rounded-xl bg-card border border-border animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Feedback toast */}
            {feedback && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium animate-in slide-in-from-top-2 duration-300 ${feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {feedback.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <XCircle className="h-4 w-4" />
                    )}
                    {feedback.message}
                </div>
            )}

            {/* Config status */}
            {!config && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    No custom configuration found. This project uses global environment defaults. Save a configuration below to override.
                </div>
            )}

            {/* ── WhatsApp / Telinfy Card ── */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">WhatsApp (Telinfy)</CardTitle>
                                <CardDescription>Configure Telinfy API credentials for WhatsApp messaging</CardDescription>
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm text-muted-foreground">{waEnabled ? 'Enabled' : 'Disabled'}</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={waEnabled}
                                onClick={() => { setWaEnabled(!waEnabled); markChanged(); }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${waEnabled ? 'bg-primary' : 'bg-muted'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${waEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </label>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Telinfy API Key</label>
                        <div className="relative">
                            <Input
                                type={showApiKey ? 'text' : 'password'}
                                placeholder={config?.telinfyApiKey ? '••••' + config.telinfyApiKey : 'Enter Telinfy API Key'}
                                value={telinfyApiKey}
                                onChange={(e) => { setTelinfyApiKey(e.target.value); markChanged(); }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">WhatsApp Business ID</label>
                        <Input
                            placeholder="e.g. cf89041d-..."
                            value={whatsappBusinessId}
                            onChange={(e) => { setWhatsappBusinessId(e.target.value); markChanged(); }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border mt-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Access ID (Template API Key)</label>
                            <div className="relative">
                                <Input
                                    type={showAccessId ? 'text' : 'password'}
                                    placeholder={config?.telinfyAccessId ? '••••' : 'Enter Access ID'}
                                    value={telinfyAccessId}
                                    onChange={(e) => { setTelinfyAccessId(e.target.value); markChanged(); }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAccessId(!showAccessId)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showAccessId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone Number ID</label>
                            <Input
                                placeholder="e.g. 973046482554258"
                                value={telinfyPhoneNumberId}
                                onChange={(e) => { setTelinfyPhoneNumberId(e.target.value); markChanged(); }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">User Name</label>
                            <Input
                                placeholder="e.g. finlytyx"
                                value={telinfyUserName}
                                onChange={(e) => { setTelinfyUserName(e.target.value); markChanged(); }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Business Account ID (Template)</label>
                            <Input
                                placeholder="e.g. 851431301230898"
                                value={telinfyBusinessAccountId}
                                onChange={(e) => { setTelinfyBusinessAccountId(e.target.value); markChanged(); }}
                            />
                        </div>
                    </div>
                    {/* Test button */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleTestWhatsApp}
                            disabled={testingWa}
                        >
                            {testingWa ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                            Test Connection
                        </Button>
                        {waTestResult && (
                            <Badge variant={waTestResult.success ? 'default' : 'destructive'} className={waTestResult.success ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}>
                                {waTestResult.success ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                {waTestResult.message}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Email / SMTP Card ── */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Email (SMTP)</CardTitle>
                                <CardDescription>Configure SMTP credentials for email delivery</CardDescription>
                            </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm text-muted-foreground">{emailEnabled ? 'Enabled' : 'Disabled'}</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={emailEnabled}
                                onClick={() => { setEmailEnabled(!emailEnabled); markChanged(); }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailEnabled ? 'bg-primary' : 'bg-muted'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${emailEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </label>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">SMTP Host</label>
                            <Input
                                placeholder="smtp.gmail.com"
                                value={smtpHost}
                                onChange={(e) => { setSmtpHost(e.target.value); markChanged(); }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">SMTP Port</label>
                            <Input
                                type="number"
                                placeholder="465"
                                value={smtpPort}
                                onChange={(e) => { setSmtpPort(e.target.value); markChanged(); }}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">SMTP User</label>
                            <Input
                                placeholder="user@example.com"
                                value={smtpUser}
                                onChange={(e) => { setSmtpUser(e.target.value); markChanged(); }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">SMTP Password</label>
                            <div className="relative">
                                <Input
                                    type={showSmtpPassword ? 'text' : 'password'}
                                    placeholder={config?.smtpPassword ? '••••' : 'Password'}
                                    value={smtpPassword}
                                    onChange={(e) => { setSmtpPassword(e.target.value); markChanged(); }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={smtpSecure}
                                onChange={(e) => { setSmtpSecure(e.target.checked); markChanged(); }}
                                className="rounded border-border"
                            />
                            <span className="text-sm">Use SSL/TLS</span>
                        </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Default From Email</label>
                            <Input
                                placeholder="noreply@example.com"
                                value={defaultFromEmail}
                                onChange={(e) => { setDefaultFromEmail(e.target.value); markChanged(); }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Default From Name</label>
                            <Input
                                placeholder="My App"
                                value={defaultFromName}
                                onChange={(e) => { setDefaultFromName(e.target.value); markChanged(); }}
                            />
                        </div>
                    </div>
                    {/* Test button */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleTestEmail}
                            disabled={testingEmail}
                        >
                            {testingEmail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                            Test Connection
                        </Button>
                        {emailTestResult && (
                            <Badge variant={emailTestResult.success ? 'default' : 'destructive'} className={emailTestResult.success ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}>
                                {emailTestResult.success ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                {emailTestResult.message}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Action bar ── */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    {config && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Reset to Defaults
                        </Button>
                    )}
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>
        </div>
    );
}
