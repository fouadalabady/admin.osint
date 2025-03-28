import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND
} from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingTagType
} from '@lexical/rich-text'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ImagePlugin } from './ImagePlugin'

const blockTypeToBlockName = {
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  paragraph: 'Normal',
  quote: 'Quote',
}

const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72]

const colors = [
  { name: 'Default', value: 'inherit' },
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#ff0000' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Yellow', value: '#ffff00' },
  { name: 'Purple', value: '#800080' },
  { name: 'Orange', value: '#ffa500' },
]

const highlights = [
  { name: 'None', value: 'inherit' },
  { name: 'Yellow', value: '#ffff00' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Blue', value: '#00ffff' },
  { name: 'Pink', value: '#ff00ff' },
  { name: 'Red', value: '#ff0000' },
]

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph')
  const [fontSize, setFontSize] = useState<number>(16)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [textColor, setTextColor] = useState('inherit')
  const [bgColor, setBgColor] = useState('inherit')

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode()
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElement()
      if (element !== null) {
        const elementKey = element.getKey()
        const elementDOM = editor.getElementByKey(elementKey)
        if (elementDOM !== null) {
          const type = element.getType() as keyof typeof blockTypeToBlockName
          setBlockType(type)
        }
      }
      // Get text format
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
    }
  }, [editor])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar()
        return false
      },
      1
    )
  }, [editor, updateToolbar])

  const formatBlock = (type: keyof typeof blockTypeToBlockName) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        if (type === 'quote') {
          $setBlocksType(selection, () => $createQuoteNode())
        } else if (type !== 'paragraph') {
          $setBlocksType(selection, () => $createHeadingNode(type as HeadingTagType))
        }
      }
    })
  }

  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <Select value={blockType} onValueChange={(value: keyof typeof blockTypeToBlockName) => formatBlock(value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Style" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(blockTypeToBlockName).map(([type, name]) => (
            <SelectItem key={type} value={type}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={fontSize.toString()} onValueChange={(value) => {
        const size = parseInt(value)
        setFontSize(size)
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            selection.getNodes().forEach(node => {
              if (node.getType() === 'text') {
                node.setStyle(`font-size: ${size}px`)
              }
            })
          }
        })
      }}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          {fontSizes.map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}px
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={isBold ? 'default' : 'outline'}
        size="icon"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
        }}
      >
        B
      </Button>

      <Button
        variant={isItalic ? 'default' : 'outline'}
        size="icon"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
        }}
      >
        I
      </Button>

      <Button
        variant={isUnderline ? 'default' : 'outline'}
        size="icon"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
        }}
      >
        U
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" style={{ color: textColor }}>
            A
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="grid grid-cols-4 gap-2">
            {colors.map((color) => (
              <Button
                key={color.value}
                variant="outline"
                size="icon"
                style={{ backgroundColor: color.value }}
                onClick={() => {
                  setTextColor(color.value)
                  editor.update(() => {
                    const selection = $getSelection()
                    if ($isRangeSelection(selection)) {
                      selection.getNodes().forEach(node => {
                        if (node.getType() === 'text') {
                          node.setStyle(`color: ${color.value}`)
                        }
                      })
                    }
                  })
                }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" style={{ backgroundColor: bgColor }}>
            H
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="grid grid-cols-4 gap-2">
            {highlights.map((color) => (
              <Button
                key={color.value}
                variant="outline"
                size="icon"
                style={{ backgroundColor: color.value }}
                onClick={() => {
                  setBgColor(color.value)
                  editor.update(() => {
                    const selection = $getSelection()
                    if ($isRangeSelection(selection)) {
                      selection.getNodes().forEach(node => {
                        if (node.getType() === 'text') {
                          node.setStyle(`background-color: ${color.value}`)
                        }
                      })
                    }
                  })
                }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <ImagePlugin />
    </div>
  )
} 