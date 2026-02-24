'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Project } from '@/lib/api';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
type HeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
type ButtonType = 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER' | 'COPY_CODE';

interface TemplateComponent {
    type: ComponentType;
    format?: HeaderFormat;
    text?: string;
    example?: any;
    bodyExample?: string;
    buttons?: TemplateButton[];
}

interface TemplateButton {
    type: ButtonType;
    text?: string;
    url?: string;
    urlExample?: string;
    phoneNumber?: string;
    example?: string; // used for COPY_CODE
}

export default function CreateTemplatePage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<Project | null>(null);
    const [apiKey, setApiKey] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('en');
    const [category, setCategory] = useState('MARKETING');
    const [allowCategoryChange, setAllowCategoryChange] = useState(true);
    const [components, setComponents] = useState<TemplateComponent[]>([
        { type: 'BODY', text: '', bodyExample: '' }
    ]);

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    const fetchProjectData = async () => {
        try {
            const { data } = await api.getProjects();
            const found = data.find(p => p.id === projectId);
            if (found) {
                setProject(found);
                const { apiKey: key } = await api.getProjectApiKey(projectId);
                setApiKey(key);
            }
        } catch (err) {
            setError('Failed to load project details or API key.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addComponent = (type: ComponentType) => {
        if (components.some(c => c.type === type)) {
            alert(`A ${type} component already exists.`);
            return;
        }
        const newComponent: TemplateComponent = { type };
        if (type === 'HEADER') newComponent.format = 'TEXT';
        if (type === 'BUTTONS') newComponent.buttons = [];
        setComponents([...components, newComponent]);
    };

    const removeComponent = (index: number) => {
        setComponents(components.filter((_, i) => i !== index));
    };

    const updateComponent = (index: number, updates: Partial<TemplateComponent>) => {
        const newComponents = [...components];
        newComponents[index] = { ...newComponents[index], ...updates };
        setComponents(newComponents);
    };

    const addButton = (compIndex: number) => {
        const newComponents = [...components];
        if (!newComponents[compIndex].buttons) newComponents[compIndex].buttons = [];
        // Max 3 buttons typically allowed by WhatsApp, but we won't strictly enforce here
        newComponents[compIndex].buttons!.push({ type: 'QUICK_REPLY', text: 'New Button' });
        setComponents(newComponents);
    };

    const updateButton = (compIndex: number, buttonIndex: number, updates: Partial<TemplateButton>) => {
        const newComponents = [...components];
        newComponents[compIndex].buttons![buttonIndex] = { ...newComponents[compIndex].buttons![buttonIndex], ...updates };
        setComponents(newComponents);
    };

    const removeButton = (compIndex: number, buttonIndex: number) => {
        const newComponents = [...components];
        newComponents[compIndex].buttons!.splice(buttonIndex, 1);
        setComponents(newComponents);
    };

    // Helper to extract variables from text {{1}}, {{2}} etc.
    const extractVariablesCount = (text: string) => {
        const matches = text.match(/\{\{\d+\}\}/g);
        if (!matches) return 0;
        const nums = matches.map(m => parseInt(m.replace(/\{|\}/g, '')));
        return Math.max(...nums);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            // Pre-process components for payload specifically based on backend documentation
            const processedComponents = components.map(comp => {
                const processed = { ...comp };

                if (processed.type === 'BODY' && processed.text) {
                    const varCount = extractVariablesCount(processed.text);
                    if (varCount > 0) {
                        // Assuming the user has provided a comma-separated bodyExample string (e.g. "John, 1234")
                        // which we parse and convert to the expected [[ "John", "1234" ]] structure
                        const exampleVals = (processed.bodyExample || '').split(',').map(s => s.trim());
                        // fill missing examples with generic strings if needed
                        for (let i = 0; i < varCount; i++) {
                            if (!exampleVals[i]) exampleVals[i] = `sample_${i + 1}`;
                        }
                        processed.example = {
                            bodyText: [exampleVals.slice(0, varCount)]
                        };
                        // For Telinfy's typical payload, keep bodyExample as original or joined string if needed
                        processed.bodyExample = processed.text.replace(/\{\{\d+\}\}/g, (match) => {
                            const idx = parseInt(match.replace(/\{|\}/g, '')) - 1;
                            return exampleVals[idx] || match;
                        });
                    }
                }

                if (processed.type === 'HEADER' && processed.format && processed.format !== 'TEXT') {
                    // Make sure example structure exists for media
                    if (!processed.example || !processed.example.headerHandle) {
                        processed.example = {
                            headerHandle: ["https://www.example.com/sample_media"],
                            mediaUrl: "https://www.example.com/sample_media"
                        };
                    } else if (typeof processed.example.headerHandle === 'string') {
                        const url = processed.example.headerHandle;
                        processed.example = {
                            headerHandle: [url],
                            mediaUrl: url
                        };
                    }
                }

                return processed;
            });

            const payload = {
                name,
                language,
                category,
                allowCategoryChange,
                label: name, // generic fallback
                components: processedComponents
            };

            await api.createWhatsAppTemplate(projectId, apiKey, payload);

            alert('Template created successfully (sent to Telinfy for approval)!');
            router.push(`/projects`);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to create template');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div>
                <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
                    <Link href={`/projects`} className="flex items-center gap-2">
                        <ChevronLeft className="h-4 w-4" /> Back to Projects
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Template</h1>
                    <p className="text-muted-foreground mt-1">Design a new WhatsApp message template for {project?.name}.</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Template Details</CardTitle>
                        <CardDescription>Basic configurations for your template.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name (lowercase_and_underscores)</label>
                                <Input
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                    placeholder="e.g. order_confirmation"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Language</label>
                                <select
                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={language}
                                    onChange={e => setLanguage(e.target.value)}
                                >
                                    <option value="en">English (en)</option>
                                    <option value="en_US">English (US)</option>
                                    <option value="en_GB">English (UK)</option>
                                    <option value="es">Spanish (es)</option>
                                    <option value="ar">Arabic (ar)</option>
                                    {/* Add more as needed */}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <select
                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                >
                                    <option value="MARKETING">Marketing</option>
                                    <option value="UTILITY">Utility</option>
                                    <option value="AUTHENTICATION">Authentication</option>
                                </select>
                            </div>
                            <div className="space-y-2 flex flex-col justify-end pb-2">
                                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={allowCategoryChange}
                                        onChange={e => setAllowCategoryChange(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    Allow Category Change
                                </label>
                                <p className="text-xs text-muted-foreground ml-6">Meta might categorize the template differently during review.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Components Builder */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Components</h2>
                        <div className="flex gap-2">
                            {['HEADER', 'BODY', 'FOOTER', 'BUTTONS'].map(type => (
                                <Button
                                    type="button"
                                    key={type}
                                    variant="outline"
                                    size="sm"
                                    disabled={components.some(c => c.type === type)}
                                    onClick={() => addComponent(type as ComponentType)}
                                >
                                    + {type}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {components.map((comp, index) => (
                        <Card key={index} className="border-primary/20">
                            <CardHeader className="py-3 bg-muted/50 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold">{comp.type}</CardTitle>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeComponent(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {comp.type === 'HEADER' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium">Format</label>
                                            <select
                                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                value={comp.format}
                                                onChange={e => updateComponent(index, { format: e.target.value as HeaderFormat })}
                                            >
                                                <option value="TEXT">Text</option>
                                                <option value="IMAGE">Image</option>
                                                <option value="VIDEO">Video</option>
                                                <option value="DOCUMENT">Document</option>
                                            </select>
                                        </div>
                                        {comp.format === 'TEXT' ? (
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium">Text Content (No variables allowed)</label>
                                                <Input
                                                    value={comp.text || ''}
                                                    onChange={e => updateComponent(index, { text: e.target.value })}
                                                    placeholder="Header Text"
                                                    maxLength={60}
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium">Example Media URL (Required for approval)</label>
                                                <Input
                                                    value={comp.example?.headerHandle || ''}
                                                    onChange={e => updateComponent(index, { example: { headerHandle: e.target.value } })}
                                                    placeholder="https://example.com/media.mp4"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                {comp.type === 'BODY' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium flex justify-between">
                                                <span>Text Content</span>
                                                <span className="text-muted-foreground font-normal">Use {"{{1}}"}, {"{{2}}"} for variables</span>
                                            </label>
                                            <textarea
                                                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                required
                                                value={comp.text || ''}
                                                onChange={e => updateComponent(index, { text: e.target.value })}
                                                placeholder="Hello {{1}}, your order {{2}} has been shipped."
                                            />
                                        </div>
                                        {extractVariablesCount(comp.text || '') > 0 && (
                                            <div className="space-y-2 p-3 bg-muted rounded-md border border-border">
                                                <label className="text-xs font-medium text-primary">Provide Sample Values for Variables</label>
                                                <p className="text-xs text-muted-foreground mb-2">Comma separated values for {"{{1}}, {{2}}"}, etc.</p>
                                                <Input
                                                    required
                                                    value={comp.bodyExample || ''}
                                                    onChange={e => updateComponent(index, { bodyExample: e.target.value })}
                                                    placeholder="John, #12345"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                {comp.type === 'FOOTER' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">Text Content</label>
                                        <Input
                                            value={comp.text || ''}
                                            onChange={e => updateComponent(index, { text: e.target.value })}
                                            placeholder="Footer Text (Max 60 chars)"
                                            maxLength={60}
                                            required
                                        />
                                    </div>
                                )}

                                {comp.type === 'BUTTONS' && (
                                    <div className="space-y-4">
                                        {comp.buttons?.map((button, btnIndex) => (
                                            <div key={btnIndex} className="p-3 border border-border rounded-md space-y-3 relative group">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                                    onClick={() => removeButton(index, btnIndex)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium">Button Type</label>
                                                        <select
                                                            className="w-full h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
                                                            value={button.type}
                                                            onChange={e => updateButton(index, btnIndex, { type: e.target.value as ButtonType })}
                                                        >
                                                            <option value="QUICK_REPLY">Quick Reply</option>
                                                            <option value="URL">URL</option>
                                                            <option value="PHONE_NUMBER">Phone Number</option>
                                                            <option value="COPY_CODE">Copy Code</option>
                                                        </select>
                                                    </div>

                                                    {button.type !== 'COPY_CODE' && (
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium">Button Text</label>
                                                            <Input
                                                                className="h-8 text-xs"
                                                                value={button.text || ''}
                                                                onChange={e => updateButton(index, btnIndex, { text: e.target.value })}
                                                                placeholder={button.type === 'PHONE_NUMBER' ? "Call Us" : "Click Here"}
                                                                required
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {button.type === 'URL' && (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium">URL (Supports {"{{1}}"} at end)</label>
                                                            <Input
                                                                className="h-8 text-xs"
                                                                value={button.url || ''}
                                                                onChange={e => updateButton(index, btnIndex, { url: e.target.value })}
                                                                placeholder="https://example.com/track/{{1}}"
                                                                required
                                                            />
                                                        </div>
                                                        {button.url?.includes('{{1}}') && (
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-medium">URL Example</label>
                                                                <Input
                                                                    className="h-8 text-xs"
                                                                    value={button.urlExample || ''}
                                                                    onChange={e => updateButton(index, btnIndex, { urlExample: e.target.value })}
                                                                    placeholder="https://example.com/track/12345"
                                                                    required
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {button.type === 'PHONE_NUMBER' && (
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium">Phone Number (+CountryCode...)</label>
                                                        <Input
                                                            className="h-8 text-xs"
                                                            value={button.phoneNumber || ''}
                                                            onChange={e => updateButton(index, btnIndex, { phoneNumber: e.target.value })}
                                                            placeholder="+1234567890"
                                                            required
                                                        />
                                                    </div>
                                                )}

                                                {button.type === 'COPY_CODE' && (
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium">Example Code</label>
                                                        <Input
                                                            className="h-8 text-xs"
                                                            value={button.example || ''}
                                                            onChange={e => updateButton(index, btnIndex, { example: e.target.value })}
                                                            placeholder="SAVE20"
                                                            required
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {(!comp.buttons || comp.buttons.length < 3) && (
                                            <Button type="button" variant="outline" size="sm" onClick={() => addButton(index)}>
                                                + Add Button
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="sticky bottom-4 pt-4 flex justify-end">
                    <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto shadow-lg">
                        {submitting ? 'Creating...' : 'Submit to Telinfy'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
