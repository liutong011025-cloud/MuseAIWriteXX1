import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // 从数据库查询用户
    const user = await prisma.user.findUnique({
      where: { username },
    })
    
    if (user && user.password === password) {
      // 用户存在且密码正确
      return NextResponse.json({
        success: true,
        user: {
          username: user.username,
          role: user.role as 'teacher' | 'student',
          noAi: user.noAi || false, // 标记是否为无AI版本
        },
      })
    }

    // 用户名或密码错误
    return NextResponse.json(
      { success: false, error: 'Invalid username or password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    
    // 提供更详细的错误信息用于调试
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isDatabaseError = errorMessage.includes('Prisma') || errorMessage.includes('database') || errorMessage.includes('connection')
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        hint: isDatabaseError ? 'Database connection issue. Please check DATABASE_URL environment variable.' : undefined
      },
      { status: 500 }
    )
  }
}

