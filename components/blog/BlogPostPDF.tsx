import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
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
  featuredImage: {
    maxWidth: '100%',
    maxHeight: 300,
    marginBottom: 20,
    objectFit: 'contain',
  },
  tag: {
    fontSize: 10,
    backgroundColor: '#F3F4F6',
    padding: 4,
    marginRight: 5,
    marginBottom: 5,
    borderRadius: 4,
    display: 'inline-block',
  },
  tagContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 20,
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: '1px solid #CCCCCC',
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
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

interface BlogPostPDFProps {
  post: {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    publishedAt?: string;
    createdAt: string;
    author?: {
      name: string;
    };
    category?: {
      name: string;
    };
    tags?: Array<{ name: string }>;
  };
}

const BlogPostPDF: React.FC<BlogPostPDFProps> = ({ post }) => {
  const plainTextContent = post.content ? htmlToPlainText(post.content) : '';
  
  // Check if featuredImage is a valid URL or exists
  const hasValidFeaturedImage = post.featuredImage && 
    (post.featuredImage.startsWith('http') || 
     post.featuredImage.startsWith('https') || 
     post.featuredImage.startsWith('data:'));
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
        
        {hasValidFeaturedImage && (
          <Image
            src={post.featuredImage}
            style={styles.featuredImage}
          />
        )}
        
        {post.excerpt && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontStyle: 'italic', fontSize: 12 }}>
              {post.excerpt}
            </Text>
          </View>
        )}
        
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {post.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text>{tag.name}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.content}>
          <Text>{plainTextContent}</Text>
        </View>
        
        <View style={styles.footer}>
          <Text>
            Generated on {new Date().toLocaleDateString()} | OSINT Dashboard
          </Text>
        </View>
        
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

export default BlogPostPDF; 