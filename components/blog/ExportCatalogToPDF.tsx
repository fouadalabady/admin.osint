import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpenText, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { useToast } from '@/components/ui/use-toast';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
});

Font.register({
  family: 'Roboto-Bold',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
});

Font.register({
  family: 'Roboto-Italic',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf',
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #CCCCCC',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
    backgroundColor: '#F3F4F6',
    fontFamily: 'Roboto-Bold',
    fontSize: 12,
    padding: 8,
  },
  postItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    borderBottomStyle: 'solid',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  indexColumn: {
    width: '8%',
    fontSize: 12,
  },
  titleColumn: {
    width: '36%',
    fontSize: 12,
  },
  infoColumn: {
    width: '18%',
    fontSize: 10,
  },
  tagsColumn: {
    width: '20%',
    fontSize: 10,
  },
  excerptColumn: {
    width: '36%',
    fontSize: 10,
    fontFamily: 'Roboto-Italic',
    color: '#666666',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 10,
    color: '#666666',
  },
  categoryBadge: {
    fontSize: 10,
    color: '#0369A1',
  },
  tagText: {
    fontSize: 10,
    color: '#4B5563',
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
  postIndex: {
    fontSize: 12,
  },
  postTitle: {
    fontSize: 12,
    fontFamily: 'Roboto-Bold',
  },
  metadata: {
    fontSize: 10,
    color: '#666666',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // For alternating row colors
  evenRow: {
    backgroundColor: '#F9FAFB',
  },
});

// Format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Truncate text with ellipsis
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// PDF Document Component
const CatalogDocument = ({ posts }: { posts: any[] }) => {
  // Sort posts by date (newest first)
  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = a.publishedAt || a.createdAt;
    const dateB = b.publishedAt || b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.coverTitle}>OSINT Blog Catalog</Text>
          <Text style={styles.coverSubtitle}>
            A Complete Index of {sortedPosts.length} Blog Posts
          </Text>
          <Text style={styles.coverDate}>
            Generated on {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </Page>

      {/* Catalog Pages */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Blog Posts Catalog</Text>
          <Text style={styles.subtitle}>
            Total of {sortedPosts.length} posts - Listed by date (newest first)
          </Text>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.indexColumn}>#</Text>
          <Text style={styles.titleColumn}>Title</Text>
          <Text style={styles.infoColumn}>Category</Text>
          <Text style={styles.infoColumn}>Date</Text>
          <Text style={styles.tagsColumn}>Tags</Text>
        </View>

        {/* Table Content */}
        {sortedPosts.map((post, index) => (
          <View 
            key={index} 
            style={[
              styles.postItem,
              index % 2 === 1 ? styles.evenRow : {}
            ]}
          >
            <Text style={styles.indexColumn}>{index + 1}</Text>
            <View style={styles.titleColumn}>
              <Text style={styles.postTitle}>
                {truncateText(post.title, 40)}
              </Text>
              {post.excerpt && (
                <Text style={styles.excerptColumn}>
                  {truncateText(post.excerpt, 60)}
                </Text>
              )}
            </View>
            <Text style={styles.infoColumn}>
              {post.category ? post.category.name : '-'}
            </Text>
            <Text style={styles.infoColumn}>
              {formatDate(post.publishedAt || post.createdAt)}
            </Text>
            <Text style={styles.tagsColumn}>
              {post.tags && post.tags.length > 0
                ? post.tags.map(tag => tag.name).join(', ')
                : '-'}
            </Text>
          </View>
        ))}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )}
        />
      </Page>
    </Document>
  );
};

interface ExportCatalogToPDFProps {
  posts: any[];
  buttonSize?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showIcon?: boolean;
  className?: string;
}

export default function ExportCatalogToPDF({
  posts,
  buttonSize = 'default',
  variant = 'outline',
  showIcon = true,
  className = '',
}: ExportCatalogToPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [debug, setDebug] = useState<string | null>(null);
  const { toast } = useToast();

  const exportToPDF = async () => {
    if (!posts || posts.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setDebug(null);
    
    try {
      console.log(`Starting catalog PDF generation for ${posts.length} posts`);
      
      // Basic validation
      if (!Array.isArray(posts)) {
        throw new Error("Posts data is not an array");
      }
      
      // Validate post data
      const postsWithTitles = posts.filter(post => post.title);
      if (postsWithTitles.length !== posts.length) {
        console.warn(`${posts.length - postsWithTitles.length} posts are missing titles`);
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[^\d]/g, '').substring(0, 14);
      const filename = `osint_blog_catalog_${timestamp}.pdf`;
      
      console.log("Rendering catalog PDF component...");
      setDebug("Rendering catalog component...");

      // Create PDF blob
      const blob = await pdf(
        <CatalogDocument posts={postsWithTitles} />
      ).toBlob();
      
      console.log("Catalog PDF blob created, size:", blob.size);
      setDebug("PDF blob created, preparing to download...");

      // Save the file
      saveAs(blob, filename);
      
      console.log("Catalog PDF saved as:", filename);

      toast({
        title: 'Catalog PDF Generated',
        description: `A catalog of ${postsWithTitles.length} blog posts has been exported`,
      });
    } catch (error) {
      console.error('Error generating catalog PDF:', error);
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
        title: 'Error Generating Catalog',
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
            Creating Catalog...
          </>
        ) : (
          <>
            {showIcon && <BookOpenText className="mr-2 h-4 w-4" />}
            Export Catalog
          </>
        )}
      </Button>
      
      {debug && (
        <div className="fixed bottom-4 left-4 max-w-xs p-4 bg-black text-white rounded-md text-xs opacity-75 z-50">
          Debug: {debug}
        </div>
      )}
    </>
  );
} 