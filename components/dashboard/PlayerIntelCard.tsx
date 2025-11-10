'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
    Sparkles, 
    ChevronLeft, 
    ChevronRight, 
    Trophy, 
    Zap, 
    Target, 
    Users, 
    Swords, 
    User, 
    Lightbulb,
    type LucideIcon 
} from "lucide-react"

// [NEW] Icon map to look up components from string names
const iconMap: { [key: string]: LucideIcon } = {
    Sparkles,
    Trophy,
    Zap,
    Target,
    Users,
    Swords,
    User,
    Lightbulb,
}

// [CHANGED] The icon prop is now a string
export type PlayerFact = {
    icon: string
    title: string
    text: string
}

export function PlayerIntelCard({ facts }: { facts: PlayerFact[] }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    
    const hasFacts = facts && facts.length > 0
    const fact = hasFacts ? facts[currentIndex] : null
    
    const DefaultIcon = Sparkles
    
    const goToNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % facts.length)
    }

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + facts.length) % facts.length)
    }

    // [CHANGED] Look up the icon component from the map
    const CurrentIcon = (fact && iconMap[fact.icon]) ? iconMap[fact.icon] : DefaultIcon

    return (
        <Card className="flex flex-col bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md border-border/50 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  Player Intel
                </CardTitle>
                <CurrentIcon className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent className="flex-grow">
                {fact ? (
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                            {fact.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{fact.text}</p>
                    </div>
                ) : (
                    // Improved empty state
                    <div className="flex flex-col items-center justify-center text-center py-4">
                      <DefaultIcon className="h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                          Play some games to unlock player intel.
                      </p>
                    </div>
                )}
            </CardContent>
            
            {/* --- Navigation Controls --- */}
            {hasFacts && facts.length > 1 && (
              <div className="flex items-center justify-between p-4 pt-0">
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1} / {facts.length}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={goToPrevious} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous fact</span>
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNext} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next fact</span>
                  </Button>
                </div>
              </div>
            )}
        </Card>
    )
}