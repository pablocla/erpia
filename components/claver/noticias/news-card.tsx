"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { ExternalLink, Calendar, Newspaper } from "lucide-react"

export interface NewsArticle {
  id: string
  title: string
  summary: string
  url: string
  imageUrl?: string
  publishedAt: string
  source: string
}

interface NewsCardProps {
  article: NewsArticle
  isFeatured?: boolean
}

export function NewsCard({ article, isFeatured = false }: NewsCardProps) {
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(article.publishedAt))

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <a 
        href={article.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      >
        <Card className={`h-full overflow-hidden border-border/50 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md flex flex-col ${isFeatured ? 'md:flex-row' : ''}`}>
          {article.imageUrl && (
            <div className={`relative overflow-hidden ${isFeatured ? 'md:w-1/2 aspect-video md:aspect-auto' : 'aspect-video'}`}>
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-2 left-2 flex gap-2">
                {isFeatured && (
                  <Badge variant="default" className="bg-primary/90 hover:bg-primary backdrop-blur-md font-semibold">
                    Último Momento
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          <div className={`flex flex-col flex-grow ${isFeatured ? 'md:w-1/2 justify-center' : ''}`}>
            <CardHeader className={isFeatured ? 'md:p-8' : ''}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1 font-medium text-primary">
                  <Newspaper className="w-3.5 h-3.5" />
                  {article.source}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </span>
              </div>
              <CardTitle className={`${isFeatured ? 'text-2xl md:text-3xl leading-tight' : 'text-lg leading-tight'} line-clamp-3`}>
                {article.title}
              </CardTitle>
            </CardHeader>
            <CardContent className={`flex-grow ${isFeatured ? 'md:px-8' : ''}`}>
              <CardDescription className={`${isFeatured ? 'text-base' : 'text-sm'} line-clamp-3`}>
                {article.summary}
              </CardDescription>
            </CardContent>
            <CardFooter className={`flex justify-end pt-2 ${isFeatured ? 'md:px-8 pb-8' : ''}`}>
              <span className="text-xs font-medium text-primary flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                Leer noticia completa
                <ExternalLink className="w-3 h-3" />
              </span>
            </CardFooter>
          </div>
        </Card>
      </a>
    </motion.div>
  )
}
