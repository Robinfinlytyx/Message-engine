'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Project } from '@/lib/api';
import { ChevronLeft, Upload, Loader2, PlayCircle, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import TemplatePreviewDialog from '@/components/TemplatePreviewDialog';

export default function CreateCampaignPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const router = useRouter();

    const [project, setProject] = useState<Project | null>(null);
    const [apiKey, setApiKey] = useState<string>('');
    const [templates, setTemplates] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    
    // CSV State
    const [csvData, setCsvData] = useState<any[]>([]);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    
    // Mapping state
    const [phoneColumn, setPhoneColumn] = useState<string>('');
    const [variableMapping, setVariableMapping] = useState<Record<number, string>>({}); // index -> csv_column_name

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    const fetchProjectData = async () => {
        try {
            const { data: projData } = await api.projects.get(projectId);
            setProject(projData);

            const { data: keyData } = await api.projects.getApiKey(projectId);
            const key = keyData.apiKey;
            setApiKey(key);

            try {
                const { data: templateData } = await api.getWhatsAppTemplates(projectId, key);
                setTemplates(templateData || []);
            } catch (tErr) {
                console.error("Failed to load templates:", tErr);
            }
        } catch (err) {
            setError('Failed to load project details or API key.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            // Basic CSV parser
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) {
                setError('CSV must contain a header row and at least one row of data.');
                return;
            }

            // Extract headers
            const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            setCsvHeaders(rawHeaders);
            
            // Try to auto-guess phone column
            const phoneGuess = rawHeaders.find(h => h.toLowerCase().includes('phone') || h.toLowerCase().includes('number') || h.toLowerCase().includes('mobile'));
            if (phoneGuess) setPhoneColumn(phoneGuess);

            // Parse rows
            const parsedData = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const rowObj: any = {};
                rawHeaders.forEach((header, index) => {
                    rowObj[header] = values[index] !== undefined ? values[index] : '';
                });
                parsedData.push(rowObj);
            }

            setCsvData(parsedData);
            setError(null);
        };
        reader.readAsText(file);
    };

    // Calculate how many variables {{1}}, {{2}} exist in the template body Text
    const getTemplateVarCount = () => {
        if (!selectedTemplate) return 0;
        const bodyComponent = selectedTemplate.components?.find((c: any) => c.type === 'BODY');
        if (!bodyComponent || !bodyComponent.text) return 0;
        
        const matches = bodyComponent.text.match(/\{\{\d+\}\}/g);
        if (!matches) return 0;
        
        const nums = matches.map((m: string) => parseInt(m.replace(/\{|\}/g, '')));
        return Math.max(...nums);
    };

    const varCount = getTemplateVarCount();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) return setError("Campaign name is required.");
        if (!selectedTemplate) return setError("Please select a template.");
        if (csvData.length === 0) return setError("Please upload a CSV file with valid contacts.");
        if (!phoneColumn) return setError("Please map the Phone Number column from the CSV.");

        setSubmitting(true);

        try {
            // Transform CSV data into expected payload messages array
            const messages = csvData.map((row, index) => {
                const phone = row[phoneColumn];
                if (!phone) throw new Error(`Row ${index + 1} is missing a phone number.`);

                const msg: any = {
                    to: phone.startsWith('+') ? phone : `+${phone}`, // basic enforcement
                    templateName: selectedTemplate.name,
                    language: selectedTemplate.language
                };

                if (varCount > 0) {
                    const mappedVars = [];
                    for (let i = 1; i <= varCount; i++) {
                        const colName = variableMapping[i];
                        if (colName && row[colName]) {
                            mappedVars.push(row[colName]);
                        } else {
                            mappedVars.push(""); // Fallback explicitly empty
                        }
                    }
                    if (mappedVars.length > 0) {
                        msg.body = { text: mappedVars };
                    }
                }

                return msg;
            });

            const payload = {
                name,
                messages
            };

            await api.createWhatsAppCampaign(projectId, apiKey, payload);

            // Using standard navigation inside a timeout to allow server to safely process block bounds
            setTimeout(() => {
                router.push(`/projects/${projectId}`);
            }, 600);
            
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Failed to create campaign');
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Campaign Builder...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div>
                <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
                    <Link href={`/projects/${projectId}`} className="flex items-center gap-2">
                        <ChevronLeft className="h-4 w-4" /> Back to Project
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Launch Campaign</h1>
                    <p className="text-muted-foreground mt-1">Upload an audience list and send a bulk WhatsApp broadcast for {project?.name}.</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Basic Configurations */}
                <Card>
                    <CardHeader>
                        <CardTitle>Campaign Details</CardTitle>
                        <CardDescription>Name your campaign and select your approved messaging blueprint.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2 max-w-md">
                            <label htmlFor="campaign-name" className="text-sm font-medium leading-none">Campaign Name</label>
                            <Input
                                id="campaign-name"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Summer Sale 2026 Announcement"
                            />
                        </div>

                        <div className="space-y-2 max-w-md">
                            <label htmlFor="template" className="text-sm font-medium leading-none">WhatsApp Template</label>
                            <div className="flex items-center gap-3">
                                <select
                                    id="template"
                                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                    value={selectedTemplate?.name || ''}
                                    onChange={(e) => {
                                        const t = templates.find(temp => temp.name === e.target.value);
                                        setSelectedTemplate(t || null);
                                    }}
                                >
                                    <option value="" disabled>Choose an approved template</option>
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
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Audience Data (CSV Upload) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Audience List (CSV)</CardTitle>
                        <CardDescription>Upload your bulk contacts. Must include a phone number column.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-muted/30">
                            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="font-semibold text-lg">Select CSV File</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">.csv format only</p>
                            <Input 
                                type="file" 
                                accept=".csv" 
                                onChange={handleFileUpload} 
                                className="max-w-xs mx-auto file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:cursor-pointer cursor-pointer"
                            />
                        </div>

                        {csvData.length > 0 && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                                <p className="text-emerald-700 font-medium flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    Successfully parsed {csvData.length} contacts
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Data Mapping */}
                {csvHeaders.length > 0 && selectedTemplate && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Integration Mapping</CardTitle>
                            <CardDescription>Match your CSV columns to the message variables required by your template.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Mandatory Mapping */}
                                <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
                                    <h4 className="font-medium text-sm border-b pb-2">Required Contact Routing</h4>
                                    
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-primary">Target Phone Number</label>
                                        <select
                                            className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            value={phoneColumn}
                                            onChange={e => setPhoneColumn(e.target.value)}
                                            required
                                        >
                                            <option value="" disabled>Select the phone number column</option>
                                            {csvHeaders.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-muted-foreground">Select the column containing the destination phone numbers. Remember country codes are required.</p>
                                    </div>
                                </div>

                                {/* Dynamic Template Variable Mapping */}
                                {varCount > 0 ? (
                                    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
                                        <h4 className="font-medium text-sm border-b pb-2">Template Body Variables</h4>
                                        <div className="space-y-3">
                                            {Array.from({ length: varCount }, (_, i) => i + 1).map(num => (
                                                <div key={num} className="space-y-1">
                                                    <label className="text-xs font-medium">Mapped to {"{{"}{num}{"}}"}</label>
                                                    <select
                                                        className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                        value={variableMapping[num] || ''}
                                                        onChange={e => setVariableMapping({ ...variableMapping, [num]: e.target.value })}
                                                    >
                                                        <option value="">-- Don't Map (Empty) --</option>
                                                        {csvHeaders.map(h => (
                                                            <option key={h} value={h}>{h}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 border border-border rounded-lg bg-muted text-muted-foreground text-sm flex items-center justify-center">
                                        No dynamic text variables needed for this template.
                                    </div>
                                )}
                            </div>

                            {/* Data Preview */}
                            {csvData.length > 0 && phoneColumn && (
                                <div className="border border-border rounded-lg overflow-hidden mt-6">
                                    <div className="bg-muted px-4 py-2 border-b border-border">
                                        <h4 className="text-sm font-semibold">Message Assembly Preview (First 3)</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-background">
                                                <tr>
                                                    <th className="text-left px-4 py-2 font-medium">Recipient</th>
                                                    <th className="text-left px-4 py-2 font-medium">Extracted Name</th>
                                                    {Array.from({ length: varCount }, (_, i) => i + 1).map(num => (
                                                        <th key={num} className="text-left px-4 py-2 font-medium text-blue-600">{"{{"}{num}{"}}"} value</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {csvData.slice(0, 3).map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2 font-mono bg-muted/30">{row[phoneColumn] || '!! Missing !!'}</td>
                                                        <td className="px-4 py-2 text-muted-foreground">{selectedTemplate.name}</td>
                                                        {Array.from({ length: varCount }, (_, i) => i + 1).map(num => (
                                                            <td key={num} className="px-4 py-2 text-blue-700 font-medium bg-blue-50/50">
                                                                {variableMapping[num] ? row[variableMapping[num]] : <span className="text-muted-foreground italic">empty</span>}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                )}

                <div className="sticky bottom-4 pt-4 flex justify-end">
                    <Button type="submit" size="lg" disabled={submitting || csvData.length === 0} className="w-full sm:w-auto shadow-xl">
                        {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
                        {submitting ? 'Generating Messages...' : 'Launch Broadcast Batch'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
