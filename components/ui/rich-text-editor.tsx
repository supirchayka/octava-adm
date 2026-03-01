"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type EditorCommand =
  | "bold"
  | "italic"
  | "underline"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "removeFormat"

type ToolbarItem = {
  command: EditorCommand
  label: string
  title: string
}

const TOOLBAR: ToolbarItem[] = [
  { command: "bold", label: "B", title: "Жирный" },
  { command: "italic", label: "I", title: "Курсив" },
  { command: "underline", label: "U", title: "Подчёркнутый" },
  { command: "insertUnorderedList", label: "• List", title: "Маркированный список" },
  { command: "insertOrderedList", label: "1. List", title: "Нумерованный список" },
  { command: "removeFormat", label: "Clear", title: "Сбросить форматирование" },
]

interface RichTextEditorProps {
  value: string
  onChange: (nextValue: string) => void
  placeholder?: string
  className?: string
  editorClassName?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Введите текст",
  className,
  editorClassName,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (editor.innerHTML !== value) {
      editor.innerHTML = value
    }
    syncEmptyState(editor, setIsEmpty)
  }, [value])

  function emitValue() {
    const editor = editorRef.current
    if (!editor) return
    onChange(editor.innerHTML)
    syncEmptyState(editor, setIsEmpty)
  }

  function executeCommand(command: EditorCommand) {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    document.execCommand(command, false)
    emitValue()
  }

  return (
    <div className={cn("overflow-hidden rounded-md border border-input", className)}>
      <div className="flex flex-wrap gap-1 border-b bg-slate-50/70 p-2">
        {TOOLBAR.map((item) => (
          <button
            key={item.command}
            type="button"
            title={item.title}
            onMouseDown={(event) => {
              event.preventDefault()
              executeCommand(item.command)
            }}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="relative">
        {isEmpty && (
          <div className="pointer-events-none absolute left-3 top-2 text-sm text-slate-400">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          className={cn(
            "min-h-40 w-full px-3 py-2 text-sm leading-6 text-slate-900 outline-none [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
            editorClassName
          )}
          onInput={emitValue}
          onBlur={emitValue}
        />
      </div>
    </div>
  )
}

function syncEmptyState(editor: HTMLDivElement, setIsEmpty: (next: boolean) => void) {
  const text = (editor.textContent ?? "").replace(/\u00a0/g, " ").trim()
  setIsEmpty(text.length === 0)
}
