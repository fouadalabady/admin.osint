import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilesIcon, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { useToast } from '@/components/ui/use-toast';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { convert } from 'html-to-text';

// Register fonts
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
});

Font.register({
  family: 'Roboto-Bold',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '1px solid #CCCCCC',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  metadata: {
    fontSize: 10,
    color: '#888888',
    marginBottom: 4,
  },
  content: {
    fontSize: 12,
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  categoryBadge: {
    fontSize: 10,
    backgroundColor: '#E0F2FE',
    padding: '3 6',
    color: '#0369A1',
    borderRadius: 4,
    display: 'inline-block',
    marginBottom: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 10,
    color: '#666666',
  },
  postBreak: {
    borderTop: '1px dashed #CCCCCC',
    marginTop: 30,
    marginBottom: 30,
  },
  toc: {
    marginBottom: 20,
  },
  tocTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    marginBottom: 10,
  },
  tocItem: {
    fontSize: 12,
    marginBottom: 5,
  },
  tocPage: {
    fontSize: 10,
    color: '#666666',
  },
  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverTitle: {
    fontSize: 30,
    fontFamily: 'Roboto-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
    color: '#666666',
  },
  coverDate: {
    fontSize: 14,
    color: '#888888',
    marginTop: 40,
  },
});

// Convert HTML to plain text for PDF
const htmlToPlainText = (html: string) => {
  return convert(html, {
    wordwrap: 130,
    preserveNewlines: true,
    selectors: [
      { selector: 'img', format: 'skip' },
      { selector: 'a', format: 'inline' },
      { selector: 'h1', format: 'heading', options: { uppercase: false } },
      { selector: 'h2', format: 'heading', options: { uppercase: false } },
      { selector: 'h3', format: 'heading', options: { uppercase: false } },
    ],
  });
};

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Fix image handling in the BlogPostsDocument component
// Filter out invalid image URLs and add proper checks
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith('http') || url.startsWith('https') || url.startsWith('data:');
};

// PDF Document Component
const BlogPostsDocument = ({ posts }: { posts: any[] }) => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.coverPage}>
        <Text style={styles.coverTitle}>OSINT Blog Posts Collection</Text>
        <Text style={styles.coverSubtitle}>{posts.length} Blog Posts Compilation</Text>
        <Text style={styles.coverDate}>Generated on {formatDate(new Date().toISOString())}</Text>
      </View>
    </Page>
    
    {/* Table of Contents */}
    <Page size="A4" style={styles.page}>
      <View style={styles.toc}>
        <Text style={styles.tocTitle}>Table of Contents</Text>
        {posts.map((post, index) => (
          <View key={index} style={styles.tocItem}>
            <Text>
              {index + 1}. {post.title} 
              <Text style={styles.tocPage}>
                {' '}(page {index + 3})
              </Text>
            </Text>
          </View>
        ))}
      </View>
    </Page>
    
    {/* Post Pages */}
    {posts.map((post, index) => {
      const plainTextContent = post.content ? htmlToPlainText(post.content) : '';
      
      return (
        <Page key={index} size="A4" style={styles.page} wrap>
          <View style={styles.header}>
            <Text style={styles.title}>{post.title}</Text>
            
            {post.author && (
              <Text style={styles.subtitle}>By {post.author.name}</Text>
            )}
            
            <Text style={styles.metadata}>
              {post.publishedAt 
                ? `Published on ${formatDate(post.publishedAt)}`
                : `Created on ${formatDate(post.createdAt)}`}
            </Text>
            
            {post.category && (
              <View style={styles.categoryBadge}>
                <Text>{post.category.name}</Text>
              </View>
            )}
          </View>
          
          {post.excerpt && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontStyle: 'italic', fontSize: 12 }}>
                {post.excerpt}
              </Text>
            </View>
          )}
          
          <View style={styles.content}>
            <Text>{plainTextContent}</Text>
          </View>
          
          <Text 
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => (
              `${pageNumber} / ${totalPages}`
            )} 
          />
        </Page>
      );
    })}
  </Document>
);

interface ExportAllToPDFProps {
  posts: any[];
  buttonSize?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showIcon?: boolean;
  className?: string;
}

export default function ExportAllToPDF({ 
  posts, 
  buttonSize = 'default', 
  variant = 'outline',
  showIcon = true,
  className = ''
}: ExportAllToPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [debug, setDebug] = useState<string | null>(null);
  const { toast } = useToast();

  const exportToPDF = async () => {
    if (!posts || posts.length === 0 || isGenerating) return;
    
    setIsGenerating(true);
    setDebug(null);
    
    try {
      console.log(`Starting bulk PDF generation for ${posts.length} posts`);
      
      // Basic validation
      if (!Array.isArray(posts)) {
        throw new Error("Posts data is not an array");
      }
      
      // Validate post data
      const validPosts = posts.filter(post => post.title && post.content);
      if (validPosts.length !== posts.length) {
        console.warn(`${posts.length - validPosts.length} posts are missing titles or content`);
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[^\d]/g, '').substring(0, 14);
      const filename = `osint_blog_export_${timestamp}.pdf`;
      
      console.log("Rendering bulk PDF component...");
      setDebug("Rendering PDF component...");
      
      // Create PDF blob
      const blob = await pdf(
        <BlogPostsDocument posts={validPosts} />
      ).toBlob();
      
      console.log("Bulk PDF blob created, size:", blob.size);
      setDebug("PDF blob created, preparing to download...");
      
      // Save the file
      saveAs(blob, filename);
      
      console.log("Bulk PDF saved as:", filename);
      
      toast({
        title: 'PDF Generated Successfully',
        description: `${validPosts.length} blog posts have been exported to PDF`,
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
        disabled={isGenerating || posts.length === 0}
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
            {showIcon && <FilesIcon className="mr-2 h-4 w-4" />}
            Export All to PDF ({posts.length})
          </>
        )}
      </Button>
      
      {debug && (
        <div className="fixed bottom-4 right-4 max-w-xs p-4 bg-black text-white rounded-md text-xs opacity-75 z-50">
          Debug: {debug}
        </div>
      )}
    </>
  );
} 