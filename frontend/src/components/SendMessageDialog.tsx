import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Send, Loader2 } from 'lucide-react';
import TemplatePreviewDialog from '@/components/TemplatePreviewDialog';

interface SendMessageDialogProps {
    projectId: string;
    onMessageSent?: () => void;
}

export default function SendMessageDialog({ projectId, onMessageSent }: SendMessageDialogProps) {
    const [open, setOpen] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    
    // Form state
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [recipient, setRecipient] = useState('');
    const [variables, setVariables] = useState<string>('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (open) {
            setupData();
        } else {
            // Reset state
            setRecipient('');
            setVariables('');
            setSelectedTemplate(null);
            setError(null);
            setSuccess(false);
        }
    }, [open, projectId]);

    const setupData = async () => {
        setLoadingTemplates(true);
        setError(null);
        try {
            // 1. Get API Key
            const { data } = await api.projects.getApiKey(projectId);
            const key = data.apiKey;
            setApiKey(key);

            // 2. Fetch Templates
            const { data: templateData } = await api.getWhatsAppTemplates(projectId, key);
            setTemplates(templateData || []);
        } catch (err: any) {
            console.error('Failed to load templates or api key', err);
            setError('Failed to load project templates. Please check your configuration.');
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSending(true);
        setSuccess(false);

        if (!selectedTemplate) {
            setError('Please select a template');
            setSending(false);
            return;
        }

        try {
            // Reconstruct the expected body payload for the template
            let bodyParams = undefined;
            if (variables.trim()) {
                bodyParams = { text: variables.split(',').map(s => s.trim()) };
            }

            const payload: any = {
                to: recipient,
                templateName: selectedTemplate.name,
                language: selectedTemplate.language
            };
            
            if (bodyParams) {
                payload.body = bodyParams;
            }

            await api.sendWhatsAppTemplate(projectId, apiKey, payload);
            setSuccess(true);
            setTimeout(() => {
                setOpen(false);
                if (onMessageSent) onMessageSent();
            }, 1000);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Send className="mr-2 h-4 w-4" /> Send Test Message
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSend}>
                    <DialogHeader>
                        <DialogTitle>Send Message</DialogTitle>
                        <DialogDescription>
                            Send a pre-approved WhatsApp template to a specific contact.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {error && (
                            <div className="text-sm p-3 bg-destructive/10 text-destructive rounded-md">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="text-sm p-3 bg-emerald-50 text-emerald-600 rounded-md">
                                Message sent successfully!
                            </div>
                        )}

                        <div className="grid gap-2">
                            <label htmlFor="recipient" className="text-sm font-medium leading-none">Recipient Phone Number</label>
                            <Input
                                id="recipient"
                                placeholder="+1234567890"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">Must include country code (e.g. +1 for US, +91 for India)</p>
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="template" className="text-sm font-medium leading-none">Select Template</label>
                            <div className="flex items-center gap-3">
                                <select
                                    id="template"
                                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                    value={selectedTemplate?.name || ''}
                                    onChange={(e) => {
                                        const t = templates.find(t => t.name === e.target.value);
                                        setSelectedTemplate(t || null);
                                    }}
                                    disabled={loadingTemplates}
                                >
                                    <option value="" disabled>
                                        {loadingTemplates ? 'Loading templates...' : 'Choose an approved template'}
                                    </option>
                                    {templates.filter(t => t.status === 'APPROVED').map(t => (
                                        <option key={t.id} value={t.name}>
                                            {t.name} ({t.language})
                                        </option>
                                    ))}
                                </select>
                                {selectedTemplate && (
                                    <TemplatePreviewDialog template={selectedTemplate} />
                                )}
                            </div>
                            {templates.filter(t => t.status === 'APPROVED').length === 0 && !loadingTemplates && (
                                <p className="text-xs text-muted-foreground">No approved templates found. Wait for Meta approval or sync updates.</p>
                            )}
                        </div>

                        {selectedTemplate && (
                            <div className="grid gap-2">
                                <label htmlFor="variables" className="text-sm font-medium leading-none">Body Variables (Optional)</label>
                                <Input
                                    id="variables"
                                    placeholder="John, #12345"
                                    value={variables}
                                    onChange={(e) => setVariables(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Comma-separated values to fill {"{{1}}"}, {"{{2}}"} variables in the template body.</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={sending || loadingTemplates || templates.length === 0}>
                            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Send Message
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
