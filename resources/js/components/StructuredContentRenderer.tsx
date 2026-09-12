import React, { useMemo } from 'react';
import { Check, Copy, FileText, ChevronRight, Hash } from 'lucide-react';

interface StructuredContentRendererProps {
    content: string;
    onCopyCode?: (code: string, id: number) => void;
    copiedCodeId?: number | null;
}

interface TableData {
    headers: string[];
    rows: string[][];
}

// Helper to format inline elements: **bold**, *italic*, `code`, [link](url)
export function renderInline(text: string): React.ReactNode {
    if (!text) return null;

    // Pattern to catch code, bold, italic, and links
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
        // Check for inline code `...`
        const codeMatch = remaining.match(/^`([^`]+)`/);
        if (codeMatch) {
            tokens.push(
                <code
                    key={keyIdx++}
                    className="px-1.5 py-0.5 mx-0.5 text-[12.5px] font-mono rounded-md bg-neutral-100 dark:bg-white/10 text-[#635bff] dark:text-[#a5b4fc] border border-neutral-200/60 dark:border-white/5"
                >
                    {codeMatch[1]}
                </code>
            );
            remaining = remaining.slice(codeMatch[0].length);
            continue;
        }

        // Check for bold **...** or __...__
        const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
        if (boldMatch) {
            tokens.push(
                <strong key={keyIdx++} className="font-semibold text-neutral-900 dark:text-white">
                    {renderInline(boldMatch[2])}
                </strong>
            );
            remaining = remaining.slice(boldMatch[0].length);
            continue;
        }

        // Check for italic *...* or _..._
        const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
        if (italicMatch && !boldMatch) {
            tokens.push(
                <em key={keyIdx++} className="italic text-neutral-800 dark:text-neutral-200">
                    {renderInline(italicMatch[2])}
                </em>
            );
            remaining = remaining.slice(italicMatch[0].length);
            continue;
        }

        // Check for link [text](url)
        const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
            tokens.push(
                <a
                    key={keyIdx++}
                    href={linkMatch[2]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#635bff] dark:text-[#9bb1ff] hover:underline font-medium inline-flex items-center gap-0.5"
                >
                    {linkMatch[1]}
                </a>
            );
            remaining = remaining.slice(linkMatch[0].length);
            continue;
        }

        // Normal text up to next special char
        const nextSpecial = remaining.search(/[`*_\[]/);
        if (nextSpecial === -1) {
            tokens.push(remaining);
            break;
        } else if (nextSpecial === 0) {
            // Escaped or unmatched special character
            tokens.push(remaining[0]);
            remaining = remaining.slice(1);
        } else {
            tokens.push(remaining.slice(0, nextSpecial));
            remaining = remaining.slice(nextSpecial);
        }
    }

    return <>{tokens}</>;
}

