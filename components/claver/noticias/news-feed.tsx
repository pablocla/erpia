"use client"

import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { NewsCard, NewsArticle } from "./news-card"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"

interface NewsResponse {
  category: string
  status: string
  totalResults: number
  articles: NewsArticle[]
}

interface NewsFeedProps {
  category: string
}

export function NewsFeed({ category }: NewsFeedProps) {
  // useAuthFetch already handles adding the auth token and JSON parsing
  const { data, error, isLoading, mutate } = useAuthFetch<NewsResponse>(
    `/api/noticias?category=${category}`
  )

  if (error) {
    return (
      <Alert variant="destructive" className="my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <p>No se pudo cargar el feed de noticias. Por favor, intenta nuevamente más tarde.</p>
          <Button variant="outline" size="sm" onClick={() => mutate()} className="w-fit">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="animate-pulse">Buscando las últimas noticias...</p>
      </div>
    )
  }

  const articles = data.articles || []

  if (articles.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground border border-dashed rounded-xl mt-4">
        <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>No se encontraron noticias para esta categoría en este momento.</p>
      </div>
    )
  }

  const [featuredArticle, ...restArticles] = articles

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <div className="space-y-8 mt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold capitalize flex items-center gap-2">
          {category.replace('_', ' ')}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => mutate()} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Noticia Destacada (Hero) */}
        {featuredArticle && (
          <motion.div variants={itemVariants}>
            <NewsCard article={featuredArticle} isFeatured={true} />
          </motion.div>
        )}

        {/* Grilla de Noticias Secundarias */}
        {restArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restArticles.map((article) => (
              <motion.div key={article.id} variants={itemVariants}>
                <NewsCard article={article} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

// Just importing Newspaper here since it's used in the empty state
import { Newspaper } from "lucide-react"
