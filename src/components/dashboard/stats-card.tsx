import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    positive: boolean
  }
}

export function StatsCard({ title, value, icon: Icon, description, trend }: StatsCardProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={`text-xs mt-2 flex items-center ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.positive ? '+' : '-'}{trend.value}% que el mes anterior
          </div>
        )}
      </CardContent>
    </Card>
  )
}