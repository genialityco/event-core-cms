import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useRef, useState, useEffect } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, ImageIcon, Minus,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  uploadPath?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe el contenido aquí...',
  uploadPath = 'useful-info',
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  // Sync external value changes (e.g. when switching between edit/new)
  const prevValueRef = useRef(value)
  useEffect(() => {
    if (editor && value !== prevValueRef.current && value !== editor.getHTML()) {
      editor.commands.setContent(value, false)
    }
    prevValueRef.current = value
  }, [editor, value])

  if (!editor) return null

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const fileName = `${uploadPath}/${Date.now()}_${file.name}`
      const storageRef = ref(storage, fileName)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      editor.chain().focus().setImage({ src: url }).run()
    } catch (err) {
      console.error('Error subiendo imagen:', err)
    } finally {
      setUploading(false)
    }
  }

  const ToolbarBtn = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        padding: '4px 8px',
        border: '1px solid var(--border)',
        borderRadius: 6,
        background: active ? 'var(--accent)' : 'var(--surface)',
        color: active ? '#fff' : 'var(--text-primary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        padding: '8px 10px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
      }}>
        <ToolbarBtn
          title="Negrita"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Cursiva"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={14} />
        </ToolbarBtn>

        <div style={{ width: 1, background: 'var(--border)', margin: '0 2px' }} />

        <ToolbarBtn
          title="Título 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Título 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Título 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={14} />
        </ToolbarBtn>

        <div style={{ width: 1, background: 'var(--border)', margin: '0 2px' }} />

        <ToolbarBtn
          title="Lista con viñetas"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Lista numerada"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          title="Separador"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={14} />
        </ToolbarBtn>

        <div style={{ width: 1, background: 'var(--border)', margin: '0 2px' }} />

        <ToolbarBtn
          title={uploading ? 'Subiendo...' : 'Insertar imagen'}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={14} />
          {uploading && (
            <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
              Subiendo...
            </span>
          )}
        </ToolbarBtn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImageUpload(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        style={{ minHeight: 280, padding: '10px 12px', fontSize: '0.875rem' }}
      />

      <style>{`
        .tiptap { outline: none; }
        .tiptap p { margin: 0 0 8px; line-height: 1.6; }
        .tiptap h1 { font-size: 1.4rem; font-weight: 700; margin: 16px 0 8px; }
        .tiptap h2 { font-size: 1.15rem; font-weight: 700; margin: 12px 0 6px; }
        .tiptap h3 { font-size: 1rem; font-weight: 700; margin: 10px 0 4px; }
        .tiptap ul { padding-left: 20px; margin: 0 0 8px; }
        .tiptap ol { padding-left: 20px; margin: 0 0 8px; }
        .tiptap li { margin-bottom: 2px; line-height: 1.6; }
        .tiptap hr { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
        .tiptap img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
        .tiptap p.is-editor-empty:first-child::before {
          color: var(--text-secondary);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
