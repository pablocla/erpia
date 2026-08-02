"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NewsFeed } from "@/components/claver/noticias/news-feed"
import { Globe, TrendingUp, MonitorSmartphone, DollarSign } from "lucide-react"

export default function NoticiasPage() {
  const [activeTab, setActiveTab] = useState("tecnologia")

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            Claver News & Markets
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Mantente informado con las últimas noticias de tecnología, finanzas y oportunidades de mercado.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Tabs defaultValue="tecnologia" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[600px] h-auto p-1 bg-muted/50">
            <TabsTrigger value="tecnologia" className="py-2.5">
              <MonitorSmartphone className="w-4 h-4 mr-2" />
              Tecnología
            </TabsTrigger>
            <TabsTrigger value="finanzas" className="py-2.5">
              <TrendingUp className="w-4 h-4 mr-2" />
              Finanzas
            </TabsTrigger>
            <TabsTrigger value="penny_stocks" className="py-2.5">
              <DollarSign className="w-4 h-4 mr-2" />
              Penny Stocks
            </TabsTrigger>
            <TabsTrigger value="general" className="py-2.5">
              <Globe className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="tecnologia" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <NewsFeed category="tecnologia" />
            </TabsContent>
            
            <TabsContent value="finanzas" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <NewsFeed category="finanzas" />
            </TabsContent>
            
            <TabsContent value="penny_stocks" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <NewsFeed category="penny_stocks" />
            </TabsContent>
            
            <TabsContent value="general" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <NewsFeed category="general" />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
