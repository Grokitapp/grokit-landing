import type { ReactNode } from 'react';

/**
 * Small, dependency-free Markdown renderer for lesson content.
 *
 * Supports: ## / ### headings, paragraphs, bullet and numbered lists,
 * blockquotes, fenced code blocks, simple tables, **bold**, *italic*,
 * `inline code` and [links](https://...). React escapes all text, and only
 * http(s) links are rendered as links, so model output cannot inject HTML.
 */

type Block =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; text: string }
  | { type: 'table'; header: string[]; rows: string[][] };

const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const TABLE_DIVIDER = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    // Fenced code block
    if (/^\s*```/.test(line)) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^\s*```/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1; // closing fence
      blocks.push({ type: 'code', text: code.join('\n') });
      continue;
    }

    // Headings (# is treated as ## so lessons never get a second page title)
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length >= 3 ? 3 : 2,
        text: heading[2].trim(),
      });
      index += 1;
      continue;
    }

    // Table
    if (line.includes('|') && index + 1 < lines.length && TABLE_DIVIDER.test(lines[index + 1])) {
      const header = splitRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(splitRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    // Lists
    if (BULLET.test(line)) {
      const items: string[] = [];
      while (index < lines.length && BULLET.test(lines[index])) {
        items.push((BULLET.exec(lines[index]) as RegExpExecArray)[1]);
        index += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (NUMBERED.test(line)) {
      const items: string[] = [];
      while (index < lines.length && NUMBERED.test(lines[index])) {
        items.push((NUMBERED.exec(lines[index]) as RegExpExecArray)[1]);
        index += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Blockquote
    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      blocks.push({ type: 'quote', text: quote.join(' ') });
      continue;
    }

    // Paragraph: gather until a blank line or the start of another block
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^\s*```/.test(lines[index]) &&
      !/^#{1,6}\s+/.test(lines[index]) &&
      !BULLET.test(lines[index]) &&
      !NUMBERED.test(lines[index]) &&
      !/^\s*>/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}

/* ---------------------------------------------------------------------------
 * Inline formatting
 * ------------------------------------------------------------------------- */

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\[[^\]]+\]\(https?:\/\/[^\s)]+\))|(\*[^*\s][^*]*\*)/;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let n = 0;

  while (rest) {
    const match = INLINE.exec(rest);

    if (!match) {
      nodes.push(rest);
      break;
    }

    if (match.index > 0) nodes.push(rest.slice(0, match.index));

    const token = match[0];
    const key = `${keyPrefix}-${n}`;
    n += 1;

    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded-md bg-[#263640] px-1.5 py-0.5 text-[0.9em] text-[#FFB27A]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(
        <strong key={key} className="font-extrabold text-white">
          {renderInline(token.slice(2, -2), key)}
        </strong>,
      );
    } else if (token.startsWith('[')) {
      const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(token);
      nodes.push(
        link ? (
          <a
            key={key}
            href={link[2]}
            target="_blank"
            rel="noreferrer noopener"
            className="font-semibold text-orange underline"
          >
            {link[1]}
          </a>
        ) : (
          token
        ),
      );
    } else {
      nodes.push(
        <em key={key} className="italic">
          {renderInline(token.slice(1, -1), key)}
        </em>,
      );
    }

    rest = rest.slice(match.index + token.length);
  }

  return nodes;
}

/* ---------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */

export default function LessonMarkdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);

  return (
    <div className="space-y-5 text-[17px] leading-8 text-[#C8D3DA]">
      {blocks.map((block, i) => {
        const key = `b${i}`;

        switch (block.type) {
          case 'heading':
            return block.level === 2 ? (
              <h2 key={key} className="pt-6 text-2xl font-extrabold text-white">
                {renderInline(block.text, key)}
              </h2>
            ) : (
              <h3 key={key} className="pt-3 text-xl font-extrabold text-white">
                {renderInline(block.text, key)}
              </h3>
            );

          case 'paragraph':
            return <p key={key}>{renderInline(block.text, key)}</p>;

          case 'ul':
            return (
              <ul key={key} className="list-disc space-y-2 pl-6 marker:text-orange">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol
                key={key}
                className="list-decimal space-y-2 pl-6 marker:font-bold marker:text-orange"
              >
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ol>
            );

          case 'quote':
            return (
              <blockquote
                key={key}
                className="border-l-4 border-orange/60 pl-4 text-[#9FB0BB]"
              >
                {renderInline(block.text, key)}
              </blockquote>
            );

          case 'code':
            return (
              <pre
                key={key}
                className="overflow-x-auto rounded-2xl border border-[#2C3E4A] bg-[#0F1A1F] p-4 text-sm leading-6 text-[#D8E0E4]"
              >
                <code>{block.text}</code>
              </pre>
            );

          case 'table':
            return (
              <div key={key} className="overflow-x-auto rounded-2xl border border-[#2C3E4A]">
                <table className="w-full border-collapse text-left text-[15px]">
                  <thead>
                    <tr>
                      {block.header.map((cell, j) => (
                        <th
                          key={`${key}-h${j}`}
                          className="border-b border-[#2C3E4A] bg-[#1D2A33] px-4 py-2.5 font-extrabold text-white"
                        >
                          {renderInline(cell, `${key}-h${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={`${key}-r${r}`}>
                        {row.map((cell, c) => (
                          <td
                            key={`${key}-r${r}c${c}`}
                            className="border-b border-[#223039] px-4 py-2.5"
                          >
                            {renderInline(cell, `${key}-r${r}c${c}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}