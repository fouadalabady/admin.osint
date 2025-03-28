"use client"

import React, { useEffect, useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, AlertCircle, Info, X, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface SeoAnalyzerProps {
  title: string
  description: string
  keywords: string
  content: string
  textContent: string // Plain text content without HTML
  slug: string
}

interface SeoCheck {
  id: string
  name: string
  description: string
  status: 'passed' | 'failed' | 'warning' | 'info'
  score: number
  maxScore: number
}

const SeoAnalyzer: React.FC<SeoAnalyzerProps> = ({
  title,
  description,
  keywords,
  content,
  textContent,
  slug
}) => {
  const [seoScore, setSeoScore] = useState(0)
  const [seoChecks, setSeoChecks] = useState<SeoCheck[]>([])
  const [maxPossibleScore, setMaxPossibleScore] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(true)

  useEffect(() => {
    // Short delay to simulate analysis
    const timer = setTimeout(() => {
      analyzeSeo()
      setIsAnalyzing(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [title, description, keywords, content, textContent, slug])

  const analyzeSeo = () => {
    const checks: SeoCheck[] = []
    let totalScore = 0
    let possibleScore = 0

    // Check title length (50-60 chars is ideal)
    const titleLength = title.length
    let titleScore = 10
    let titleStatus: 'passed' | 'failed' | 'warning' | 'info' = 'passed'
    let titleDesc = 'Your title has an optimal length (50-60 characters).'

    if (titleLength === 0) {
      titleScore = 0
      titleStatus = 'failed'
      titleDesc = 'You need to add a title.'
    } else if (titleLength < 20) {
      titleScore = 3
      titleStatus = 'warning'
      titleDesc = 'Your title is too short. Aim for 50-60 characters.'
    } else if (titleLength < 40) {
      titleScore = 7
      titleStatus = 'warning'
      titleDesc = 'Your title could be longer. Aim for 50-60 characters.'
    } else if (titleLength > 70) {
      titleScore = 5
      titleStatus = 'warning'
      titleDesc = 'Your title is too long. Search engines may truncate it. Aim for 50-60 characters.'
    }

    checks.push({
      id: 'title-length',
      name: 'Title Length',
      description: titleDesc,
      status: titleStatus,
      score: titleScore,
      maxScore: 10
    })
    totalScore += titleScore
    possibleScore += 10

    // Check meta description length (150-160 chars is ideal)
    const descLength = description.length
    let descScore = 10
    let descStatus: 'passed' | 'failed' | 'warning' | 'info' = 'passed'
    let descDesc = 'Your meta description has an optimal length (150-160 characters).'

    if (descLength === 0) {
      descScore = 0
      descStatus = 'failed'
      descDesc = 'You need to add a meta description.'
    } else if (descLength < 70) {
      descScore = 3
      descStatus = 'warning'
      descDesc = 'Your meta description is too short. Aim for 150-160 characters.'
    } else if (descLength < 120) {
      descScore = 7
      descStatus = 'warning'
      descDesc = 'Your meta description could be longer. Aim for 150-160 characters.'
    } else if (descLength > 170) {
      descScore = 5
      descStatus = 'warning'
      descDesc = 'Your meta description is too long. Search engines may truncate it. Aim for 150-160 characters.'
    }

    checks.push({
      id: 'meta-desc-length',
      name: 'Meta Description Length',
      description: descDesc,
      status: descStatus,
      score: descScore,
      maxScore: 10
    })
    totalScore += descScore
    possibleScore += 10

    // Check for keywords presence in title
    const keywordsArray = keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0)
    
    const titleLower = title.toLowerCase()
    let keywordsInTitle = 0
    
    keywordsArray.forEach(keyword => {
      if (titleLower.includes(keyword)) {
        keywordsInTitle++
      }
    })
    
    let keywordTitleScore = 0
    let keywordTitleStatus: 'passed' | 'failed' | 'warning' | 'info' = 'failed'
    let keywordTitleDesc = 'None of your keywords appear in the title.'
    
    if (keywordsArray.length === 0) {
      keywordTitleScore = 0
      keywordTitleStatus = 'warning'
      keywordTitleDesc = 'You haven\'t specified any keywords.'
    } else if (keywordsInTitle > 0) {
      if (keywordsInTitle === keywordsArray.length) {
        keywordTitleScore = 10
        keywordTitleStatus = 'passed'
        keywordTitleDesc = 'All of your targeted keywords appear in the title. Great!'
      } else {
        const percentage = Math.round((keywordsInTitle / keywordsArray.length) * 100)
        keywordTitleScore = Math.ceil((keywordsInTitle / keywordsArray.length) * 10)
        keywordTitleStatus = 'warning'
        keywordTitleDesc = `${percentage}% of your keywords appear in the title. Try to include more.`
      }
    }
    
    checks.push({
      id: 'keywords-in-title',
      name: 'Keywords in Title',
      description: keywordTitleDesc,
      status: keywordTitleStatus,
      score: keywordTitleScore,
      maxScore: 10
    })
    totalScore += keywordTitleScore
    possibleScore += 10

    // Check for keyword density in content (2-3% is ideal)
    const wordCount = textContent.split(/\s+/).length
    
    if (wordCount > 0 && keywordsArray.length > 0) {
      let keywordCount = 0
      
      keywordsArray.forEach(keyword => {
        const regex = new RegExp('\\b' + keyword + '\\b', 'gi')
        const matches = textContent.match(regex)
        if (matches) {
          keywordCount += matches.length
        }
      })
      
      const keywordDensity = (keywordCount / wordCount) * 100
      let keywordDensityScore = 10
      let keywordDensityStatus: 'passed' | 'failed' | 'warning' | 'info' = 'passed'
      let keywordDensityDesc = `Your keyword density is optimal at ${keywordDensity.toFixed(1)}%.`
      
      if (keywordDensity === 0) {
        keywordDensityScore = 0
        keywordDensityStatus = 'failed'
        keywordDensityDesc = 'Your keywords don\'t appear in the content at all.'
      } else if (keywordDensity < 1) {
        keywordDensityScore = 5
        keywordDensityStatus = 'warning'
        keywordDensityDesc = `Your keyword density is only ${keywordDensity.toFixed(1)}%. Try to increase it to 2-3%.`
      } else if (keywordDensity > 4) {
        keywordDensityScore = 3
        keywordDensityStatus = 'warning'
        keywordDensityDesc = `Your keyword density is too high at ${keywordDensity.toFixed(1)}%. This might look like keyword stuffing. Aim for 2-3%.`
      }
      
      checks.push({
        id: 'keyword-density',
        name: 'Keyword Density',
        description: keywordDensityDesc,
        status: keywordDensityStatus,
        score: keywordDensityScore,
        maxScore: 10
      })
      totalScore += keywordDensityScore
      possibleScore += 10
    }

    // Check content length (Longer is generally better, >300 words minimum)
    if (wordCount > 0) {
      let contentLengthScore = 0
      let contentLengthStatus: 'passed' | 'failed' | 'warning' | 'info' = 'failed'
      let contentLengthDesc = 'Your content is too short. Aim for at least 300 words.'
      
      if (wordCount >= 1000) {
        contentLengthScore = 10
        contentLengthStatus = 'passed'
        contentLengthDesc = `Great! Your content length (${wordCount} words) is excellent for SEO.`
      } else if (wordCount >= 600) {
        contentLengthScore = 8
        contentLengthStatus = 'passed'
        contentLengthDesc = `Good! Your content length (${wordCount} words) is good for SEO.`
      } else if (wordCount >= 300) {
        contentLengthScore = 6
        contentLengthStatus = 'warning'
        contentLengthDesc = `Your content length (${wordCount} words) meets the minimum, but could be longer.`
      } else {
        contentLengthScore = Math.round((wordCount / 300) * 5)
        contentLengthStatus = 'failed'
        contentLengthDesc = `Your content is too short (${wordCount} words). Aim for at least 300 words.`
      }
      
      checks.push({
        id: 'content-length',
        name: 'Content Length',
        description: contentLengthDesc,
        status: contentLengthStatus,
        score: contentLengthScore,
        maxScore: 10
      })
      totalScore += contentLengthScore
      possibleScore += 10
    }

    // Check for headings (H1, H2, H3)
    const hasH1 = content.includes('<h1') || content.includes('<H1')
    const hasH2 = content.includes('<h2') || content.includes('<H2')
    const hasH3 = content.includes('<h3') || content.includes('<H3')
    
    let headingScore = 0
    let headingStatus: 'passed' | 'failed' | 'warning' | 'info' = 'failed'
    let headingDesc = 'Your content doesn\'t use any headings. Use H1, H2, and H3 tags to structure your content.'
    
    if (hasH1 && hasH2 && hasH3) {
      headingScore = 10
      headingStatus = 'passed'
      headingDesc = 'Great! Your content uses multiple heading levels (H1, H2, and H3) for proper structure.'
    } else if ((hasH1 && hasH2) || (hasH1 && hasH3) || (hasH2 && hasH3)) {
      headingScore = 7
      headingStatus = 'warning'
      headingDesc = 'Your content uses some headings, but could benefit from a more complete structure using H1, H2, and H3 tags.'
    } else if (hasH1 || hasH2 || hasH3) {
      headingScore = 4
      headingStatus = 'warning'
      headingDesc = 'Your content uses only one level of headings. Use a mix of H1, H2, and H3 tags for better structure.'
    }
    
    checks.push({
      id: 'headings',
      name: 'Heading Structure',
      description: headingDesc,
      status: headingStatus,
      score: headingScore,
      maxScore: 10
    })
    totalScore += headingScore
    possibleScore += 10
    
    // Check for slug quality
    const slugWords = slug.split('-').length
    const slugLength = slug.length
    
    let slugScore = 10
    let slugStatus: 'passed' | 'failed' | 'warning' | 'info' = 'passed'
    let slugDesc = 'Your URL slug is optimal for SEO.'
    
    if (slugLength === 0) {
      slugScore = 0
      slugStatus = 'failed'
      slugDesc = 'You need to add a URL slug.'
    } else if (slugLength > 100) {
      slugScore = 3
      slugStatus = 'warning'
      slugDesc = 'Your URL slug is too long. Keep it under 60 characters.'
    } else if (slugLength > 60) {
      slugScore = 7
      slugStatus = 'warning'
      slugDesc = 'Your URL slug is a bit long. Consider shortening it.'
    }
    
    // Check if keywords are in slug
    let keywordsInSlug = false
    const slugLower = slug.toLowerCase()
    
    keywordsArray.forEach(keyword => {
      if (slugLower.includes(keyword.replace(/\s+/g, '-'))) {
        keywordsInSlug = true
      }
    })
    
    if (!keywordsInSlug && keywordsArray.length > 0) {
      slugScore -= 2
      slugDesc += ' Consider including your main keyword in the URL.'
    }
    
    checks.push({
      id: 'slug-quality',
      name: 'URL Slug Quality',
      description: slugDesc,
      status: slugStatus,
      score: Math.max(0, slugScore),
      maxScore: 10
    })
    totalScore += Math.max(0, slugScore)
    possibleScore += 10

    // Calculate final percentage score
    const percentageScore = possibleScore > 0 ? Math.round((totalScore / possibleScore) * 100) : 0
    
    setSeoChecks(checks)
    setSeoScore(percentageScore)
    setMaxPossibleScore(possibleScore)
  }

  // Display an appropriate badge based on the SEO score
  const getScoreBadge = () => {
    if (seoScore >= 90) {
      return <Badge className="bg-green-500 hover:bg-green-600">Excellent</Badge>
    } else if (seoScore >= 70) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Good</Badge>
    } else if (seoScore >= 50) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Needs Improvement</Badge>
    } else {
      return <Badge className="bg-red-500 hover:bg-red-600">Poor</Badge>
    }
  }

  // Get the appropriate icon for each status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <Check className="h-5 w-5 text-green-500" />
      case 'failed':
        return <X className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>SEO Health Score</div>
          {!isAnalyzing && getScoreBadge()}
        </CardTitle>
        <CardDescription>
          Analysis of your post's search engine optimization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAnalyzing ? (
          <div className="space-y-2 text-center py-4">
            <div className="animate-pulse">Analyzing SEO...</div>
            <Progress value={45} className="w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl font-bold">{seoScore}%</div>
              <Progress value={seoScore} className="w-3/4" />
            </div>
            
            <div className="space-y-3 mt-4">
              {seoChecks.map((check) => (
                <div key={check.id} className="flex items-start gap-3 pb-3 border-b">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(check.status)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{check.name}</div>
                    <div className="text-sm text-muted-foreground">{check.description}</div>
                  </div>
                  <div className="flex-shrink-0 font-medium">
                    {check.score}/{check.maxScore}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default SeoAnalyzer 