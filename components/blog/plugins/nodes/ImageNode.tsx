import { DecoratorNode, EditorConfig, NodeKey, SerializedLexicalNode } from 'lexical'

export interface ImagePayload {
  src: string
  altText: string
  width?: number
  height?: number
  key?: NodeKey
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string
  __altText: string
  __width: number | undefined
  __height: number | undefined

  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key
    )
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    key?: NodeKey
  ) {
    super(key)
    this.__src = src
    this.__altText = altText
    this.__width = width
    this.__height = height
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div')
    div.className = 'image-wrapper'
    return div
  }

  updateDOM(): false {
    return false
  }

  decorate(): JSX.Element {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        width={this.__width}
        height={this.__height}
        className="max-w-full h-auto rounded-lg"
        draggable="false"
      />
    )
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height
    }
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(serializedNode)
  }
}

export type SerializedImageNode = {
  type: 'image'
  version: 1
  src: string
  altText: string
  width?: number
  height?: number
}

export function $createImageNode({
  src,
  altText,
  width,
  height,
  key
}: ImagePayload): ImageNode {
  return new ImageNode(src, altText, width, height, key)
} 