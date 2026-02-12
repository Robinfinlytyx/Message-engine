"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionContextType {
    openItems: string[];
    toggleItem: (value: string) => void;
    type: "single" | "multiple";
}

const AccordionContext = React.createContext<AccordionContextType | undefined>(undefined);
const AccordionItemContext = React.createContext<string>("");

interface AccordionProps {
    type?: "single" | "multiple";
    value?: string | string[];
    onValueChange?: (value: string | string[]) => void;
    children: React.ReactNode;
    className?: string;
}

const Accordion = ({ type = "single", value, onValueChange, children, className }: AccordionProps) => {
    const [internalValue, setInternalValue] = React.useState<string[]>(
        Array.isArray(value) ? value : value ? [value] : []
    );

    React.useEffect(() => {
        if (value !== undefined) {
            setInternalValue(Array.isArray(value) ? value : value ? [value] : []);
        }
    }, [value]);

    const toggleItem = (itemValue: string) => {
        let newValue: string[];
        if (type === "single") {
            newValue = internalValue.includes(itemValue) ? [] : [itemValue];
        } else {
            newValue = internalValue.includes(itemValue)
                ? internalValue.filter(v => v !== itemValue)
                : [...internalValue, itemValue];
        }

        setInternalValue(newValue);
        if (onValueChange) {
            onValueChange(type === "single" ? newValue[0] || "" : newValue);
        }
    };

    return (
        <AccordionContext.Provider value={{ openItems: internalValue, toggleItem, type }}>
            <div className={className}>
                {children}
            </div>
        </AccordionContext.Provider>
    );
};

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => (
    <AccordionItemContext.Provider value={value}>
        <div ref={ref} className={cn("border-b", className)} data-value={value} {...props}>
            {children}
        </div>
    </AccordionItemContext.Provider>
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const itemValue = React.useContext(AccordionItemContext);
    const isOpen = context?.openItems.includes(itemValue || "");

    return (
        <div className="flex">
            <button
                ref={ref}
                onClick={() => context?.toggleItem(itemValue || "")}
                className={cn(
                    "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                    className
                )}
                data-state={isOpen ? "open" : "closed"}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </button>
        </div>
    );
});
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const itemValue = React.useContext(AccordionItemContext);
    const isOpen = context?.openItems.includes(itemValue || "");

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "overflow-hidden text-sm transition-all animate-accordion-down",
                className
            )}
            data-state="open"
            {...props}
        >
            <div className="pb-4 pt-0">{children}</div>
        </div>
    );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
