import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { useToast } from '@/components/ui/use-toast';
import BlogPostPDF from './BlogPostPDF';

interface ExportToPDFProps {
  post: any;
  buttonSize?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showIcon?: boolean;
  className?: string;
}

export default function ExportToPDF({ 
  post, 
  buttonSize = 'default', 
  variant = 'outline',
  showIcon = true,
  className = ''
}: ExportToPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [debug, setDebug] = useState<string | null>(null);
  const { toast } = useToast();

  const exportToPDF = async () => {
    if (!post || isGenerating) return;
    
    setIsGenerating(true);
    setDebug(null);
    
    try {
      console.log("Starting PDF generation for post:", post.title);
      
      // Validate post data
      if (!post.title) {
        throw new Error("Post title is missing");
      }
      if (!post.content) {
        console.warn("Post content is empty - will create PDF with empty content");
      }
      
      // Generate a clean filename from the post title
      const filename = post.title
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .replace(/_+/g, '_')
        .substring(0, 50) + '.pdf';
      
      console.log("Rendering PDF component...");
      setDebug("Rendering PDF component...");
      
      // Create PDF blob
      const blob = await pdf(
        <BlogPostPDF post={post} />
      ).toBlob();
      
      console.log("PDF blob created, size:", blob.size);
      setDebug("PDF blob created, preparing to download...");
      
      // Save the file
      saveAs(blob, filename);
      
      console.log("PDF saved as:", filename);
      
      toast({
        title: 'PDF Generated Successfully',
        description: `The blog post has been exported as ${filename}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        setDebug(`Error: ${error.message}`);
      } else {
        console.error('Unknown error type:', error);
        setDebug("Unknown error occurred");
      }
      
      toast({
        title: 'Error Generating PDF',
        description: error instanceof Error 
          ? `Error: ${error.message}. Please check console for details.` 
          : 'There was a problem creating the PDF file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        onClick={exportToPDF}
        disabled={isGenerating}
        variant={variant}
        size={buttonSize}
        className={className}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            {showIcon && <FileDown className="mr-2 h-4 w-4" />}
            Export to PDF
          </>
        )}
      </Button>
      
      {debug && (
        <div className="fixed bottom-4 right-4 max-w-xs p-4 bg-black text-white rounded-md text-xs opacity-75">
          Debug: {debug}
        </div>
      )}
    </>
  );
} 