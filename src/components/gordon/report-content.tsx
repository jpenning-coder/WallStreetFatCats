import { Fragment, type ReactNode } from "react";

/**
 * A deliberately small, text-only Markdown presentation layer. React escapes all
 * text. No raw HTML, remote images, executable links, or Markdown plugins run.
 * Unsupported syntax remains readable text; the original is also available below.
 */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function cells(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  const columns = cells(line);
  return line.includes("|") && columns.length > 1 && columns.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function ReportContent({ report }: { report: string }) {
  const lines = report.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const key = index;
    if (!line.trim()) { index++; continue; }

    if (/^\s*```/.test(line)) {
      const content: string[] = [];
      index++;
      while (index < lines.length && !/^\s*```/.test(lines[index])) content.push(lines[index++]);
      if (index < lines.length) index++;
      blocks.push(<pre key={key}><code>{content.join("\n")}</code></pre>);
      continue;
    }

    if (index + 1 < lines.length && line.includes("|") && isTableDivider(lines[index + 1])) {
      const headings = cells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
        rows.push(cells(lines[index++]));
      }
      // Don't discard a value from an irregular table. Fall back to readable text.
      if (rows.some((row) => row.length !== headings.length)) {
        blocks.push(<pre key={key}>{lines.slice(key, index).join("\n")}</pre>);
      } else {
        blocks.push(
          <div className="gordon-table-scroll" key={key} role="region" aria-label="Report table; scroll horizontally if needed" tabIndex={0}>
            <table>
              <thead><tr>{headings.map((heading, column) => <th scope="col" key={column}>{inline(heading)}</th>)}</tr></thead>
              <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, column) => <td key={column}>{inline(cell)}</td>)}</tr>)}</tbody>
            </table>
          </div>,
        );
      }
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      // The page owns h1 and report title h2; upstream headings start at h3.
      blocks.push(heading[1].length <= 2
        ? <h3 key={key}>{inline(heading[2])}</h3>
        : <h4 key={key}>{inline(heading[2])}</h4>);
      index++;
      continue;
    }
    if (/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) {
      blocks.push(<hr key={key} />); index++; continue;
    }
    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^\s*>\s?/, ""));
      blocks.push(<blockquote key={key}>{inline(quote.join("\n"))}</blockquote>);
      continue;
    }

    const bullet = line.match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.+)$/);
    if (bullet) {
      const ordered = Boolean(bullet[2]);
      const pattern = ordered ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/;
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const match = lines[index].match(pattern);
        if (!match) break;
        items.push(<li key={index}>{inline(match[1])}</li>);
        index++;
      }
      blocks.push(ordered ? <ol key={key} start={Number(bullet[2])}>{items}</ol> : <ul key={key}>{items}</ul>);
      continue;
    }

    const paragraph: string[] = [line];
    index++;
    while (index < lines.length && lines[index].trim()) {
      if (/^\s*(?:#{1,6}\s|```|>|[-*+]\s|\d+[.)]\s|---+\s*$|\*\*\*+\s*$|___+\s*$)/.test(lines[index])) break;
      if (index + 1 < lines.length && lines[index].includes("|") && isTableDivider(lines[index + 1])) break;
      paragraph.push(lines[index++]);
    }
    blocks.push(<p key={key}>{inline(paragraph.join("\n"))}</p>);
  }

  return <div className="gordon-report-prose">{blocks}</div>;
}
