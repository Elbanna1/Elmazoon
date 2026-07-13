"use client";

import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Markdown editor with a live preview.
 *
 * The article body is stored as plain text by the backend (`content` is a
 * string), so the editor cannot emit HTML — it would be rendered verbatim on the
 * public site. Markdown is the right fidelity: it round-trips as text, and
 * `react-markdown` renders it without `dangerouslySetInnerHTML`, so a fatwa body
 * can never become a script injection vector.
 */

interface Wrap {
  icon: typeof Bold;
  label: string;
  before: string;
  after?: string;
  /** Line-leading marker (lists, quotes, headings) rather than a wrap. */
  block?: boolean;
}

const TOOLS: Wrap[] = [
  { icon: Bold, label: "عريض", before: "**", after: "**" },
  { icon: Italic, label: "مائل", before: "_", after: "_" },
  { icon: Heading2, label: "عنوان", before: "## ", block: true },
  { icon: Quote, label: "اقتباس", before: "> ", block: true },
  { icon: List, label: "قائمة نقطية", before: "- ", block: true },
  { icon: ListOrdered, label: "قائمة مرقّمة", before: "1. ", block: true },
  { icon: Code, label: "كود", before: "`", after: "`" },
  { icon: Link2, label: "رابط", before: "[", after: "](https://)" },
];

export function RichEditor({
  value,
  onChange,
  error,
  disabled,
  label = "محتوى الفتوى",
  rows = 16,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState("write");

  const apply = useCallback(
    (tool: Wrap) => {
      const el = ref.current;
      if (!el) return;

      const { selectionStart: start, selectionEnd: end } = el;
      const selected = value.slice(start, end);

      let next: string;
      let cursor: number;

      if (tool.block) {
        // Prefix every selected line, not just the first — otherwise turning
        // three lines into a list only ever converts one of them.
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const block = value.slice(lineStart, end);
        const prefixed = block
          .split("\n")
          .map((line) => (line.startsWith(tool.before) ? line : tool.before + line))
          .join("\n");

        next = value.slice(0, lineStart) + prefixed + value.slice(end);
        cursor = lineStart + prefixed.length;
      } else {
        const after = tool.after ?? "";
        next = value.slice(0, start) + tool.before + selected + after + value.slice(end);
        // Put the caret inside the markers when nothing was selected, so the
        // user can just start typing.
        cursor = selected
          ? start + tool.before.length + selected.length + after.length
          : start + tool.before.length;
      }

      onChange(next);

      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(cursor, cursor);
      });
    },
    [value, onChange],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="article-content">{label}</Label>
        <span className="text-muted-foreground text-xs tabular-nums">
          {value.length.toLocaleString()} حرف
        </span>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-0.5">
            {TOOLS.map((tool) => (
              <Tooltip key={tool.label}>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={disabled || tab === "preview"}
                      onClick={() => apply(tool)}
                      aria-label={tool.label}
                    />
                  }
                >
                  <tool.icon className="size-4" />
                </TooltipTrigger>
                <TooltipContent>{tool.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <TabsList>
            <TabsTrigger value="write">
              <Pencil className="size-3.5" />
              كتابة
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="size-3.5" />
              معاينة
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="mt-2">
          <Textarea
            ref={ref}
            id="article-content"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={rows}
            disabled={disabled}
            placeholder="اكتب نص الفتوى…"
            className={cn("resize-y font-normal leading-relaxed", error && "border-destructive/50")}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "article-content-error" : undefined}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-2">
          <div
            className="min-h-48 rounded-xl border p-4"
            style={{ minHeight: `${rows * 1.6}rem` }}
          >
            {value.trim() ? (
              <MarkdownPreview value={value} />
            ) : (
              <p className="text-muted-foreground text-sm">لا يوجد ما يمكن معاينته بعد.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <p id="article-content-error" role="alert" className="text-destructive text-xs font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

/** Shared by the editor preview and the article detail view. */
export function MarkdownPreview({ value }: { value: string }) {
  return (
    <div
      className={cn(
        "prose-sm max-w-none space-y-4 text-sm leading-relaxed",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        "[&_blockquote]:border-s-2 [&_blockquote]:ps-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs",
        "[&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold",
        "[&_li]:ms-4 [&_ol]:list-decimal [&_ul]:list-disc",
        "[&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_th]:text-start",
      )}
    >
      {/* No rawHtml plugin: article bodies are operator input, and rendering raw
          HTML from them would be a stored-XSS hole on the public site. */}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
    </div>
  );
}
