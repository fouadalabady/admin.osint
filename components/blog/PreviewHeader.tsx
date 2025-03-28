'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, X } from 'lucide-react'

interface PreviewHeaderProps {
  slug: string
  mode?: 'light' | 'dark'
}

export default function PreviewHeader({ slug, mode = 'light' }: PreviewHeaderProps) {
  const handleClose = () => {
    if (window.opener) {
      window.close()
    } else {
      window.history.back()
    }
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-2 border-b ${mode === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleClose}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back</span>
          </Button>
          <div className={`text-sm py-1 px-2 rounded ${mode === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
            Preview Mode
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href={`/dashboard/blog/edit/${slug}`} passHref>
            <Button variant="outline" size="sm" className="flex items-center">
              <Edit className="h-4 w-4 mr-1" />
              <span>Edit</span>
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 