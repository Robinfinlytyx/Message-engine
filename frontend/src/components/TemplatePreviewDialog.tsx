import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface TemplatePreviewDialogProps {
    template: any;
}

export default function TemplatePreviewDialog({ template }: TemplatePreviewDialogProps) {
    if (!template) return null;

    const getComponent = (type: string) => {
        return template.components?.find((c: any) => c.type === type);
    };

    const header = getComponent('HEADER');
    const body = getComponent('BODY');
    const footer = getComponent('FOOTER');
    const buttons = getComponent('BUTTONS');

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" type="button" className="shrink-0">
                    <Eye className="h-4 w-4 mr-2 text-muted-foreground" /> View Template
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="capitalize">{template.name.replace(/_/g, ' ')}</DialogTitle>
                    <DialogDescription>
                        {template.language} · {template.category}
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 p-4 rounded-xl border border-border bg-[#efeae2] relative overflow-hidden">
                    {/* Simulated Chat Bubble */}
                    <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm text-sm text-gray-800 space-y-3 relative z-10">
                        {header && (
                            <div className="font-bold whitespace-pre-wrap">
                                {header.format === 'TEXT' ? header.text : `[${header.format} Media Container]`}
                            </div>
                        )}
                        
                        {body && (
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {body.text}
                            </div>
                        )}

                        {footer && (
                            <div className="text-xs text-gray-500 pt-1">
                                {footer.text}
                            </div>
                        )}
                    </div>
                    {/* Simulated Buttons */}
                    {buttons?.buttons && buttons.buttons.length > 0 && (
                        <div className="mt-2 space-y-1 relative z-10">
                            {buttons.buttons.map((btn: any, idx: number) => (
                                <div key={idx} className="bg-white text-[#00a884] font-medium text-center py-2.5 rounded-lg shadow-sm text-sm border-t border-gray-100 flex items-center justify-center gap-2">
                                    {btn.type === 'URL' && <span className="opacity-70 text-xs text-gray-400">🔗</span>}
                                    {btn.type === 'PHONE_NUMBER' && <span className="opacity-70 text-xs text-gray-400">📞</span>}
                                    {btn.text}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
