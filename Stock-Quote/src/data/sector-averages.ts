


export const sectorAverages = (measure: string, industry: string) => {
    if (industry === "Technology") {
        switch (measure) {
            case "PE":  return { low: 30, high: 50 };
            case "Growth": return { low: 10, high: 20 };
            case "Profit Margin": return { low: 10, high: 20 };
            default: return { low: 0, high: 0 };
        }
    }
    
    else if (industry === "Semiconductors") {
        switch (measure) {
            case "PE":  return { low: 30, high: 70 };
            case "Growth": return { low: 5, high: 15 };
            case "Profit Margin": return { low: 5, high: 15 };
            default: return { low: 0, high: 0 };
        }
    }

    else if (industry === "Media") {
        switch (measure) {
            case "PE":  return { low: 18, high: 30 };
            case "Growth": return { low: 5, high: 15 };
            case "Profit Margin": return { low: 5, high: 15 };
            default: return { low: 0, high: 0 };
        }
    }
}