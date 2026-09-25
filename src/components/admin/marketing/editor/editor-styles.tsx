'use client'

/**
 * 编辑器专用的全局样式（只作用于 .mkt-editor 内部）。
 *
 * - .ProseMirror 的段落/列表样式：Tailwind preflight 把 ul/ol 的列表符号和缩进都去掉了，
 *   不补回来的话编辑框里的列表看起来就是普通段落，作者会以为列表没生效。
 * - 滚动条：全站 globals.css 把滚动条轨道设成黑色（前台是暗色），在浅色编辑器里很突兀，这里覆盖回浅色。
 */
export function EditorStyles() {
  return (
    <style jsx global>{`
      .mkt-editor .mkt-rte-body .ProseMirror {
        outline: none;
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.7;
        min-height: inherit;
      }
      .mkt-editor .mkt-rte-body .ProseMirror p {
        margin: 0;
      }
      .mkt-editor .mkt-rte-body .ProseMirror p + p,
      .mkt-editor .mkt-rte-body .ProseMirror ul + p,
      .mkt-editor .mkt-rte-body .ProseMirror ol + p,
      .mkt-editor .mkt-rte-body .ProseMirror p + ul,
      .mkt-editor .mkt-rte-body .ProseMirror p + ol {
        margin-top: 0.5em;
      }
      .mkt-editor .mkt-rte-body .ProseMirror ul {
        list-style: disc;
        padding-left: 1.4em;
      }
      .mkt-editor .mkt-rte-body .ProseMirror ol {
        list-style: decimal;
        padding-left: 1.6em;
      }
      .mkt-editor .mkt-rte-body .ProseMirror li {
        margin: 0.15em 0;
      }
      .mkt-editor .mkt-rte-body .ProseMirror li > p {
        margin: 0;
      }
      .mkt-editor .mkt-rte-body .ProseMirror a {
        color: #0284c7;
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: text;
      }
      .mkt-editor .mkt-rte-body .ProseMirror strong {
        font-weight: 700;
      }
      .mkt-editor .mkt-rte-body .ProseMirror em {
        font-style: italic;
      }
      .mkt-editor .mkt-rte-body .ProseMirror s {
        text-decoration: line-through;
      }
      .mkt-editor .mkt-rte-body .ProseMirror ::selection {
        background: rgba(14, 165, 233, 0.25);
      }
      .mkt-editor ::selection {
        background: rgba(14, 165, 233, 0.25);
      }

      .mkt-editor ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      .mkt-editor ::-webkit-scrollbar-track {
        background: transparent;
      }
      .mkt-editor ::-webkit-scrollbar-thumb {
        background: rgba(107, 114, 128, 0.35);
        border-radius: 9999px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .mkt-editor ::-webkit-scrollbar-thumb:hover {
        background: rgba(107, 114, 128, 0.55);
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      .mkt-editor {
        scrollbar-color: rgba(107, 114, 128, 0.4) transparent;
      }
    `}</style>
  )
}
