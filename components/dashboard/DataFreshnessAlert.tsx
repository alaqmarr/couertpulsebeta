import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Clock } from "lucide-react"

export function DataFreshnessAlert() {
  return (
    <Alert className="border border-primary/10 bg-card/70 backdrop-blur-sm">
      <Clock className="h-4 w-4" />
      <AlertTitle>Data Freshness</AlertTitle>
      <AlertDescription>
        This page is cached for performance. The data is automatically 
        refreshed once every 24 hours.
      </AlertDescription>
    </Alert>
  )
}