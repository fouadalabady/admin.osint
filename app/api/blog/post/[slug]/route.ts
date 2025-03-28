import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/options'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    // Get auth session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      console.log("Unauthorized: No session found")
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log("User authenticated:", session.user.email)
    
    // Check user role
    const userRole = session.user.role
    console.log("User role:", userRole)
    
    if (!['admin', 'editor', 'author', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // Fetch the post by slug
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (error) {
      console.error('Error fetching post:', error)
      return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  try {
    // Get auth session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check user role
    const userRole = session.user.role
    
    if (!['admin', 'editor', 'author', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Initialize Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      )
    }

    // First get the post by slug to get its ID
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (fetchError) {
      console.error('Error fetching post:', fetchError)
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Update the post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .update({
        title: body.title,
        slug: body.slug,
        content: body.content,
        seo_description: body.seo_description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPost.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating post:', error)
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 