export const StructuredContentRenderer: React.FC<StructuredContentRendererProps> = ({
    content,
    onCopyCode,
    copiedCodeId,
}) => {
    // Parse the entire content into structured semantic blocks
    const parsedBlocks = useMemo(() => {
        if (!content) return [];

        const blocks: Array<{
            type: 'code' | 'table' | 'heading' | 'hr' | 'quote' | 'list' | 'key_value' | 'paragraph';
            level?: number;
            lang?: string;
            code?: string;
            table?: TableData;
            items?: string[];
            ordered?: boolean;
            keyName?: string;
            valText?: string;
            text?: string;
        }> = [];

        // First, split content safely by fenced code blocks
        const codeSplit = content.split(/(```[\s\S]*?```)/g);

        for (const segment of codeSplit) {
            if (segment.startsWith('```')) {
                const match = segment.match(/^```(\w+)?\n([\s\S]*?)```$/);
                const lang = match ? match[1] || 'text' : 'text';
                const code = match ? match[2] : segment.slice(3, -3);
                blocks.push({ type: 'code', lang, code });
                continue;
            }

            // Inside normal text segments, process lines
            const lines = segment.split(/\r?\n/);
            let i = 0;

            while (i < lines.length) {
                const line = lines[i];
                const trimmed = line.trim();

                // 1. Skip empty lines
                if (!trimmed) {
                    i++;
                    continue;
                }

                // 2. Horizontal Rules: ---, ***, ___
                if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
                    blocks.push({ type: 'hr' });
                    i++;
                    continue;
                }

                // 3. Headings: #, ##, ###, ####, #####
                const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
                if (headingMatch) {
                    const level = headingMatch[1].length;
                    const headingText = headingMatch[2].trim();
                    blocks.push({ type: 'heading', level, text: headingText });
                    i++;
                    continue;
                }

                // 4. Markdown Table: starts with | and next line has |---|
                if (trimmed.startsWith('|') && i + 1 < lines.length) {
                    const nextTrimmed = lines[i + 1].trim();
                    if (nextTrimmed.startsWith('|') && /\|[\s:-]+\|/.test(nextTrimmed)) {
                        // We found a table!
                        const parseTableRow = (rowStr: string) => {
                            return rowStr
                                .replace(/^\|/, '')
                                .replace(/\|$/, '')
                                .split('|')
                                .map((c) => c.trim());
                        };

                        const headers = parseTableRow(trimmed);
                        i += 2; // skip header and delimiter row

                        const rows: string[][] = [];
                        while (i < lines.length && lines[i].trim().startsWith('|')) {
                            const rText = lines[i].trim();
                            if (!/\|[\s:-]+\|/.test(rText)) {
                                rows.push(parseTableRow(rText));
                            }
                            i++;
                        }

                        blocks.push({
                            type: 'table',
                            table: { headers, rows },
                        });
                        continue;
                    }
                }

                // 5. Blockquote: > ...
                if (trimmed.startsWith('>')) {
                    const quoteLines: string[] = [];
                    while (i < lines.length && lines[i].trim().startsWith('>')) {
                        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
                        i++;
                    }
                    blocks.push({ type: 'quote', text: quoteLines.join(' ') });
                    continue;
                }

                // 6. Lists (Unordered: - , * ) or (Ordered: 1. , 2. )
                const unorderedMatch = trimmed.match(/^[-*•]\s+(.*)$/);
                const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

                if (unorderedMatch || orderedMatch) {
                    const isOrdered = Boolean(orderedMatch);
                    const listItems: string[] = [];

                    while (i < lines.length) {
                        const curTrim = lines[i].trim();
                        if (isOrdered) {
                            const m = curTrim.match(/^(\d+)\.\s+(.*)$/);
                            if (!m) break;
                            listItems.push(m[2]);
                        } else {
                            const m = curTrim.match(/^[-*•]\s+(.*)$/);
                            if (!m) break;
                            listItems.push(m[1]);
                        }
                        i++;
                    }

                    blocks.push({
                        type: 'list',
                        ordered: isOrdered,
                        items: listItems,
                    });
                    continue;
                }

                // 7. Key-Value Row Detection: e.g. **Subject:** Global Macro... or **Key:** Value
                const kvMatch = trimmed.match(/^\*\*([A-Za-z0-9\s_-]+):\*\*\s*(.*)$/);
                if (kvMatch) {
                    blocks.push({
                        type: 'key_value',
                        keyName: kvMatch[1].trim(),
                        valText: kvMatch[2].trim(),
                    });
                    i++;
                    continue;
                }

                // 8. Normal Paragraph text: Accumulate non-empty, non-special lines
                const paraLines: string[] = [trimmed];
                i++;
                while (
                    i < lines.length &&
                    lines[i].trim() &&
                    !lines[i].trim().startsWith('#') &&
                    !lines[i].trim().startsWith('|') &&
                    !lines[i].trim().startsWith('>') &&
                    !lines[i].trim().startsWith('- ') &&
                    !lines[i].trim().startsWith('* ') &&
                    !lines[i].trim().match(/^\d+\.\s/) &&
                    !/^(\-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
                ) {
                    paraLines.push(lines[i].trim());
                    i++;
                }

                blocks.push({
                    type: 'paragraph',
                    text: paraLines.join('\n'),
                });
            }
        }

        return blocks;
    }, [content]);

    return (
        <div className="space-y-4 text-[14.5px] leading-relaxed text-neutral-800 dark:text-neutral-200 font-sans">
            {parsedBlocks.map((block, idx) => {
                // CODE BLOCK
                if (block.type === 'code') {
                    const code = block.code || '';
                    const lang = block.lang || 'text';
                    const isCopied = copiedCodeId === idx + 5000;

                    return (
                        <div
                            key={idx}
                            className="my-4 rounded-xl overflow-hidden border border-neutral-200 dark:border-white/[0.08] bg-[#f8f9fa] dark:bg-[#151518] shadow-xs"
                        >
                            <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-[#1a1a20] border-b border-neutral-200 dark:border-white/[0.06] text-xs text-neutral-600 dark:text-neutral-400">
                                <span className="font-mono font-medium text-[11px] uppercase tracking-wider">{lang}</span>
                                {onCopyCode && (
                                    <button
                                        onClick={() => onCopyCode(code, idx + 5000)}
                                        className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors text-[11px] cursor-pointer"
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-emerald-500 font-medium">Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" />
                                                <span>Copy code</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <pre className="p-4 text-xs font-mono text-neutral-800 dark:text-neutral-200 overflow-x-auto leading-relaxed">
                                <code>{code}</code>
                            </pre>
                        </div>
                    );
                }

                // ELEGANT RESPONSIVE TABLE
                if (block.type === 'table' && block.table) {
                    const { headers, rows } = block.table;
                    return (
                        <div
                            key={idx}
                            className="my-5 overflow-hidden rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-[#121216] shadow-2xs"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-50 dark:bg-white/[0.04] border-b border-neutral-200 dark:border-white/[0.08]">
                                            {headers.map((head, hIdx) => (
                                                <th
                                                    key={hIdx}
                                                    className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100 tracking-wider text-[11.5px] uppercase font-mono"
                                                >
                                                    {renderInline(head)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
                                        {rows.map((row, rIdx) => (
                                            <tr
                                                key={rIdx}
                                                className="hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
                                            >
                                                {row.map((cell, cIdx) => (
                                                    <td
                                                        key={cIdx}
                                                        className="px-4 py-3 text-neutral-700 dark:text-neutral-300 font-normal leading-normal whitespace-nowrap sm:whitespace-normal"
                                                    >
                                                        {renderInline(cell)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                }

                // TYPOGRAPHY HEADINGS (Zero raw # symbols)
                if (block.type === 'heading') {
                    const level = block.level || 2;
                    if (level === 1) {
                        return (
                            <h1
                                key={idx}
                                className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white pt-3 pb-1 border-b border-neutral-100 dark:border-white/[0.05]"
                            >
                                {renderInline(block.text || '')}
                            </h1>
                        );
                    }
                    if (level === 2) {
                        return (
                            <h2
                                key={idx}
                                className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white pt-3 pb-0.5 flex items-center gap-1.5"
                            >
                                {renderInline(block.text || '')}
                            </h2>
                        );
                    }
                    if (level === 3) {
                        return (
                            <h3
                                key={idx}
                                className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 pt-2 pb-0.5"
                            >
                                {renderInline(block.text || '')}
                            </h3>
                        );
                    }
                    return (
                        <h4
                            key={idx}
                            className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 pt-2"
                        >
                            {renderInline(block.text || '')}
                        </h4>
                    );
                }

                // HORIZONTAL DIVIDER
                if (block.type === 'hr') {
                    return (
                        <hr
                            key={idx}
                            className="my-5 border-t border-neutral-200/70 dark:border-white/[0.08]"
                        />
                    );
                }

                // BLOCKQUOTE / CALLOUT
                if (block.type === 'quote') {
                    return (
                        <blockquote
                            key={idx}
                            className="my-3 pl-4 py-2 border-l-2 border-[#635bff] dark:border-[#788bff] bg-[#635bff]/[0.03] dark:bg-[#635bff]/[0.05] rounded-r-lg text-neutral-700 dark:text-neutral-300 italic text-[13.5px]"
                        >
                            {renderInline(block.text || '')}
                        </blockquote>
                    );
                }

                // LISTS (Unordered and Ordered)
                if (block.type === 'list' && block.items) {
                    if (block.ordered) {
                        return (
                            <ol key={idx} className="my-2 space-y-1.5 list-decimal list-outside pl-5 text-neutral-800 dark:text-neutral-200">
                                {block.items.map((item, lIdx) => (
                                    <li key={lIdx} className="leading-relaxed pl-1">
                                        {renderInline(item)}
                                    </li>
                                ))}
                            </ol>
                        );
                    }
                    return (
                        <ul key={idx} className="my-2 space-y-1.5 text-neutral-800 dark:text-neutral-200">
                            {block.items.map((item, lIdx) => (
                                <li key={lIdx} className="flex items-start gap-2 leading-relaxed">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#635bff] dark:bg-[#788bff] flex-shrink-0 mt-2" />
                                    <span className="flex-1">{renderInline(item)}</span>
                                </li>
                            ))}
                        </ul>
                    );
                }

                // KEY-VALUE METADATA ROW (e.g. Subject: ...)
                if (block.type === 'key_value') {
                    return (
                        <div
                            key={idx}
                            className="my-2 px-3.5 py-2 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/60 dark:border-white/[0.05] flex items-baseline gap-2 text-xs"
                        >
                            <span className="font-semibold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px] font-mono">
                                {block.keyName}:
                            </span>
                            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                                {renderInline(block.valText || '')}
                            </span>
                        </div>
                    );
                }

                // NORMAL PARAGRAPH
                return (
                    <div
                        key={idx}
                        className="whitespace-pre-wrap leading-relaxed text-neutral-800 dark:text-neutral-200 font-normal"
                    >
                        {renderInline(block.text || '')}
                    </div>
                );
            })}
        </div>
    );
};
