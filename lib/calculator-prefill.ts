import type { Application } from "@/hooks/use-applications"

export interface CalculatorPrefill {
    productType: Application["product_type"]
    application: Application
}
